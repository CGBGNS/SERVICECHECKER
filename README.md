# Genesys Service Checker - GitHub Pages Version

This project converts the original local Python script into a static browser app that can be hosted on GitHub Pages.

## Why this version uses browser authentication

A GitHub Pages site is a static frontend, so it must not store a client secret. This project uses OAuth Authorization Code with PKCE in the browser instead of the client credentials flow used by the Python script.

## Files

- `index.html` - page structure
- `styles.css` - page styling
- `app.js` - authentication, API calls, validation logic, and on-screen logging
- `config.js` - your editable runtime settings
- `config.js.example` - template copy of the config

## Genesys Cloud setup

1. Create or update an OAuth client for this app.
2. Configure the redirect URI to match your GitHub Pages URL exactly, for example:
   - `https://your-user.github.io/your-repo/`
3. Use a browser-safe OAuth flow for the app.
4. Ensure the signed-in user and OAuth client have the permissions/scopes required by the APIs the checker calls.

## App setup

1. Edit `config.js`
2. Set:
   - `clientId`
   - `environment` (example: `mypurecloud.de`)
   - `redirectUri`
   - `scopes` if you want to request them explicitly
3. Push the files to a GitHub repository.
4. Enable GitHub Pages for the repository.

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
