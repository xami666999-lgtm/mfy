# Auto-updates via GitHub (Almasslol/mfy)

## One-time setup

1. Create a **public** repo: https://github.com/new  
   - Owner: `Almasslol`  
   - Name: `mfy`  
   - Public (easiest for free updates)

2. On your PC, install deps and login to GitHub CLI or set a token:

```bash
# GitHub personal access token with `repo` scope
set GH_TOKEN=ghp_your_token_here
```

3. Build and publish a release:

```bash
npm install
npm run release
```

That uploads the Windows installer + `latest.yml` to **GitHub Releases** for `Almasslol/mfy`.

4. Users install once from that Release. Later versions auto-check on launch and via **Settings → Check Updates**.

## Version bumps

Before each release, bump `"version"` in `package.json` (e.g. `1.1.1`).

## Notes

- Auto-update works only in **packaged** `.exe` builds, not `electron:dev`.
- Keep API keys out of the public repo (use Settings / local `.env`).
