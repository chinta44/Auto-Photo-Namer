package com.chinta44.autophotonamer;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int CAMERA_LOCATION_PERMISSION_REQUEST = 1001;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };

    // NOTE: We intentionally do NOT override the WebView's WebChromeClient here.
    // Capacitor's own BridgeWebChromeClient (set automatically by BridgeActivity)
    // already correctly handles both:
    //   - getUserMedia() camera/mic permission requests (onPermissionRequest)
    //   - <input type="file"> file picker dialogs (onShowFileChooser)
    // A previous version of this file replaced the WebChromeClient with a bare
    // one that only implemented onPermissionRequest, which fixed the camera but
    // silently broke every file-picker button (upload photo, restore backup, etc).
    // Requesting the runtime permissions up front (below) is enough on its own.

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestAppPermissionsIfNeeded();
    }

    private void requestAppPermissionsIfNeeded() {
        boolean needsRequest = false;
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                needsRequest = true;
                break;
            }
        }
        if (needsRequest) {
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, CAMERA_LOCATION_PERMISSION_REQUEST);
        }
    }
}
