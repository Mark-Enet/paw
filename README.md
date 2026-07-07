# PAW — Payload Analysis Wingman

A fast, offline-capable JSON/XML viewer, formatter, and diff tool. Paste or upload a
document to explore it as a searchable tree, validate it with precise error locations,
convert JSON ↔ XML, query with JSONPath / XPath, and diff two documents.

## Notes

- The tool saves your document, theme, and layout to the browser's local storage and
  restores them on reload. "Share link" (or ⌘/Ctrl+S) encodes the current state into a
  URL you can bookmark or send.
- All assets, including fonts and runtime dependencies, are served from this repo.
  The app works fully offline once loaded from static files.
- To update the app, commit the changed static files (typically `index.html`, `css/main.css`,
  `js/app.js`, `js/dc-runtime.js`, `js/icons.js`, and any assets under `fonts/`).
- App metadata shown in the About dialog lives in `version.json`. Update the `version`
  field there when preparing a release to `main`.

## Tests

- Run the XML array detection regression test:
  `node --test tests/xml-array-detection.test.js`
