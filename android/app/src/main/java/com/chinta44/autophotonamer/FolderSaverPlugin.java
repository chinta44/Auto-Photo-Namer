package com.chinta44.autophotonamer;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Lets the user pick a folder once (Storage Access Framework) and then writes files straight into it,
 * without the share sheet. The permission is persisted, so it keeps working after the app restarts.
 *
 * JS side: src/utils/folderSaver.ts
 */
@CapacitorPlugin(name = "FolderSaver")
public class FolderSaverPlugin extends Plugin {

    @PluginMethod
    public void pickFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
                | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        startActivityForResult(call, intent, "pickFolderResult");
    }

    @ActivityCallback
    private void pickFolderResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Folder selection was cancelled", "CANCELLED");
            return;
        }
        Uri treeUri = data.getData();
        try {
            getContext()
                .getContentResolver()
                .takePersistableUriPermission(
                    treeUri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                );
        } catch (Exception e) {
            call.reject("Could not keep access to the selected folder", "PERMISSION_FAILED", e);
            return;
        }
        JSObject ret = new JSObject();
        ret.put("uri", treeUri.toString());
        ret.put("name", folderDisplayName(treeUri));
        call.resolve(ret);
    }

    @PluginMethod
    public void checkFolder(PluginCall call) {
        String uriString = call.getString("uri");
        JSObject ret = new JSObject();
        if (uriString == null || uriString.isEmpty()) {
            ret.put("valid", false);
            call.resolve(ret);
            return;
        }
        Uri treeUri = Uri.parse(uriString);
        boolean valid = hasWritePermission(treeUri) && folderExists(treeUri);
        ret.put("valid", valid);
        if (valid) {
            ret.put("name", folderDisplayName(treeUri));
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String uriString = call.getString("uri");
        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String data = call.getString("data");
        if (uriString == null || filename == null || data == null) {
            call.reject("uri, filename and data are required", "BAD_ARGS");
            return;
        }

        Uri treeUri = Uri.parse(uriString);
        if (!hasWritePermission(treeUri)) {
            call.reject("No permission for the selected folder. Please pick the folder again.", "NO_PERMISSION");
            return;
        }

        ContentResolver resolver = getContext().getContentResolver();
        try {
            String treeDocId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri parentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, treeDocId);
            if (!folderExists(treeUri)) {
                call.reject("The selected folder no longer exists. Please pick the folder again.", "FOLDER_GONE");
                return;
            }

            // Never overwrite: name.jpg -> name_2.jpg -> name_3.jpg ...
            String finalName = uniqueName(filename, listChildNames(resolver, treeUri, treeDocId));

            Uri fileUri = DocumentsContract.createDocument(resolver, parentUri, mimeType, finalName);
            if (fileUri == null) {
                call.reject("Could not create the file in the selected folder", "CREATE_FAILED");
                return;
            }

            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            try (OutputStream out = resolver.openOutputStream(fileUri, "w")) {
                if (out == null) {
                    call.reject("Could not open the new file for writing", "WRITE_FAILED");
                    return;
                }
                out.write(bytes);
                out.flush();
            }

            JSObject ret = new JSObject();
            ret.put("savedName", finalName);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Saving to the selected folder failed: " + e.getMessage(), "WRITE_FAILED", e);
        }
    }

    // ------------------------------------------------------------------ helpers

    private boolean hasWritePermission(Uri treeUri) {
        for (UriPermission permission : getContext().getContentResolver().getPersistedUriPermissions()) {
            if (permission.getUri().equals(treeUri) && permission.isWritePermission()) {
                return true;
            }
        }
        return false;
    }

    private boolean folderExists(Uri treeUri) {
        try {
            String docId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
            try (
                Cursor c = getContext()
                    .getContentResolver()
                    .query(docUri, new String[] { DocumentsContract.Document.COLUMN_DOCUMENT_ID }, null, null, null)
            ) {
                return c != null && c.moveToFirst();
            }
        } catch (Exception e) {
            return false;
        }
    }

    private String folderDisplayName(Uri treeUri) {
        String docId = "";
        try {
            docId = DocumentsContract.getTreeDocumentId(treeUri);
            Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
            try (
                Cursor c = getContext()
                    .getContentResolver()
                    .query(docUri, new String[] { DocumentsContract.Document.COLUMN_DISPLAY_NAME }, null, null, null)
            ) {
                if (c != null && c.moveToFirst()) {
                    String name = c.getString(0);
                    if (name != null && !name.isEmpty()) {
                        return name;
                    }
                }
            }
        } catch (Exception e) {
            // fall through to the fallback below
        }
        int slash = docId.lastIndexOf('/');
        int colon = docId.lastIndexOf(':');
        String fallback = docId.substring(Math.max(slash, colon) + 1);
        return fallback.isEmpty() ? "Selected folder" : fallback;
    }

    private Set<String> listChildNames(ContentResolver resolver, Uri treeUri, String treeDocId) {
        Set<String> names = new HashSet<>();
        Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, treeDocId);
        try (
            Cursor c = resolver.query(
                childrenUri,
                new String[] { DocumentsContract.Document.COLUMN_DISPLAY_NAME },
                null,
                null,
                null
            )
        ) {
            if (c != null) {
                while (c.moveToNext()) {
                    String name = c.getString(0);
                    if (name != null) {
                        names.add(name.toLowerCase(Locale.ROOT));
                    }
                }
            }
        }
        return names;
    }

    static String uniqueName(String filename, Set<String> existingLowerCase) {
        if (!existingLowerCase.contains(filename.toLowerCase(Locale.ROOT))) {
            return filename;
        }
        int dot = filename.lastIndexOf('.');
        String base = dot > 0 ? filename.substring(0, dot) : filename;
        String ext = dot > 0 ? filename.substring(dot) : "";
        for (int i = 2; i < 10000; i++) {
            String candidate = base + "_" + i + ext;
            if (!existingLowerCase.contains(candidate.toLowerCase(Locale.ROOT))) {
                return candidate;
            }
        }
        return base + "_" + System.currentTimeMillis() + ext;
    }
}
