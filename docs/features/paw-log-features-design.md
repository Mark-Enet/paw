# PAW Log Support — Feature Proposal

## Goal
Bury (Sanitize) exposed a gap: PAW's Dig/Spot/Bury pipelines all assume the input is
JSON, XML, or (for Bury only) freeform text with embedded JSON/XML fragments. A large
share of real troubleshooting input — especially rows copied out of a ServiceNow list
view with the snutils browser extension (syslog, script log statements, transaction
logs) — is tabular text: CSV, TSV, or a Markdown table. None of the three modes
understand that shape today.

This doc proposes features to close that gap across all three existing modes, written
from the perspective of a ServiceNow developer whose common loop is:
paste a snutils export → find/read the relevant rows → strip anything sensitive →
hand the result (often alongside a script excerpt) to an AI for refactoring or
troubleshooting help.

Per discussion, this stays additive to the three existing modes (Dig, Spot, Bury) —
no new top-level tab. PAW stays generic (any CSV/TSV/MD-table or freeform log should
work), with ServiceNow-specific defaults layered on as data, the same way the
"ServiceNow" Sanitize profile is just a rule-set on top of a generic engine.

## Grounding in the current codebase
- Three modes: **Dig** (`mode: 'format'`) — tree/table explorer, JSONPath/XPath,
  search; **Spot** (`mode: 'diff'`) — two-pane diff; **Bury** (`mode: 'sanitize'`) —
  redaction, in `js/sanitize.js` + `js/sanitize-rules-default.js`.
- Format detection is binary everywhere: `detect()`/`parse()` in `js/app.js` and
  `analyze()` in `js/sanitize.js` only branch on JSON vs. XML vs. (Bury-only)
  freeform. There's no CSV/TSV/Markdown-table awareness anywhere.
- Bury already has the right shape for logs and needs no rework, just a third input
  shape: a rule engine (KeyRule by field name, PatternRule by value shape), a two-pass
  freeform handler (bracket-matching fragment extraction + regex sweep), and a
  deterministic `Map<original, fake>` mapping (`getOrCreateFake`) so a recurring
  sys_id/correlation id redacts identically everywhere it appears — exactly what
  multi-row log exports need.
- Dig already renders arrays-of-objects as a table (`tableRows`/`recordTableRows`,
  `view === 'table'`). A tabular format parsed into the same array-of-record shape
  JSON already produces gets Dig's table view for free.
- Cross-mode hand-off already exists (`HANDOFF_TARGETS`, `renderSendToMenu`): Bury's
  input/output panes can already be sent to Dig or either Spot slot. New features
  should reuse this rather than invent new plumbing.

## Shared foundation: a table/log input format
Add `table` as a third detected format, sniffed the same way everywhere (delimiter
detection for CSV vs. TSV, Markdown-table pipe/dash-row detection, quoted-field
handling, header row assumed present since snutils exports always include one).
Parse into the same array-of-plain-objects shape the JSON path already produces, so:
- Dig's existing table view renders it with no new rendering code.
- Bury's `findStructuralHits` leaf walker works unchanged — a column header is just a
  "key" to match KeyRules against.
- Spot can diff it row-by-row (see below) using the same row objects.

Reassembly for Bury's output must round-trip back to the *original* tabular format
(CSV/TSV/MD) preserving column order and delimiter, the same way XML reassembly today
preserves original whitespace rather than re-pretty-printing.

## Bury (Sanitize) — P0: tabular + log-specific rules
1. **Native CSV/TSV/Markdown-table sanitization.** KeyRules matched against column
   headers (e.g. `caller_id`, `u_phone` as header names instead of JSON keys),
   PatternRules against cell text — the existing rule engine, a new input adapter.
2. **Column-position fallback rule** ("column 3") for exports with blank/duplicate
   headers, which snutils occasionally produces for computed/related-list columns.
3. **A "ServiceNow Logs" rule sub-profile**, layered on the existing "ServiceNow"
   profile: `transaction_id` / `x_transaction_id`, `session_id`, `source`, plus a
   pattern rule for sys_ids embedded in `nav_to.do?...sys_id=`-style URLs, which show
   up constantly in syslog/script-log `message` columns and aren't caught by the
   existing bare-hex32 pattern rule because they're inside a URL.
4. **Decode-then-scan for encoded fragments.** Script/syslog message columns often
   carry base64 or URL-encoded blobs (serialized request/response bodies). Recurse
   the freeform two-pass scan into decoded content before emitting matches, so PII
   hidden inside an encoded fragment isn't a silent false negative — this is a direct
   extension of the existing freeform embedded-fragment detector
   (`findEmbeddedFragments`), just adding a decode step before the bracket-match pass.
5. **P1 — "Package for AI" export.** One button producing a single copy-ready block:
   a short auto-header (source table/query, row count, time range) plus the sanitized
   log excerpt, optionally alongside a pasted script snippet in the same clipboard
   payload. This directly serves the stated workflow — troubleshooting a script by
   handing an AI the (sanitized) log lines that correlate with it — and turns a
   multi-step "sanitize, then separately explain what this is" habit into one action.

## Dig (Explorer) — P0: parsing and reading logs
1. Accept table-format input end to end via the shared detector — not just for Bury.
2. **Log-aware table rendering.** Auto-detect a level/severity column (Error/Warn/
   Info/Debug — common in ServiceNow's syslog and script log) and color rows using
   the existing token/syntax color scheme; auto-detect a timestamp column for
   relative-time display and correct chronological sort (ServiceNow list views
   default-sort by sys_created_on descending, which reads backwards for tracing a
   sequence of events).
3. **Multi-row stitching.** A single logical log entry (a stack trace, a multi-line
   script output) is often copied out of a list view as several rows with a blank
   level/source on the continuation rows. Add a toggle to merge those into one
   logical entry so it reads as a block instead of fragments — this is the single
   biggest readability win for ServiceNow script logs specifically.
4. **Level/keyword filter chips** over the table view (Error/Warn/Info toggle plus
   free text), layered on the existing search/filter (`explorerMode`) infrastructure
   rather than a parallel filter system.
5. **A lightweight column-filter query mode** for tabular logs (e.g. `level=Error &&
   source~"MyScript"`), reusing the existing query-match-paths plumbing that already
   backs JSONPath/XPath query mode.
6. **P1 — one-click base64/URL-decode-in-place** on a cell/leaf, to inspect an
   encoded payload inline before deciding whether it needs sanitizing or copying out.

## Spot (Diff) — P0: comparing log captures
1. **Row-keyed table diff.** When both sides are tabular, diff by a chosen key column
   (sys_id, correlation id, or line number) instead of raw line-by-line text diff, so
   two exports that are paged or sorted differently still diff sensibly instead of
   showing a wall of false changes.
2. **Noise suppression before diffing.** Reuse Bury's PatternRule concept to
   normalize or blank volatile fields (timestamps, durations, sys_ids that are
   expected to differ) before diffing two troubleshooting runs, so the diff surfaces
   the actual behavioral change instead of every timestamp.
3. Bury's output can already be sent into Spot's A/B slots via the existing hand-off
   menu (`renderSendToMenu` on `sanitizeOutput`) — this doc calls out "diff two
   sanitized logs side by side" as a supported workflow on top of existing plumbing,
   not something new to build.

## Priority
- **P0** (map to the top three workflows called out): Bury tabular sanitization
  (#1–3 above), Dig table/log parsing + stitching + filtering (#1–4), Spot row-keyed
  diff + noise suppression (#1–2).
- **P1 / nice-to-have**: "Package for AI" export, decode-then-scan for encoded
  fragments, decode-in-place in Dig, column-position fallback rule.

## Open questions for implementation
- Markdown-table detection needs to not misfire on Markdown-formatted prose pasted
  for other reasons — gate it on the pipe-row + dash-separator-row pattern, not just
  "contains a `|`".
- Row-keyed diff needs a sensible default key-column guess (prefer `sys_id`, then any
  column literally named `id`, else fall back to positional/text diff) with a manual
  override, since not every export has an obvious key.
- Stitching heuristic (what counts as a "continuation row") should be a small,
  editable rule too, consistent with how Bury already treats rules as data rather
  than hardcoded logic.
