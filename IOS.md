# MFY on iPhone

The phone app is a small WKWebView shell around the live MFY site, so playback, sign-in data in the WebView, and updates stay the same as the site. You sign the IPA yourself.

## Install from Windows or a Mac

1. Download [MFY.ipa](https://xami666999-lgtm.github.io/mfy/MFY.ipa). It is **unsigned**.
2. Install [Sideloadly](https://sideloadly.io/).
3. Plug the iPhone in and trust the computer.
4. Sideloadly → drop `MFY.ipa` → your Apple ID → Start.
5. On the iPhone: Settings → General → VPN & Device Management → trust that Apple ID.

A free Apple ID install lasts about **7 days**, then sideload again. That is Apple, not MFY.

Xcode works too: open the IPA after Sideloadly, or sign `ios-shell` with your own Team. Bundle id is `com.mfystream.app`.

## What the phone wrap includes

Same catalogs, home, and player. Progress stays in the phone WebView. No extra camera, photos, or location permissions. The home hero shows the date, genres, quoted title, synopsis, and IMDb / TMDB / Rotten Tomatoes / Metacritic when those scores exist.