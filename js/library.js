// js/library.js — PAW Payload Library: named, multi-document persistence
// shared by Dig/Spot A/Spot B/Bury. Exposed as window.PAW_LIBRARY.
//
// This module owns its own localStorage key and its own quota-failure
// semantics, deliberately different from the scratch-content persistence in
// js/app.js's persistNow(): a library record is something the user explicitly
// named and saved, so it is never silently dropped/truncated the way an
// unsaved scratch buffer may be — a save that doesn't fit returns a typed
// error instead. Mirrors the existing self-contained-engine shape of
// js/sanitize.js (its own LS key, its own CRUD) and js/table.js.
//
// Client-side only: no network calls, no external dependencies. Format
// detection is intentionally NOT done here (this module doesn't know about
// app.js's parser) — callers pass an already-computed `format` string.

(function () {
  var LIBRARY_LS_KEY = 'paw.library.v1';
  var NAME_MAX_LEN = 160;
  // A single record larger than this is rejected at save time with a clear
  // error rather than risking a generic localStorage quota exception.
  var LIBRARY_ITEM_MAX = 2000000;
  // Approximate, conservative total-budget ceiling used only to drive a
  // usage indicator in the UI — real per-origin localStorage limits vary
  // (commonly ~5-10MB) and are never queried directly.
  var LIBRARY_BUDGET_BYTES = 4500000;

  function byteLength(str) {
    try { return new TextEncoder().encode(str).length; } catch (e) { return String(str == null ? '' : str).length; }
  }

  function genId() {
    return 'lib_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function slotLabel(slot) {
    return slot === 'dig' ? 'Dig' : slot === 'spotA' ? 'Spot A' : slot === 'spotB' ? 'Spot B' : slot === 'bury' ? 'Bury' : 'PAW';
  }

  function isValidRecordShape(r) {
    return !!r && typeof r === 'object' && typeof r.id === 'string' && typeof r.content === 'string';
  }

  function loadRecords() {
    try {
      var raw = localStorage.getItem(LIBRARY_LS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isValidRecordShape) : [];
    } catch (e) { return []; }
  }

  function saveRecords(records) {
    try { localStorage.setItem(LIBRARY_LS_KEY, JSON.stringify(records)); return { ok: true }; }
    catch (e) { return { ok: false, error: 'quota' }; }
  }

  // Newest-first — the order the Library browser lists records in.
  function list() {
    return loadRecords().sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
  }

  function get(id) {
    return loadRecords().find(function (r) { return r.id === id; }) || null;
  }

  function create(input) {
    var content = typeof (input && input.content) === 'string' ? input.content : '';
    if (byteLength(content) > LIBRARY_ITEM_MAX) return { ok: false, error: 'too-large', limitBytes: LIBRARY_ITEM_MAX };
    var records = loadRecords();
    var now = Date.now();
    var record = {
      id: genId(),
      name: String((input && input.name) || '').trim().slice(0, NAME_MAX_LEN) || 'Untitled',
      content: content,
      format: (input && input.format) || 'text',
      originMode: (input && input.originMode) || 'dig',
      createdAt: now,
      updatedAt: now,
      size: byteLength(content),
    };
    records.push(record);
    var res = saveRecords(records);
    return res.ok ? { ok: true, record: record } : { ok: false, error: res.error };
  }

  // Merges `patch` (any of name/content/format/originMode) into the record.
  // A content change re-checks the size cap and refreshes `size`/`updatedAt`.
  function update(id, patch) {
    var records = loadRecords();
    var idx = records.findIndex(function (r) { return r.id === id; });
    if (idx === -1) return { ok: false, error: 'not-found' };
    var p = patch || {};
    if (typeof p.content === 'string' && byteLength(p.content) > LIBRARY_ITEM_MAX) {
      return { ok: false, error: 'too-large', limitBytes: LIBRARY_ITEM_MAX };
    }
    var next = Object.assign({}, records[idx], p);
    if (typeof p.name === 'string') next.name = p.name.trim().slice(0, NAME_MAX_LEN) || records[idx].name;
    next.updatedAt = Date.now();
    next.size = byteLength(next.content);
    records[idx] = next;
    var res = saveRecords(records);
    return res.ok ? { ok: true, record: next } : { ok: false, error: res.error };
  }

  function remove(id) {
    var records = loadRecords();
    var next = records.filter(function (r) { return r.id !== id; });
    if (next.length === records.length) return { ok: false, error: 'not-found' };
    var res = saveRecords(next);
    return res.ok ? { ok: true } : { ok: false, error: res.error };
  }

  function duplicate(id, newName) {
    var records = loadRecords();
    var src = records.find(function (r) { return r.id === id; });
    if (!src) return { ok: false, error: 'not-found' };
    if (byteLength(src.content) > LIBRARY_ITEM_MAX) return { ok: false, error: 'too-large', limitBytes: LIBRARY_ITEM_MAX };
    var now = Date.now();
    var record = Object.assign({}, src, {
      id: genId(),
      name: String(newName || (src.name + ' copy')).trim().slice(0, NAME_MAX_LEN) || 'Untitled',
      createdAt: now,
      updatedAt: now,
    });
    records.push(record);
    var res = saveRecords(records);
    return res.ok ? { ok: true, record: record } : { ok: false, error: res.error };
  }

  function usage() {
    var records = loadRecords();
    var bytes = 0;
    records.forEach(function (r) { bytes += byteLength(r.content); });
    return { bytes: bytes, count: records.length, limitBytes: LIBRARY_BUDGET_BYTES };
  }

  // One-time upgrade path: if this browser has never written LIBRARY_LS_KEY,
  // fold any non-blank legacy scratch content (today's single-slot `input`/
  // `diffA`/`diffB`) into the user's first library records, so upgrading
  // doesn't orphan or destroy work in progress. Returns a libraryLinks-shaped
  // map of the slots that got a record (caller merges it with slot defaults),
  // or null if migration had already run before.
  //
  // `options.sampleDiffA`/`sampleDiffB` let the caller pass its built-in
  // sample-pair constants so the untouched default Spot content (which
  // persistNow() saves unconditionally, sample or not) isn't mistaken for
  // real user work and migrated as a spurious "Sample" entry for every
  // upgrading user. `options.detectFormat(text)` lets the caller supply its
  // own format auto-detection (this module doesn't parse content).
  function migrateLegacyIfNeeded(legacy, options) {
    var alreadyMigrated;
    try { alreadyMigrated = localStorage.getItem(LIBRARY_LS_KEY) !== null; }
    catch (e) { alreadyMigrated = true; }
    if (alreadyMigrated) return null;

    var opts = options || {};
    var detectFormat = typeof opts.detectFormat === 'function' ? opts.detectFormat : function () { return 'text'; };
    var records = [];
    var links = {};
    var now = Date.now();

    function migrateSlot(slot, text, name, skipIfEquals) {
      var t = typeof text === 'string' ? text : '';
      if (!t.trim()) return;
      if (skipIfEquals != null && t === skipIfEquals) return;
      var record = {
        id: genId(),
        name: (name && String(name).trim().slice(0, NAME_MAX_LEN)) || ('Untitled (' + slotLabel(slot) + ')'),
        content: t,
        format: detectFormat(t),
        originMode: slot,
        createdAt: now,
        updatedAt: now,
        size: byteLength(t),
      };
      records.push(record);
      links[slot] = { id: record.id, dirty: false };
    }

    var L = legacy || {};
    migrateSlot('dig', L.input, L.sourceName, null);
    migrateSlot('spotA', L.diffA, null, opts.sampleDiffA);
    migrateSlot('spotB', L.diffB, null, opts.sampleDiffB);
    // Write even when nothing migrated, so LIBRARY_LS_KEY now exists and
    // this routine never runs again for this browser.
    saveRecords(records);
    return links;
  }

  window.PAW_LIBRARY = {
    list: list,
    get: get,
    create: create,
    update: update,
    remove: remove,
    duplicate: duplicate,
    usage: usage,
    migrateLegacyIfNeeded: migrateLegacyIfNeeded,
    LIBRARY_ITEM_MAX: LIBRARY_ITEM_MAX,
    LIBRARY_BUDGET_BYTES: LIBRARY_BUDGET_BYTES,
  };
})();
