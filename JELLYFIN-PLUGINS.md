# Add Jellyfin plugins to MFY (Windows)

Plugins run in a **local Jellyfin Server** that MFY starts on your PC (`http://127.0.0.1:8096`). They are not loaded by React.

## One-time

1. Install the latest **Windows** MFY (`restore-168-intro` / Setup exe).
2. Open MFY → **More / Settings** → or the **Jellyfin** page.
3. Click **Start local Jellyfin**.
4. First start downloads official Jellyfin for Windows (large). Wait.
5. Browser opens `http://127.0.0.1:8096` — finish Jellyfin’s own wizard (user + media folders).
6. In MFY Settings, Jellyfin Server = `http://127.0.0.1:8096`. Create an API key in Jellyfin Dashboard → API Keys and paste it.

## Add a plugin

**A. From MFY**

1. Jellyfin page → **Install plugin file** → pick the plugin `.zip` or `.dll`.
2. Or paste a **direct zip URL** → Install from URL.
3. MFY copies it to `%APPDATA%\mfy\jellyfin\data\plugins\` and restarts the sidecar.

**B. From Jellyfin Dashboard**

1. Click **Open dashboard**.
2. Catalog / Repositories → add the plugin repo (example SleekFin: `https://raw.githubusercontent.com/varunaditya-plus/SleekFin/main/manifest.json`).
3. Install → restart when Jellyfin asks.

**C. Drop files yourself**

1. Click **Open plugins folder**.
2. Unzip the plugin into that folder.
3. Stop / Start local Jellyfin in MFY.

## SleekFin look

SleekFin skins **Jellyfin Web**, not MFY’s home rows. After it is installed, open the dashboard (or a webview at `http://127.0.0.1:8096`) to see that theme. MFY’s own home stays MFY unless you browse that URL.

SleekFin also wants the **File Transformation** plugin. Install that first from its repo, then SleekFin.

## Notes

- Windows only. iPhone cannot run this sidecar.
- Jellyfin is GPL; MFY downloads their official binary into your user data. We do not copy their source into the MFY repo.
- Folder: `%APPDATA%\mfy\jellyfin\`
