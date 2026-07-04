# PAW — Payload Analysis Wingman

A fast, offline-capable JSON/XML viewer, formatter, and diff tool. Paste or upload a
document to explore it as a searchable tree, validate it with precise error locations,
convert JSON ↔ XML, query with JSONPath / XPath, and diff two documents.

## Notes

- The tool saves your document, theme, and layout to the browser's local storage and
  restores them on reload. "Share link" (or ⌘/Ctrl+S) encodes the current state into a
  URL you can bookmark or send.
- Fonts load from Google Fonts (needs a connection). Everything else runs locally in the
  browser — no data ever leaves the page.
- To update the page later, replace `index.html` with a newer build and commit.
