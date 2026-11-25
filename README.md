# Genesys Service Checker - GitHub Pages Version

This project converts the original local Python script into a static browser app that can be hosted on GitHub Pages.

## Why this version uses browser authentication

A GitHub Pages site is a static frontend, so it must not store a client secret. This project uses OAuth Authorization Code with PKCE in the browser instead of the client credentials flow used by the Python script.

## Files

- `index.html` - page structure
- `styles.css` - page styling
- `app.js` - authentication, API calls, validation logic, and on-screen logging
- `config.js` - your editable runtime settings (environment, redirect URI, scopes)
- `config.js.example` - template copy of the config

## Genesys Cloud setup

1. Create or update an OAuth client for this app (grant type: **Code Authorization** with PKCE, no client secret).
2. Configure the redirect URI to match your GitHub Pages URL exactly, for example:
   - `https://your-user.github.io/your-repo/`
3. Ensure the signed-in user and OAuth client have the permissions/scopes required by the APIs the checker calls.

## App setup

1. Edit `config.js`
2. Set:
   - `environment` (example: `mypurecloud.de`)
   - `redirectUri`
   - `scopes` if you want to request them explicitly
3. Push the files to a GitHub repository.
4. Enable GitHub Pages for the repository.

## Signing in (Client ID is not stored in the code)

The OAuth **Client ID is never hardcoded or committed**. When you press **Sign in** (or run any action without an active session), a dialog asks you to type the Client ID of your OAuth client.

- The value is validated (it must be a UUID) before redirecting to Genesys Cloud.
- It is kept in `sessionStorage` only for the duration of the redirect, because the page reloads and the token exchange needs it. It is deleted as soon as the sign-in completes, fails, or you sign out.
- The next sign-in asks for it again.

## DNIS checker

Pick a country (three-letter code) and type a phone number. The app:

1. Finds the datatable named `{COUNTRY}_V_DNIS` (for example `ESP_V_DNIS`, exact name match) and gets its id.
2. Looks up the number as the row key and reads the `action` and `destination` columns.
3. Acts on `action`:
   - `Transfer_service`: runs the existing service check using `destination` as the service (the DNIS log is kept above the service check).
   - `Transfer_flow`: checks that a flow named `destination` exists in Architect.
   - `Transfer_number`, `BPO`, `Callback`, `Disconnect`: shows the destination for information only.

Any other `action` value is reported as an error. The number must match the datatable key exactly (spaces are removed; a leading `+` is not added or removed).

## Add users to a group (bulk)

Bulk tools -> **Add to group**.

1. Choose the group from the dropdown. The list is loaded from `GET /api/v2/groups` (all pages) the first time you open the tab after signing in. Use the filter box to narrow it and **Reload** to refresh it.
2. Upload a `.txt` file with one email per line (a CSV with an `Email` header also works).
3. Press **Add users to group**. For each email the app finds the user (`POST /api/v2/users/search`, exact email) and adds them with `POST /api/v2/groups/{id}/members`, pausing 0.5 s between users.

Blank lines, invalid emails and duplicates are skipped with a warning. Users that are not found and HTTP errors are reported per email. A 429 response is retried automatically. If the API asks for the group `version`, the request is retried once with it.

## Assign a role to users (bulk)

Bulk tools -> **Role update**.

1. Choose the **division** (from `GET /api/v2/authorization/divisions`) and the **role** (from `GET /api/v2/authorization/roles`) in the dropdowns. Both lists are loaded the first time you open the tab after signing in, and each has a filter box and a **Reload** button.
2. Upload a `.txt` file with one email per line (a CSV with an `Email` header also works).
3. Press **Assign role to users**. For each email the app finds the user (`POST /api/v2/users/search`, exact email) and grants the role with `POST /api/v2/authorization/subjects/{userId}/divisions/{divisionId}/roles/{roleId}`, pausing 0.5 s between users.

The ids come from the dropdowns, so a role or division name can never end up in the URL. Invalid emails and duplicates are skipped with a warning, and a 429 response is retried automatically.

## Upload canned responses (bulk)

Bulk tools -> **Canned responses**. Upload an Excel (`.xlsx`/`.xls`, first sheet) or CSV file with the columns:

- `TEMPLATENAMEFIN`: the name of the response
- `libraryPrefix`: used to find the response library (`GET /api/v2/responsemanagement/libraries?libraryPrefix=...`, first match; looked up once per prefix)
- `BODY`: the HTML of the response

For each row the app creates the response with `POST /api/v2/responsemanagement/responses` (HTML text, `AGENT_ALIAS` substitution), pausing 1 s between rows, exactly like the original Python script. The body is re-serialised as HTML, `<$Agent.FirstName$>` becomes `{{AGENT_ALIAS}}`, and, as in the script, every `?` is replaced with a space. Untick that option if your bodies contain links with query strings or real question marks.

Excel files are read in the browser with SheetJS, bundled in `vendor/xlsx.full.min.js` (Apache-2.0, see `vendor/xlsx.LICENSE`) and loaded only when needed. Files are never uploaded anywhere except to Genesys Cloud.

## Agent utilization (bulk)

Bulk tools -> **Utilization**. Build the request body with the form: tick the channels to configure (call, callback, chat, email, message, workitem), set the maximum capacity and choose which other channels can interrupt each one. **Edit the request body as JSON** shows the exact body, and edits there update the form (and vice versa). The default is the body of the original script.

Upload a `.txt` file with one email per line. For each user the app calls `PUT /api/v2/routing/users/{userId}/utilization` with the body, pausing 0.5 s between users. The body is validated first (whole-number capacities, valid lists).

## Country mapping

The original Python script only included datatable IDs for:

- PRT
- ESP
- FRA
- BRA

The dropdown includes the other original country codes, but they are marked as not configured yet until you add their IDs in `app.js`.

## What changed from the Python script

- Replaced `input()` prompts with a country dropdown and service textbox
- Replaced terminal `print()` calls with on-page log messages
- Replaced `sys.exit()` with in-page error reporting and a final summary
- Removed the client secret from the frontend
- Fixed several duplicate-name checks so they compare against the correct item name instead of always comparing against the queue name
- Fixed overflow destination checks so each overflow branch validates its own action instead of accidentally reusing the emergency action variable
- Moved the OAuth Client ID out of `config.js`: it is now entered manually in a sign-in dialog
- Redesigned the interface (two-column layout, severity-coded report, light/dark theme) without removing any feature
- Fixed the **Bulk Role Update** form: its submit handler was never attached, so the button did nothing
- Reworked **Role update**: division and role are chosen from dropdowns (ids come from the API) and the file only needs emails. This replaces the old `Division,email,RoleId` CSV, which failed with a 400 when `RoleId` contained a role name instead of an id
- Added keyboard navigation (arrow keys, Home, End) to the bulk tool tabs

## Interface notes

- The **Output** report stays visible next to the controls and counts OK, warning and error lines.
- **Only warnings and errors** hides informational and success lines; **Copy** puts the whole report on the clipboard (with timestamps and severity) for pasting into a ticket.
- Added the **DNIS checker** (see above)
- Added bulk **Add to group** with a group dropdown loaded from `/api/v2/groups` (see above)
- Added bulk **Canned responses** upload (Excel/CSV) and bulk **Utilization** update with a form and a JSON editor
