// js/table.js — PAW table/log format: detects and parses CSV, TSV, and
// Markdown tables (e.g. rows copied out of a ServiceNow list view with the
// snutils browser extension) into the same array-of-plain-objects shape a
// JSON array already takes.
//
// That shape match is deliberate: app.js's buildJson() is generic over any
// JS value, so a parsed table's `value` (array of {header: cellText}
// records) flows through PAW's existing tree/table view, JSONPath query,
// search, and Bury's rule engine (which matches KeyRules against a leaf's
// object key — a column header, in this case) with no new rendering code.
// serialize() is the inverse, used by Bury to reassemble sanitized output
// back into the original tabular format instead of JSON.
//
// Client-side only: no network calls, no external dependencies.

(function () {
  // ============================================================
  // Delimited (CSV/TSV/semicolon) tokenizer — scans the whole text rather
  // than splitting by line first, so a quoted field containing an embedded
  // newline or delimiter is handled correctly (RFC4180-style quoting: a
  // field starting with " ends at the next unescaped ", "" is a literal
  // quote).
  // ============================================================

  function parseDelimited(text, delimiter) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var i = 0;
    var n = text.length;
    while (i < n) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === '"' && field === '') { inQuotes = true; i++; continue; }
      if (ch === delimiter) { row.push(field); field = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += ch; i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  // ============================================================
  // Markdown table parsing (GFM-style: a header row, a `|---|---|`
  // separator row, then data rows — no embedded-newline cells).
  // ============================================================

  var MD_SEP_RE = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

  function splitMdRow(line) {
    var l = line.trim();
    if (l[0] === '|') l = l.slice(1);
    if (l[l.length - 1] === '|') l = l.slice(0, -1);
    var cells = [];
    var cur = '';
    for (var i = 0; i < l.length; i++) {
      var ch = l[i];
      if (ch === '\\' && l[i + 1] === '|') { cur += '|'; i++; continue; }
      if (ch === '|') { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function mdAlignFromSep(cell) {
    var c = cell.trim();
    var left = c[0] === ':', right = c[c.length - 1] === ':';
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  }

  function parseMarkdownTable(trimmedText) {
    var lines = trimmedText.split(/\r\n|\r|\n/).filter(function (l) { return l.trim() !== ''; });
    if (lines.length < 2) return null;
    if (!MD_SEP_RE.test(lines[1].trim())) return null;
    var headers = splitMdRow(lines[0]);
    var aligns = splitMdRow(lines[1]).map(mdAlignFromSep);
    var rows = lines.slice(2).map(splitMdRow);
    return { headers: headers, aligns: aligns, rows: rows };
  }

  // ============================================================
  // Detection — tries Markdown table first (header + dash-separator row is
  // an unambiguous signal), then TSV/CSV/semicolon by requiring at least 2
  // columns and a consistent column count across every row (a single
  // mismatched row means it isn't really tabular data, so we bail out
  // rather than guess).
  // ============================================================

  function tryDelimited(trimmedText, delimiter) {
    var rows = parseDelimited(trimmedText, delimiter);
    // Trailing blank line produces a trailing [''] row artifact — drop it.
    if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
    if (rows.length < 2) return null;
    var headerLen = rows[0].length;
    if (headerLen < 2) return null;
    for (var i = 0; i < rows.length; i++) if (rows[i].length !== headerLen) return null;
    return rows;
  }

  function detect(text) {
    var trimmed = String(text || '').trim();
    if (!trimmed) return null;
    var lines = trimmed.split(/\r\n|\r|\n/);
    if (lines.length < 2) return null;

    if (lines[0].indexOf('|') !== -1) {
      var md = parseMarkdownTable(trimmed);
      if (md && md.headers.length >= 2) return { kind: 'md' };
    }
    if (tryDelimited(trimmed, '\t')) return { kind: 'tsv', delimiter: '\t' };
    if (tryDelimited(trimmed, ',')) return { kind: 'csv', delimiter: ',' };
    if (tryDelimited(trimmed, ';')) return { kind: 'csv', delimiter: ';' };
    return null;
  }

  // ============================================================
  // Parse: detected tabular text -> { format:'table', ok, value, tableMeta }
  // `value` is an array of plain objects (one per data row) — the same
  // shape rootNode()/buildJson() already builds a tree from for a JSON
  // array of records. `tableMeta` carries what's needed to serialize back
  // to the original format.
  // ============================================================

  function normalizeHeaders(rawHeaders) {
    var seen = Object.create(null);
    return rawHeaders.map(function (h, idx) {
      var name = String(h || '').trim();
      if (!name) name = 'column_' + (idx + 1);
      if (seen[name]) name = name + '_' + (idx + 1);
      seen[name] = true;
      return name;
    });
  }

  function toRecords(headers, dataRows) {
    return dataRows.map(function (row) {
      var obj = {};
      headers.forEach(function (h, idx) { obj[h] = row[idx] !== undefined ? row[idx] : ''; });
      return obj;
    });
  }

  function parse(text) {
    var trimmed = String(text || '').trim();
    var det = detect(trimmed);
    if (!det) return { format: 'table', ok: false, error: 'Not a recognized table format (CSV/TSV/Markdown table)' };

    var headers, dataRows, meta;
    if (det.kind === 'md') {
      var md = parseMarkdownTable(trimmed);
      headers = md.headers;
      dataRows = md.rows;
      meta = { kind: 'md', aligns: md.aligns };
    } else {
      var rows = tryDelimited(trimmed, det.delimiter);
      headers = rows[0];
      dataRows = rows.slice(1);
      meta = { kind: det.kind, delimiter: det.delimiter };
    }
    var normHeaders = normalizeHeaders(headers);
    meta.headers = normHeaders;
    meta.originalHeaders = headers;
    return { format: 'table', ok: true, value: toRecords(normHeaders, dataRows), tableMeta: meta };
  }

  // ============================================================
  // Serialize: array-of-objects -> original tabular format. Column order
  // comes from tableMeta.headers (falls back to the first record's own key
  // order if meta is missing, e.g. a caller building table output fresh).
  // ============================================================

  function quoteCsvField(field, delimiter) {
    var s = String(field);
    if (s.indexOf(delimiter) !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function escapeMdCell(field) {
    return String(field).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  }

  function alignToDashes(align) {
    if (align === 'left') return ':---';
    if (align === 'right') return '---:';
    if (align === 'center') return ':---:';
    return '---';
  }

  function serialize(value, meta) {
    var records = Array.isArray(value) ? value : [];
    var headers = (meta && meta.headers) || (records[0] ? Object.keys(records[0]) : []);
    var kind = meta && meta.kind;

    if (kind === 'md') {
      var aligns = (meta && meta.aligns) || [];
      var lines = [];
      lines.push('| ' + headers.join(' | ') + ' |');
      lines.push('| ' + headers.map(function (h, i) { return alignToDashes(aligns[i]); }).join(' | ') + ' |');
      records.forEach(function (rec) {
        lines.push('| ' + headers.map(function (h) { return escapeMdCell(rec[h] != null ? rec[h] : ''); }).join(' | ') + ' |');
      });
      return lines.join('\n');
    }

    var delimiter = (meta && meta.delimiter) || ',';
    var out = [];
    out.push(headers.map(function (h) { return quoteCsvField(h, delimiter); }).join(delimiter));
    records.forEach(function (rec) {
      out.push(headers.map(function (h) { return quoteCsvField(rec[h] != null ? rec[h] : '', delimiter); }).join(delimiter));
    });
    return out.join('\n');
  }

  // ============================================================
  // Log-oriented column heuristics, shared by Dig (level coloring/sort/
  // stitching) and Spot (row-keyed diff). Data-driven and simple on
  // purpose — a wrong guess is just a UI default the user can override,
  // not something these functions need to get exactly right.
  // ============================================================

  var LEVEL_HEADER_CANDIDATES = ['level', 'severity', 'log_level', 'loglevel', 'type'];
  var TIMESTAMP_HEADER_CANDIDATES = ['created', 'sys_created_on', 'timestamp', 'time', 'created_on', 'date'];
  var KEY_HEADER_CANDIDATES = ['sys_id', 'correlation_id', 'transaction_id', 'x_transaction_id', 'id', 'number'];
  var MESSAGE_HEADER_CANDIDATES = ['message', 'details', 'description', 'short_description', 'value', 'text'];

  function guessColumn(headers, candidates) {
    var lower = headers.map(function (h) { return String(h).toLowerCase(); });
    for (var i = 0; i < candidates.length; i++) {
      var idx = lower.indexOf(candidates[i]);
      if (idx !== -1) return headers[idx];
    }
    for (var j = 0; j < candidates.length; j++) {
      for (var k = 0; k < lower.length; k++) {
        if (lower[k].indexOf(candidates[j]) !== -1) return headers[k];
      }
    }
    return null;
  }

  function guessLevelColumn(headers) { return guessColumn(headers, LEVEL_HEADER_CANDIDATES); }
  function guessTimestampColumn(headers) { return guessColumn(headers, TIMESTAMP_HEADER_CANDIDATES); }
  function guessKeyColumn(headers) { return guessColumn(headers, KEY_HEADER_CANDIDATES); }
  // Falls back to the last column (typically where a free-text message
  // lands in a ServiceNow log export) rather than null, since stitching
  // always needs *some* column to append continuation text to.
  function guessMessageColumn(headers) { return guessColumn(headers, MESSAGE_HEADER_CANDIDATES) || headers[headers.length - 1] || null; }

  var LEVEL_ALIASES = {
    error: 'error', err: 'error', critical: 'error', fatal: 'error', severe: 'error',
    warn: 'warn', warning: 'warn',
    info: 'info', information: 'info', notice: 'info',
    debug: 'debug', trace: 'debug', fine: 'debug',
  };

  // Normalizes a raw level cell value ("Error", "WARNING", "3 - Warning",
  // etc.) to one of error/warn/info/debug, or null if unrecognized.
  function normalizeLevel(raw) {
    var s = String(raw || '').toLowerCase();
    var keys = Object.keys(LEVEL_ALIASES);
    for (var i = 0; i < keys.length; i++) {
      if (s.indexOf(keys[i]) !== -1) return LEVEL_ALIASES[keys[i]];
    }
    return null;
  }

  function parseTimestamp(raw) {
    if (raw == null || raw === '') return null;
    var t = Date.parse(raw);
    return isNaN(t) ? null : t;
  }

  // A row is a stitching "continuation" of the previous row when it has no
  // level of its own — every real log entry has one, so a blank level is
  // the strongest signal a row is just an overflow line of the entry above
  // it (a wrapped message/stack trace), the shape ServiceNow list views
  // leave one in when copied as rows. Falls back to a blank timestamp only
  // when there's no level column to go on — a repeated (non-blank)
  // timestamp on a continuation row is plausible and shouldn't defeat this.
  function isContinuationRow(record, levelCol, timeCol) {
    if (levelCol) return String(record[levelCol] || '').trim() === '';
    if (timeCol) return String(record[timeCol] || '').trim() === '';
    return false;
  }

  window.PAW_TABLE = {
    parseDelimited: parseDelimited,
    detect: detect,
    parse: parse,
    serialize: serialize,
    guessLevelColumn: guessLevelColumn,
    guessTimestampColumn: guessTimestampColumn,
    guessKeyColumn: guessKeyColumn,
    guessMessageColumn: guessMessageColumn,
    normalizeLevel: normalizeLevel,
    parseTimestamp: parseTimestamp,
    isContinuationRow: isContinuationRow,
  };
})();
