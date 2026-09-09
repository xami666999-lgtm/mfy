# MFY PocketBase

1. Download PocketBase: https://github.com/pocketbase/pocketbase/releases
2. Run: `./pocketbase serve --http=127.0.0.1:8090`
3. Open http://127.0.0.1:8090/_/ and create an admin, then a normal user (email + password).
4. New collection `mfy_progress` with fields:

- user (Relation → users)
- mediaId (Text, required)
- mediaType (Text)
- season (Number)
- episode (Number)
- progress (Number)
- duration (Number)
- title (Text)
- posterPath (Text)
- completed (Bool)
- watchedAt (Text)
- profileId (Text)

API rules: list/view/create/update = `@request.auth.id != "" && user = @request.auth.id`

5. In MFY Settings → PocketBase, paste `http://127.0.0.1:8090` and the user email/password.

For sync on another PC, put PocketBase on a VPS and use that URL instead.
