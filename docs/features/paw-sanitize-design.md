# PAW Sanitize — Feature Design

## Goal
Add a "Sanitize" mode to PAW that takes a pasted JSON/XML payload or a freeform log (ServiceNow or otherwise) and produces text with identical structure but with sensitive values replaced by plausible fake values — safe to paste into an AI conversation.

v1 is one-way (sanitize only), but architected so v2 can add reversible unmasking (paste an AI reply back and swap fake values back to real) without a rewrite.

---

## Pipeline

```
Input text
   │
   ▼
Format detection (try JSON.parse → try XML parse → else freeform)
   │
   ├── JSON/XML: walk the parsed tree (reuse PAW's existing parser)
   │       for each leaf value: run KeyRules (by key/tag/attr name)
   │       and PatternRules (by value shape) against it
   │
   └── Freeform/log: two-pass
         1. Find embedded JSON/XML fragments (bracket-matching), run
            the structural walker on each fragment
         2. Run PatternRules as a line-scanning regex pass over
            whatever's left
   │
   ▼
Sensitive value detector → replacement generator (deterministic,
type-preserving) → reassembly preserving original formatting
   │
   ▼
Output pane + review list (toggle/edit each detected value)
```

## Rule engine

Two rule types, both user-editable:

- **KeyRule** — matches a JSON key / XML tag or attribute name (case-insensitive, wildcard or regex). E.g. `sys_id`, `caller_id`, `opened_by`, `u_phone`, `*email*`, `*name*`.
- **PatternRule** — matches a value by shape regardless of key. E.g. 32-char hex (sys_id format), email, phone (several formats), IPv4, SSN, credit card, GUID.

Ship a default **"ServiceNow" profile** with the common sys_id/PII fields and patterns pre-loaded. Rules are just data (JSON), so:

- Default rules ship as a JSON file in the PAW repo, git-tracked and edited like code.
- A localStorage override layer holds your customizations per browser/machine.
- Export/import: a button to download the current (default + override) ruleset as JSON, and one to load a ruleset file back in — lets you carry customized profiles between machines without needing them all git-tracked, and lets you share a profile (e.g. hand someone a "ServiceNow" ruleset file).
- Support multiple named profiles (ServiceNow, Generic, etc.) since the tool needs to stay source-agnostic.

**Manual override** (per your answer): let the user highlight any span of text in the input pane and mark "always redact" — this becomes a one-off rule for that session, with an option to promote it into a saved rule.

## Freeform log handling

Since a raw log isn't valid JSON/XML as a whole but often *contains* embedded JSON (`Response body: {...}`), the two-pass approach matters: structural detection catches embedded payloads precisely (types, nesting), and the regex pass mops up sensitive values sitting in plain log lines (e.g. `Caller: John Smith, phone 555-1234` outside any JSON blob).

Recommendation: default to **over-redacting** rather than under-redacting — a false positive is an annoyance you fix in the review list; a false negative leaks data. Free-text name detection without real NER will always be imperfect client-side, so lean on the manual-highlight control and a small common-name-list heuristic rather than promising full coverage there.

## Replacement generation

- Deterministic per session: same original value → same fake value everywhere it appears (so relationships in the payload stay legible to the AI reading the sanitized version).
- Type/shape-preserving generators: same-length hex for sys_id-style values, format-preserving phone numbers, a small fake-name pool, digit-count-preserving numeric IDs, domain-shape-preserving emails.
- Backing structure: a `Map<original, fake>` — this **is** the piece that makes v2 reversibility just an inverse lookup pass, so build it as first-class state now even though v1 only exposes the forward direction. For v1, persist this map to localStorage (accepted trade-off for this release — see Open decisions) rather than only in-memory, so it survives a refresh.

## UI/UX flow

1. Paste/drop input → auto-detect format, run active profile, produce sanitized output (side-by-side or below).
2. **Review list**: each detected value shown (truncated/masked by default), with the rule that matched, the fake replacement, and a toggle to exclude it plus an inline edit for the replacement.
3. Highlight-to-redact in the raw input pane for manual additions.
4. Copy button on the sanitized output.
5. Rules panel to manage/save profiles.
6. Visible session indicator ("14 values mapped this session") + explicit "New session / clear mappings" action, so real values don't linger silently in memory longer than intended.

## Where it lives in PAW

Recommend a separate top-level tab ("Sanitize") alongside Explorer/Formatter/Diff rather than bolting it onto the Explorer view — it's a distinct paste → scrub → copy workflow, not a way of viewing an already-trusted payload.

## Forward path to v2 (reversible)

- Keep the mapping `Map` alive after output generation instead of discarding it.
- Output rendering becomes `render(mapping)`; a future "reverse" mode is `renderReverse(mapping)` run against pasted AI text — regex-replace fake→original, longest-match-first to avoid partial-string collisions (e.g. a short fake ID that's a substring of a longer one).
- No architectural changes needed elsewhere to add this later — it's additive.

## Decisions locked in

- **Rule profiles**: default ruleset is a git-tracked JSON file in the repo; a localStorage layer holds overrides; export/import buttons let you move a full ruleset (default + overrides) as a JSON file between machines or share it.
- **Mapping persistence**: for v1, the real↔fake mapping is allowed to persist in localStorage (not memory-only). This is a real trade-off — the actual sensitive values sit in the browser's storage on whatever machine you sanitized on, not just transient session state. Worth a visible "clear all stored mappings" action and probably a plain note in the UI so it's a conscious choice each time, not a silent default. If this ever needs tightening later (e.g. before sharing the tool with anyone else, or using it on a shared machine), switching the mapping to memory-only is a small, isolated change since it's already its own module.
