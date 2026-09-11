# PAW — Payload Analysis Wingman

A fast, offline-capable JSON / XML / table viewer, formatter, diff tool, and
sanitizer. Paste or upload a document, explore it as a tree or table, validate
it with precise error locations, convert JSON ↔ XML, query with JSONPath /
XPath, diff two payloads, and redact sensitive values before you share.

Live app: [https://paw.widgemo.com](https://paw.widgemo.com)

## Modes

- **Dig** — inspect one payload. Tree, table, and raw views; search; JSONPath /
  XPath query; beautify / minify; JSON ↔ XML.
- **Spot** — two-pane diff of A vs B so you can see what actually changed.
- **Bury** — sanitize / obfuscate. Replaces emails, phones, IDs, sys_ids, and
  other sensitive values with plausible fakes so the structure stays readable
  and the result is safe to paste into an AI chat or a ticket.

Bury is one-way in this release: same original value maps to the same fake
value for the session, so relationships in the payload stay intact. Review
detected hits before you copy. Highlight text to force a redaction. Profiles
(including a ServiceNow default) are editable; export / import the ruleset as
JSON to move it between machines.

## Notes

- The tool saves your document, theme, and layout to the browser's local
  storage and restores them on reload. "Share link" (or ⌘/Ctrl+S) encodes the
  current state into a URL you can bookmark or send.
- In Settings, Remember lets you choose which workspace state categories
  persist. Style, Theme, and Remember preferences themselves are always saved.
- Bury may persist the real↔fake mapping in local storage so a refresh does
  not break consistency. Use the session / clear-mappings control if you are
  on a shared machine.
- All assets, including fonts and runtime dependencies, are served from this
  repo. The app works fully offline once loaded from static files.
- App metadata shown in the About dialog lives in `version.json`. Update the
  `version` field there when preparing a release to `main`.

## Repo layout

Typical files to touch when shipping a UI change:

- `index.html`
- `css/main.css`
- `js/app.js`
- `js/dc-runtime.js`
- `js/icons.js`
- `js/sanitize.js` and `js/sanitize-rules-default.js` (Bury)
- `fonts/`
- `version.json`

Design notes for Bury and log/table work live under `docs/features/`.

## Tests

```bash
node --test tests/xml-array-detection.test.js
node --test tests/jsonpath.test.js
node --test tests/xpath.test.js
node --test tests/sanitize-detect.test.js
node --test tests/sanitize-rules.test.js
node --test tests/table.test.js
node --test tests/timestamp-patterns.test.js