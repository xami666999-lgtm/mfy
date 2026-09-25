# MFY on iPhone / iPad (Capacitor wrap)

This is the same React UI as Windows, packaged as a native iOS shell.
Electron pieces (auto-update exe, VLC/mpv, disk folders, YouTube login BrowserWindow) are stubbed. Catalog, home, logos, and the built-in HLS/DASH player still run in the WebView.

You still need a **Mac + Xcode**. I cannot upload TestFlight from here.

## Free vs TestFlight (so it is not a surprise)

| What | Free Apple ID | Paid Apple Developer ($99/year) |
| --- | --- | --- |
| Run on **your** iPhone from Xcode | Yes, ~7 days, then re-install | Yes |
| Put a build on **TestFlight** for other people | **No** | **Yes** |
| App Store | No | Yes |

People who “did TestFlight for free” were either on someone else’s paid team, or they only sideloaded onto their own phone. TestFlight itself is a paid-program feature.

## One-time on a Mac

```bash
git clone https://github.com/xami666999-lgtm/mfy.git
cd mfy
git checkout restore-168-intro
npm install
npm install @capacitor/core @capacitor/ios @capacitor/cli --save
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```

`npx cap add ios` creates the `ios/` Xcode project (not stored fully in git until you generate it).

In Xcode:

1. Open **App** target → **Signing & Capabilities**
2. Check **Automatically manage signing**
3. Team = your Apple ID (free = your phone only; paid = TestFlight)
4. Bundle ID `com.mfy.app` — change it if Apple says it is taken (`com.yourname.mfy`)
5. Pick your iPhone → **Run**

Allow local network / HTTPS ATS is already using the Capacitor https scheme.

## After UI changes

```bash
npm run ios:sync
npx cap open ios
```

Then Archive in Xcode if you have a paid team:

Product → Archive → Distribute App → **App Store Connect** → TestFlight.

## What works in the wrap

- Home / Movies / TV / Anime / Calendar / YouTube embed / Music / Sport / IPTV UI
- TMDB logos, continue watching in **browser storage** (not the Windows disk file)
- Built-in player for HTTP(S) / HLS / DASH the WebView allows

## What does not port 1:1

- GitHub auto-update `.exe`
- VLC / mpv / picking PC folders
- Electron YouTube login window (use the in-page Google login if the embed asks)
- Background torrent clients

Those stay on the Windows build.
