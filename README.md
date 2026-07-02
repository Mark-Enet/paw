# Refract — JSON & XML Studio

A fast, offline-capable JSON/XML viewer, formatter, and diff tool. Paste or upload a
document to explore it as a searchable tree, validate it with precise error locations,
convert JSON ↔ XML, query with JSONPath / XPath, and diff two documents.

`index.html` is fully self-contained (no build step, no dependencies) — just host the
file anywhere static.

## Publish it as a GitHub Page

1. Create a new repository on GitHub (e.g. `refract`).
2. Upload **`index.html`** (and this `README.md` + `.nojekyll`) to the repo root.
   - Web UI: open the repo → **Add file → Upload files** → drag them in → **Commit changes**.
   - Or via git:
     ```bash
     git init
     git add index.html README.md .nojekyll
     git commit -m "Refract JSON & XML Studio"
     git branch -M main
     git remote add origin https://github.com/<you>/refract.git
     git push -u origin main
     ```
3. In the repo: **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Set **Branch** to `main` and folder to **`/ (root)`**, then **Save**.
6. Wait ~1 minute, then visit:
   **`https://<you>.github.io/<repo>/`**

That's it — the whole app lives in that one file.

## Notes

- The tool saves your document, theme, and layout to the browser's local storage and
  restores them on reload. "Share link" (or ⌘/Ctrl+S) encodes the current state into a
  URL you can bookmark or send.
- Fonts load from Google Fonts (needs a connection). Everything else runs locally in the
  browser — no data ever leaves the page.
- To update the page later, replace `index.html` with a newer build and commit.
