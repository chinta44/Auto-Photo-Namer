// App version - the ONE place to bump on a release (JS side).
// Also update android/app/build.gradle:
//   versionName = same as below, versionCode = major*10000 + minor*100 + patch
//   (e.g. 1.7.1 -> 10701)
// (index.html has ?v= cache-busting strings on the icon links; bumping those is optional.)
export const APP_VERSION = '1.7.1';
