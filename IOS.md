# MFY on iPhone

Phone UI is on. Bottom tabs: Home / Movies / Shows / Anime / More.
Windows title bar and the desktop sidebar stay off on iPhone.

You do **not** need a Mac on your desk if you use **Sideloadly** on Windows.
You still cannot use official TestFlight without Apple’s paid developer program.

## Install on your iPhone from Windows

1. Wait for the GitHub Action **Release iOS IPA** on `restore-168-intro`.
2. Download `MFY.ipa` from the run Artifacts.
3. On the PC install [Sideloadly](https://sideloadly.io/).
4. Plug the iPhone in, trust the PC.
5. Sideloadly → drop `MFY.ipa` → Apple ID → Start.
6. On the iPhone: Settings → General → VPN & Device Management → trust the Apple ID.

Free Apple ID installs last about **7 days**, then you sideload again. That is Apple, not MFY.

## If you have a Mac

```bash
git checkout restore-168-intro
npm install
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```

Xcode → your Team → Run on the iPhone.

## What the phone wrap includes

Same catalogs and player UI. Progress is stored in the phone WebView (not the Windows disk file). No VLC/mpv, no `.exe` auto-update.
