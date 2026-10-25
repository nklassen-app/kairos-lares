# Lares — native Android shell

Capacitor wrapper that loads the hosted page
(<https://nklassen-app.github.io/kairos-lares/>) in Android System WebView, so the
app has its own launcher icon and keeps working while Chrome is blocked.
Content updates ship by pushing to `main` (bump the `sw.js` cache name); the
APK only needs rebuilding for shell changes (icon, app name, config).

## First build (creates `android/`, which is then tracked)

Prerequisites (one-time): JDK 17, Android SDK command-line tools with
`platform-tools`, `platforms;android-34`, `build-tools;34.0.0`, licenses
accepted. Point the build at the SDK with either `ANDROID_HOME` or
`android/local.properties` (`sdk.dir=/path/to/android-sdk`).

```sh
cd native
npm install                # copying kairos-floor/native/node_modules first skips the sharp download
npx cap add android        # once; generates android/ — commit it
npm run build:apk
```

On a small build machine (under 3 GB RAM, no swap) put
`org.gradle.jvmargs=-Xmx1280m` and `org.gradle.workers.max=2` in
`android/gradle.properties` first, or the JVM is killed.

APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`. Transfer to
the phone (Drive is fine) and tap to install; debug-signed, sideload only.
Rebuilds reuse the same auto-generated debug keystore, so they install over
the top without losing data. **The APK is never committed.** Never uninstall
or "Clear data" on the phone: the WebView's localStorage is the only copy.

## Icon

Three SVG masters, one per role (Claude Design exports them as a set per app):
`../icon.svg` is the full icon (also the web/PWA icon, so bump `sw.js` when it
changes); `assets/icon-foreground.svg` and `assets/icon-background.svg` are the
two Android adaptive-icon layers on a 108-unit canvas, glyph inside the central
66 units. `npm run build:apk` rasterizes them (`make-icons.mjs`) and
`capacitor-assets` generates every density plus the adaptive XML. The PNGs in
`assets/` are build output and gitignored; only the SVGs are tracked.

Rebuild later: `npx cap sync android` (only after changing
`capacitor.config.json`), then `npm run build:apk`.
