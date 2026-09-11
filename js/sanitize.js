// js/sanitize.js — PAW Sanitize engine: rule matching, replacement generation,
// and reassembly. Exposed as window.PAW_SANITIZE.
//
// Design: docs/features/paw-sanitize-design.md
//
// This module does NOT reimplement JSON/XML parsing or tree-walking — it is
// handed the same {parseJSON, parseXML, rootNode} functions app.js's
// Component already uses for the Format/Diff tabs (bound to `this` there),
// so the structural walk PAW already has is reused rather than duplicated.
// Serialization uses the plain global JSON.stringify / XMLSerializer APIs
// directly (not app.js's from-scratch pretty-printers) so that XML output in
// particular keeps as much of the original document's whitespace as
// possible — only the specific leaf values that matched a rule are touched.
//
// Client-side only: no network calls, no external dependencies.

(function () {
  var RULES_LS_KEY = 'paw.sanitize.rules.v1';
  var MAPPING_LS_KEY = 'paw.sanitize.mapping.v1';

  // ============================================================
  // Timestamp shape catalogue — shared source of truth for Spot's
  // denoiseForDiff() noise-suppression (js/app.js) and Bury's
  // detectPatternForValue() shape classifier (below), so "what does a
  // timestamp look like" isn't maintained twice. Patterns are plain regex
  // source strings (no flags baked in — callers add 'g'/'gi' as needed).
  // Deliberately does not match bare epoch/Unix numbers (a 10-13 digit
  // number is indistinguishable from an ordinary numeric ID).
  // ============================================================

  var MONTH_NAME_RE = '(?:[Jj]an(?:uary)?|[Ff]eb(?:ruary)?|[Mm]ar(?:ch)?|[Aa]pr(?:il)?|[Mm]ay|[Jj]un(?:e)?|[Jj]ul(?:y)?|[Aa]ug(?:ust)?|[Ss]ep(?:t|tember)?|[Oo]ct(?:ober)?|[Nn]ov(?:ember)?|[Dd]ec(?:ember)?)';

  var TIMESTAMP_PATTERNS = {
    absolute: [
      // Order matters: datetime-with-time variants before their bare-date
      // counterparts, so a full timestamp's date portion isn't left over
      // for the date-only pattern to re-match on a later pass.
      { id: 'ts-iso', label: 'ISO timestamp', pattern: '\\b\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})?\\b' },
      { id: 'ts-us-ampm', label: 'US date + 12h time', pattern: '\\b\\d{1,2}\\/\\d{1,2}\\/\\d{4}[, ]+\\d{1,2}:\\d{2}(?::\\d{2})?\\s?[AaPp][Mm]\\b' },
      { id: 'ts-month-name', label: 'Month-name date/time', pattern: '\\b' + MONTH_NAME_RE + '\\.?\\s+\\d{1,2},?\\s+\\d{4}(?:[, ]+\\d{1,2}:\\d{2}(?::\\d{2})?\\s?[AaPp][Mm]?)?\\b' },
      { id: 'ts-iso-date', label: 'ISO date (no time)', pattern: '\\b\\d{4}-\\d{2}-\\d{2}\\b' },
      { id: 'ts-us-date', label: 'US date (no time)', pattern: '\\b\\d{1,2}\\/\\d{1,2}\\/\\d{4}\\b' },
    ],
    relative: {
      id: 'ts-relative', label: 'Relative time',
      // \b can't anchor immediately before '~' (not a word char), so the
      // optional qualifier and the core phrase get their own \b anchors
      // rather than sharing one leading \b — otherwise a "~5 minutes ago"
      // selection would leave the '~' behind, unmatched.
      pattern: '(?:\\b(?:about|approximately)\\s+|~\\s*)?\\b(?:just now|\\d+\\s?(?:sec|secs|second|seconds|min|mins|minute|minutes|hr|hrs|hour|hours|day|days|wk|wks|week|weeks|mon|mons|month|months|yr|yrs|year|years)\\s+ago)\\b',
    },
  };

  // Chained /g replace passes: absolute patterns first (in order above),
  // then the relative pattern. This naturally composes for "absolute +
  // trailing relative" strings without one monster regex —
  // "09/10/2026 02:03:43 PM about 16 hours ago"
  //   -> (ts-us-ampm pass) -> "<TIMESTAMP> about 16 hours ago"
  //   -> (relative pass)   -> "<TIMESTAMP> <RELATIVE_TIME>"
  // — and correctly handles a standalone relative phrase with no leading
  // absolute stamp too ("2 hours ago" -> "<RELATIVE_TIME>").
  function denoiseTimestamps(text) {
    var out = String(text);
    TIMESTAMP_PATTERNS.absolute.forEach(function (p) {
      try { out = out.replace(new RegExp(p.pattern, 'gi'), '<TIMESTAMP>'); } catch (e) {}
    });
    try { out = out.replace(new RegExp(TIMESTAMP_PATTERNS.relative.pattern, 'gi'), '<RELATIVE_TIME>'); } catch (e) {}
    return out;
  }

  // ============================================================
  // Rule matching
  // ============================================================

  function wildcardToRegExp(pattern) {
    var esc = String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp('^' + esc + '$', 'i');
  }

  function matchKeyRule(rule, keyName) {
    if (keyName == null) return false;
    var key = String(keyName).replace(/^@/, '');
    if (rule.matchMode === 'regex') {
      try { return new RegExp(rule.match, 'i').test(key); } catch (e) { return false; }
    }
    return wildcardToRegExp(rule.match).test(key);
  }

  function matchPatternRule(rule, value) {
    if (value == null || value === '') return false;
    try { return new RegExp('^(?:' + rule.pattern + ')$').test(String(value)); } catch (e) { return false; }
  }

  function findMatchingKeyRule(profile, keyName) {
    var keyRules = profile.keyRules || [];
    for (var i = 0; i < keyRules.length; i++) {
      if (matchKeyRule(keyRules[i], keyName)) return keyRules[i];
    }
    return null;
  }

  // Pattern rules match by value *shape*, which may be the whole leaf value
  // (a field that's just a bare IP or GUID) or a substring embedded in a
  // longer piece of text (a "notes" field that happens to contain an email).
  // Returns every pattern rule with at least one occurrence in `value`.
  function findMatchingPatternRules(profile, value) {
    var out = [];
    (profile.patternRules || []).forEach(function (rule) {
      var re;
      try { re = new RegExp(rule.pattern, 'g'); } catch (e) { return; }
      if (re.test(value)) out.push(rule);
    });
    return out;
  }

  // Replaces every occurrence of every matched pattern rule inside `value`,
  // chaining rule-by-rule so a value with more than one kind of PII (e.g. an
  // email *and* an IP in the same sentence) gets both redacted.
  function redactPatternOccurrences(value, rules, mapping) {
    var out = value;
    rules.forEach(function (rule) {
      var re;
      try { re = new RegExp(rule.pattern, 'g'); } catch (e) { return; }
      out = out.replace(re, function (occurrence) { return getOrCreateFake(mapping, occurrence, rule); });
    });
    return out;
  }

  // ============================================================
  // Leaf walk over PAW's existing node model (rootNode/buildJson/buildXmlNode)
  // ============================================================

  function walkLeaves(node, cb) {
    if (!node) return;
    if (node.kind === 'leaf') { cb(node); return; }
    (node.children || []).forEach(function (c) { walkLeaves(c, cb); });
  }

  // Runs a profile's rules against every leaf of an already-built PAW node
  // tree. A leaf either gets a whole-value replacement (its key matched a
  // KeyRule) or, failing that, has every PatternRule occurrence inside its
  // text redacted in place — see findMatchingPatternRules/redactPatternOccurrences.
  // Returns raw hits (no fake values yet, no ids); callers in analyze()
  // assign those so structural and freeform hits share one match shape.
  function findStructuralHits(profile, rootNode) {
    var hits = [];
    walkLeaves(rootNode, function (leaf) {
      if (leaf.disp == null || leaf.disp === '') return;
      var value = String(leaf.disp);
      var keyRule = findMatchingKeyRule(profile, leaf.key);
      if (keyRule) {
        hits.push({ node: leaf, path: leaf.path, key: leaf.key, value: value, rule: keyRule, wholeValue: true });
        return;
      }
      var patternRules = findMatchingPatternRules(profile, value);
      if (patternRules.length) {
        hits.push({ node: leaf, path: leaf.path, key: leaf.key, value: value, rules: patternRules, wholeValue: false });
      }
    });
    return hits;
  }

  function hitFakeAndLabel(hit, mapping) {
    if (hit.wholeValue) {
      return { fake: getOrCreateFake(mapping, hit.value, hit.rule), ruleId: hit.rule.id, ruleLabel: hit.rule.label };
    }
    return {
      fake: redactPatternOccurrences(hit.value, hit.rules, mapping),
      ruleId: hit.rules.map(function (r) { return r.id; }).join(','),
      ruleLabel: hit.rules.map(function (r) { return r.label; }).join(', '),
    };
  }

  // ============================================================
  // Replacement generation — deterministic, type/shape-preserving
  // ============================================================

  // Small, stable string hash so the same original value always picks the
  // same fake-pool entries even across a page refresh (mapping is also
  // persisted, but this keeps things deterministic even before it's loaded).
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }

  function mulberry32(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  var FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Drew', 'Sam', 'Reese', 'Avery', 'Quinn', 'Parker', 'Rowan', 'Elliot', 'Skyler'];
  var LAST_NAMES = ['Reed', 'Bennett', 'Carter', 'Hayes', 'Foster', 'Coleman', 'Brooks', 'Sawyer', 'Marsh', 'Pierce', 'Vaughn', 'Whitfield', 'Nolan', 'Sutton', 'Ellison', 'Kerr'];
  var DOMAIN_WORDS = ['acme', 'example', 'sample', 'demo', 'testco', 'northwind', 'contoso', 'fabrikam'];
  var COMPANY_WORDS = ['Northwind', 'Contoso', 'Fabrikam', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'Cyberdyne', 'Hooli', 'Vandelay', 'Massive Dynamic'];
  var COMPANY_SUFFIXES = ['Inc.', 'LLC', 'Co.', 'Corp.', 'Ltd.'];

  function nameFromSeed(seed) {
    var rand = mulberry32(seed);
    var first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    var last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    return { first: first, last: last };
  }

  function randomDigits(n, rand) {
    var out = '';
    for (var i = 0; i < n; i++) out += Math.floor(rand() * 10);
    return out;
  }

  function randomHex(n, rand) {
    var out = '';
    for (var i = 0; i < n; i++) out += Math.floor(rand() * 16).toString(16);
    return out;
  }

  var GENERATORS = {
    hex32: function (original) {
      var rand = mulberry32(hashStr(original));
      var len = /^[0-9a-fA-F]+$/.test(original) ? original.length : 32;
      var lower = original === original.toLowerCase();
      var hex = randomHex(len, rand);
      return lower ? hex : hex.toUpperCase();
    },
    guid: function (original) {
      var rand = mulberry32(hashStr(original));
      var groups = [8, 4, 4, 4, 12];
      return groups.map(function (n) { return randomHex(n, rand); }).join('-');
    },
    name: function (original) {
      var n = nameFromSeed(hashStr(original));
      // preserve "Full Name" vs "single token" shape
      return /\s/.test(String(original).trim()) ? n.first + ' ' + n.last : n.first;
    },
    companyName: function (original) {
      var rand = mulberry32(hashStr(original));
      var word = COMPANY_WORDS[Math.floor(rand() * COMPANY_WORDS.length)];
      var suffix = COMPANY_SUFFIXES[Math.floor(rand() * COMPANY_SUFFIXES.length)];
      return word + ' ' + suffix;
    },
    email: function (original) {
      var rand = mulberry32(hashStr(original));
      var at = String(original).indexOf('@');
      var domain = at >= 0 ? String(original).slice(at + 1) : '';
      var tldMatch = domain.match(/\.([A-Za-z]{2,})$/);
      var tld = tldMatch ? tldMatch[1] : 'com';
      var localWord = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)].toLowerCase();
      var domainWord = DOMAIN_WORDS[Math.floor(rand() * DOMAIN_WORDS.length)];
      return localWord + randomDigits(2, rand) + '@' + domainWord + '.' + tld;
    },
    phone: function (original) {
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      var di = 0;
      var digits = randomDigits(20, rand);
      return s.replace(/\d/g, function () { return digits[di++]; });
    },
    ssn: function (original) {
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      var di = 0;
      var digits = randomDigits(9, rand);
      return s.replace(/\d/g, function () { return digits[di++]; });
    },
    creditCard: function (original) {
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      var di = 0;
      var digitCount = (s.match(/\d/g) || []).length;
      var digits = randomDigits(digitCount, rand);
      return s.replace(/\d/g, function () { return digits[di++]; });
    },
    ipv4: function (original) {
      var rand = mulberry32(hashStr(original));
      return '10.' + Math.floor(rand() * 256) + '.' + Math.floor(rand() * 256) + '.' + Math.floor(rand() * 256);
    },
    numericId: function (original) {
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      var di = 0;
      var digits = randomDigits((s.match(/\d/g) || []).length || s.length, rand);
      return s.replace(/\d/g, function () { return digits[di++]; });
    },
    generic: function (original) {
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      return s.replace(/[A-Za-z0-9]/g, function (ch) {
        if (/[0-9]/.test(ch)) return String(Math.floor(rand() * 10));
        var upper = ch === ch.toUpperCase();
        var letter = String.fromCharCode(97 + Math.floor(rand() * 26));
        return upper ? letter.toUpperCase() : letter;
      });
    },
    timestamp: function (original) {
      // Randomizes digits only, leaves every separator/letter (slashes,
      // colons, AM/PM, month names, "ago"/"hours") exactly as-is — same
      // trade-off ssn/phone/creditCard already make (may occasionally
      // produce a not-quite-valid calendar date; accepted, no real date
      // arithmetic needed for a fake placeholder value).
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      var di = 0;
      var digits = randomDigits((s.match(/\d/g) || []).length, rand);
      return s.replace(/\d/g, function () { return digits[di++]; });
    },
    url: function (original) {
      var rand = mulberry32(hashStr(original));
      var s = String(original);
      var m = s.match(/^(https?:\/\/)([^\/?#]+)([\s\S]*)$/i);
      if (!m) return GENERATORS.generic(original);
      var domainWord = DOMAIN_WORDS[Math.floor(rand() * DOMAIN_WORDS.length)];
      var tldMatch = m[2].match(/\.([A-Za-z]{2,})$/);
      var tld = tldMatch ? tldMatch[1] : 'com';
      var fakeRest = m[3].replace(/[A-Za-z0-9]/g, function (ch) {
        var upper = ch === ch.toUpperCase();
        return /[0-9]/.test(ch) ? String(Math.floor(rand() * 10)) : (upper ? String.fromCharCode(65 + Math.floor(rand() * 26)) : String.fromCharCode(97 + Math.floor(rand() * 26)));
      });
      return m[1] + domainWord + '.' + tld + fakeRest;
    },
    ipv6: function (original) {
      var rand = mulberry32(hashStr(original));
      return String(original).replace(/[0-9a-fA-F]{1,4}/g, function (seg) { return randomHex(seg.length, rand); });
    },
    mac: function (original) {
      var rand = mulberry32(hashStr(original));
      return String(original).replace(/[0-9A-Fa-f]{2}/g, function () { return randomHex(2, rand); });
    },
  };

  function generateFake(original, rule) {
    var gen = GENERATORS[(rule && rule.generator) || 'generic'] || GENERATORS.generic;
    return gen(original);
  }

  // ============================================================
  // Selection -> pattern shape detection ("auto-detect pattern" for Bury's
  // selected-text toolbar). Pure/stateless: takes the selected text and the
  // active profile's current pattern rules (base + any session-only manual
  // ones), returns either "this already matches an existing rule" or a
  // {label, pattern, generator} draft for a new PatternRule. No app.js/DOM
  // coupling, so it's unit-testable the same way as the rest of this file.
  // ============================================================

  function testWholeMatch(pattern, text) {
    try { return new RegExp('^(?:' + pattern + ')$', 'i').test(text); } catch (e) { return false; }
  }

  function escapeRegExpSource(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Shipped-shape patterns copied verbatim from sanitize-rules-default.js
  // where one already exists, so a detection and its shipped counterpart
  // always agree byte-for-byte; IPv6/MAC/URL fill gaps nothing ships yet.
  var SHAPE_CANDIDATES = [
    { label: 'GUID', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', generator: 'guid' },
    { label: '32-char hex ID', pattern: '\\b[0-9a-fA-F]{32}\\b', generator: 'hex32' },
    { label: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[A-Za-z]{2,}', generator: 'email' },
    // Lookaround, not \b, at the edges: an IPv6 address can legitimately
    // start/end with ':' (e.g. "::1"), and \b can never anchor right at a
    // position where the pattern's own first/last char is non-word (':').
    { label: 'IPv6 address', pattern: '(?<![0-9a-fA-F:])(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}|::)(?![0-9a-fA-F:])', generator: 'ipv6' },
    { label: 'IPv4 address', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', generator: 'ipv4' },
    { label: 'MAC address', pattern: '\\b[0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5}\\b', generator: 'mac' },
    { label: 'SSN', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', generator: 'ssn' },
    { label: 'Credit card', pattern: '\\b(?:\\d[ -]?){15,16}\\b', generator: 'creditCard' },
    { label: 'Phone number', pattern: '\\+?1?[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b', generator: 'phone' },
    { label: 'URL', pattern: 'https?:\\/\\/[^\\s"\'<>]+', generator: 'url' },
  ];

  // Structure-preserving fallback for values matching no known shape:
  // alternates class+length per contiguous digit/letter run, escapes
  // everything else literally (e.g. "INC0012345" -> [A-Za-z]{3}\d{7})
  // rather than degrading to an exact literal (that's what "Mark selection
  // as always-redact" is already for).
  function genericShapeFallback(text) {
    var n = text.length;
    if (/^\d+$/.test(text)) return { label: n + '-digit number', pattern: '\\b\\d{' + n + '}\\b', generator: 'numericId' };
    if (/^[0-9a-fA-F]+$/.test(text)) return { label: n + '-char hex value', pattern: '\\b[0-9a-fA-F]{' + n + '}\\b', generator: 'hex32' };
    if (/^[A-Za-z0-9]+$/.test(text)) return { label: n + '-char alphanumeric ID', pattern: '\\b[A-Za-z0-9]{' + n + '}\\b', generator: 'generic' };
    var pattern = '';
    (text.match(/\d+|[A-Za-z]+|[^A-Za-z0-9]+/g) || []).forEach(function (run) {
      if (/^\d+$/.test(run)) pattern += '\\d{' + run.length + '}';
      else if (/^[A-Za-z]+$/.test(run)) pattern += '[A-Za-z]{' + run.length + '}';
      else pattern += escapeRegExpSource(run);
    });
    return { label: 'Custom shape (' + n + ' chars)', pattern: pattern, generator: 'generic' };
  }

  // existingPatternRules: active profile's patternRules + session manual
  // rules (caller's job to assemble — same list getSanitizeRun() runs).
  function detectPatternForValue(text, existingPatternRules) {
    var raw = String(text || '');
    if (!raw.trim()) return null;

    var existing = (existingPatternRules || []).filter(function (r) { return testWholeMatch(r.pattern, raw); })[0];
    if (existing) return { type: 'existing', rule: existing };

    // Each absolute pattern is tried with an optional trailing relative-time
    // suffix baked in (not just on its own) — a selection often spans the
    // *whole* displayed value, e.g. ServiceNow's own
    // "09/10/2026 02:20:40 PM about 16 hours ago", and the saved rule needs
    // to match that whole shape (with or without the suffix present), not
    // just the absolute portion alone.
    var relSuffix = '(?:\\s+' + TIMESTAMP_PATTERNS.relative.pattern + ')?';
    for (var i = 0; i < TIMESTAMP_PATTERNS.absolute.length; i++) {
      var tp = TIMESTAMP_PATTERNS.absolute[i];
      var combined = tp.pattern + relSuffix;
      if (testWholeMatch(combined, raw)) {
        var hasRelative = testWholeMatch(TIMESTAMP_PATTERNS.relative.pattern, raw.replace(new RegExp('^(?:' + tp.pattern + ')\\s*', 'i'), ''));
        return { type: 'shape', label: 'Timestamp (' + tp.label + (hasRelative ? ' + relative' : '') + ')', pattern: combined, generator: 'timestamp' };
      }
    }
    if (testWholeMatch(TIMESTAMP_PATTERNS.relative.pattern, raw)) {
      return { type: 'shape', label: 'Relative time', pattern: TIMESTAMP_PATTERNS.relative.pattern, generator: 'timestamp' };
    }
    for (var j = 0; j < SHAPE_CANDIDATES.length; j++) {
      var c = SHAPE_CANDIDATES[j];
      if (testWholeMatch(c.pattern, raw)) return { type: 'shape', label: c.label, pattern: c.pattern, generator: c.generator };
    }
    return Object.assign({ type: 'fallback' }, genericShapeFallback(raw));
  }

  // mapping: { map: Map<original(string) -> fake(string)> }
  function createMapping() {
    return { map: new Map() };
  }

  function getOrCreateFake(mapping, original, rule) {
    var key = String(original);
    if (mapping.map.has(key)) return mapping.map.get(key);
    var fake = generateFake(key, rule);
    mapping.map.set(key, fake);
    return fake;
  }

  // ============================================================
  // Freeform embedded-fragment detection
  // ============================================================

  function findEmbeddedFragments(text) {
    var src = String(text || '');
    var frags = [];
    var stack = [];
    var closerFor = { '{': '}', '[': ']' };
    var inString = false, strCh = '', escaped = false;
    for (var i = 0; i < src.length; i++) {
      var ch = src[i];
      if (inString) {
        if (escaped) { escaped = false; }
        else if (ch === '\\') { escaped = true; }
        else if (ch === strCh) { inString = false; }
        continue;
      }
      if (ch === '"' || ch === "'") { inString = true; strCh = ch; continue; }
      if (ch === '{' || ch === '[') { stack.push({ ch: ch, start: i }); continue; }
      if (ch === '}' || ch === ']') {
        if (!stack.length) continue;
        var top = stack[stack.length - 1];
        if (closerFor[top.ch] !== ch) { stack.length = 0; continue; }
        stack.pop();
        if (stack.length === 0) frags.push({ start: top.start, end: i + 1, kind: 'json' });
      }
    }
    var xmlRe = /<([A-Za-z_][\w:.-]*)\b[^>]*?(\/)?>(?:[\s\S]*?<\/\1>)?/g;
    var m;
    while ((m = xmlRe.exec(src))) {
      if (!m[2] && src.slice(m.index, m.index + m[0].length).indexOf('</' + m[1]) === -1) continue;
      frags.push({ start: m.index, end: m.index + m[0].length, kind: 'xml' });
    }
    frags.sort(function (a, b) { return a.start - b.start || (b.end - b.start) - (a.end - a.start); });
    var out = [];
    var lastEnd = -1;
    frags.forEach(function (f) {
      if (f.start >= lastEnd) { out.push(f); lastEnd = f.end; }
    });
    out.forEach(function (f) { f.text = src.slice(f.start, f.end); });
    return out;
  }

  // ============================================================
  // Structural reassembly
  // ============================================================

  function cloneJsonValue(value) {
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
  }

  function setJsonByPath(root, path, val) {
    var parts = String(path).split('/').filter(Boolean);
    parts.shift(); // drop the synthetic 'root' segment buildJson always adds
    if (!parts.length) return val; // whole value is the leaf (primitive input)
    var cur = root;
    for (var i = 0; i < parts.length - 1; i++) {
      cur = Array.isArray(cur) ? cur[Number(parts[i])] : cur[parts[i]];
    }
    var lastKey = parts[parts.length - 1];
    if (Array.isArray(cur)) cur[Number(lastKey)] = val; else cur[lastKey] = val;
    return root;
  }

  // matches: [{path, fake, customFake, excluded}], as produced by runProfile
  // and possibly edited by the UI. Excluded matches are left untouched.
  function applyReplacementsJson(rootValue, matches) {
    var clone = cloneJsonValue(rootValue);
    (matches || []).forEach(function (m) {
      if (m.excluded) return;
      var val = m.customFake != null && m.customFake !== '' ? m.customFake : m.fake;
      clone = setJsonByPath(clone, m.path, val);
    });
    return clone;
  }

  function mapOriginalToCloneElements(origEl, cloneEl, map) {
    map.set(origEl, cloneEl);
    var oc = origEl.children, cc = cloneEl.children;
    for (var i = 0; i < oc.length && i < cc.length; i++) mapOriginalToCloneElements(oc[i], cc[i], map);
  }

  // matches: same shape as above, but each carries `.node` (the leaf from
  // buildXmlNode, which now also carries an `el` reference back to the
  // *original* document — see the small addition in app.js's buildXmlNode).
  function applyReplacementsXml(doc, matches) {
    var clone = doc.cloneNode(true);
    var elMap = new Map();
    mapOriginalToCloneElements(doc.documentElement, clone.documentElement, elMap);
    (matches || []).forEach(function (m) {
      if (m.excluded) return;
      var node = m.node;
      if (!node || !node.el) return;
      var cloneEl = elMap.get(node.el);
      if (!cloneEl) return;
      var val = m.customFake != null && m.customFake !== '' ? m.customFake : m.fake;
      if (node.vType === 'attr') {
        cloneEl.setAttribute(String(node.key).replace(/^@/, ''), val);
        return;
      }
      var textNodes = Array.from(cloneEl.childNodes).filter(function (n) { return n.nodeType === 3; });
      if (textNodes.length) {
        textNodes[0].textContent = val;
        for (var i = 1; i < textNodes.length; i++) textNodes[i].textContent = '';
      } else {
        cloneEl.appendChild(clone.createTextNode(val));
      }
    });
    return clone;
  }

  function serializeJson(value) {
    return JSON.stringify(value, null, 2);
  }

  function serializeXml(doc) {
    return new XMLSerializer().serializeToString(doc);
  }

  // ============================================================
  // Top-level: detect + run a profile against pasted input
  // ============================================================

  // parseFns: { parseJSON(text), parseXML(text), parseTable(text), rootNode(parsed) }
  // — the exact functions app.js's Component already uses (bind them with
  // `.bind(this)` when calling in from app.js), so parsing/tree-building is
  // never duplicated here.
  function analyze(text, profile, mapping, parseFns) {
    var src = String(text || '');
    var trimmed = src.trim();
    if (!trimmed) return { format: 'empty', matches: [], fragments: null, parsed: null };

    var idCounter = 0;
    function nextId() { return 'm' + (idCounter++); }

    // CSV/TSV/Markdown-table input (e.g. a ServiceNow list-view export
    // copied via snutils): checked before the freeform fallback so a
    // column-header KeyRule (sys_id, caller_id, ...) matches a column name
    // the same way it matches a JSON key. Not checked ahead of JSON/XML
    // since those are unambiguous once they parse; a table only wins here
    // when the input isn't valid JSON/XML to begin with.
    if (trimmed[0] !== '{' && trimmed[0] !== '[' && trimmed[0] !== '<' && parseFns.parseTable) {
      var pt = parseFns.parseTable(src);
      if (pt.ok) return analyzeStructural(src, pt, profile, mapping, parseFns, nextId);
    }

    if (trimmed[0] === '{' || trimmed[0] === '[') {
      var pj = parseFns.parseJSON(src);
      if (pj.ok) return analyzeStructural(src, pj, profile, mapping, parseFns, nextId);
    } else if (trimmed[0] === '<') {
      var px = parseFns.parseXML(src);
      if (px.ok) return analyzeStructural(src, px, profile, mapping, parseFns, nextId);
    }
    return analyzeFreeform(src, profile, mapping, parseFns, nextId);
  }

  function analyzeStructural(src, parsed, profile, mapping, parseFns, nextId) {
    var root = parseFns.rootNode(parsed);
    var hits = findStructuralHits(profile, root);
    var matches = hits.map(function (hit) {
      var resolved = hitFakeAndLabel(hit, mapping);
      return {
        id: nextId(),
        scope: 'structural',
        path: hit.path,
        key: hit.key,
        value: hit.value,
        node: hit.node,
        ruleId: resolved.ruleId,
        ruleLabel: resolved.ruleLabel,
        fake: resolved.fake,
        excluded: false,
        customFake: null,
      };
    });
    return { format: parsed.format, matches: matches, fragments: null, parsed: parsed };
  }

  function analyzeFreeform(src, profile, mapping, parseFns, nextId) {
    var fragments = findEmbeddedFragments(src);
    var matches = [];
    var fragEntries = fragments.map(function (frag, fragIndex) {
      var parsed = frag.kind === 'json' ? parseFns.parseJSON(frag.text) : parseFns.parseXML(frag.text);
      if (!parsed.ok) return { start: frag.start, end: frag.end, kind: frag.kind, parsed: null, root: null };
      var root = parseFns.rootNode(parsed);
      var hits = findStructuralHits(profile, root);
      hits.forEach(function (hit) {
        var resolved = hitFakeAndLabel(hit, mapping);
        matches.push({
          id: nextId(),
          scope: 'freeform-fragment',
          fragIndex: fragIndex,
          path: hit.path,
          key: hit.key,
          value: hit.value,
          node: hit.node,
          ruleId: resolved.ruleId,
          ruleLabel: resolved.ruleLabel,
          fake: resolved.fake,
          excluded: false,
          customFake: null,
        });
      });
      return { start: frag.start, end: frag.end, kind: frag.kind, parsed: parsed, root: root };
    });

    var covered = fragEntries.map(function (f) { return { start: f.start, end: f.end }; });
    function isCovered(idx) { return covered.some(function (f) { return idx >= f.start && idx < f.end; }); }

    (profile.patternRules || []).forEach(function (rule) {
      var re;
      try { re = new RegExp(rule.pattern, 'g'); } catch (e) { return; }
      var m;
      while ((m = re.exec(src))) {
        if (m[0] === '') { re.lastIndex++; continue; }
        if (!isCovered(m.index)) {
          matches.push({
            id: nextId(),
            scope: 'freeform-pattern',
            start: m.index,
            end: m.index + m[0].length,
            key: null,
            value: m[0],
            ruleId: rule.id,
            ruleLabel: rule.label,
            fake: getOrCreateFake(mapping, m[0], rule),
            excluded: false,
            customFake: null,
          });
        }
        if (re.lastIndex === m.index) re.lastIndex++;
      }
    });

    matches.sort(function (a, b) {
      var as = a.scope === 'freeform-fragment' ? fragEntries[a.fragIndex].start : a.start;
      var bs = b.scope === 'freeform-fragment' ? fragEntries[b.fragIndex].start : b.start;
      return as - bs;
    });

    return { format: 'freeform', matches: matches, fragments: fragEntries, parsed: null };
  }

  // Renders sanitized output text given the current matches (post exclude/
  // edit). Safe to call repeatedly (e.g. on every review-list toggle).
  function renderOutput(src, runResult, matches) {
    if (runResult.format === 'json') {
      return serializeJson(applyReplacementsJson(runResult.parsed.value, matches));
    }
    if (runResult.format === 'xml') {
      return serializeXml(applyReplacementsXml(runResult.parsed.doc, matches));
    }
    if (runResult.format === 'table') {
      // applyReplacementsJson works unchanged here: a parsed table's value
      // is a plain array-of-objects, the same shape a JSON array clones/
      // patches-by-path. Only the final serialization step is table-specific.
      var replaced = applyReplacementsJson(runResult.parsed.value, matches);
      return window.PAW_TABLE.serialize(replaced, runResult.parsed.tableMeta);
    }
    if (runResult.format === 'freeform') {
      return renderFreeformOutput(src, runResult, matches);
    }
    return src;
  }

  function renderFreeformOutput(src, runResult, matches) {
    var byFrag = {};
    var patternPieces = [];
    matches.forEach(function (m) {
      if (m.scope === 'freeform-fragment') {
        (byFrag[m.fragIndex] || (byFrag[m.fragIndex] = [])).push(m);
      } else if (m.scope === 'freeform-pattern') {
        patternPieces.push(m);
      }
    });

    var pieces = [];
    (runResult.fragments || []).forEach(function (frag, i) {
      if (!frag.parsed) return;
      var fragMatches = byFrag[i] || [];
      if (!fragMatches.length) return;
      var replacedTree = frag.kind === 'json'
        ? applyReplacementsJson(frag.parsed.value, fragMatches)
        : applyReplacementsXml(frag.parsed.doc, fragMatches);
      var serialized = frag.kind === 'json' ? JSON.stringify(replacedTree) : serializeXml(replacedTree);
      pieces.push({ start: frag.start, end: frag.end, replacement: serialized });
    });
    patternPieces.forEach(function (m) {
      if (m.excluded) return;
      var val = m.customFake != null && m.customFake !== '' ? m.customFake : m.fake;
      pieces.push({ start: m.start, end: m.end, replacement: val });
    });

    pieces.sort(function (a, b) { return a.start - b.start; });
    var out = '', cursor = 0;
    pieces.forEach(function (p) {
      if (p.start < cursor) return;
      out += src.slice(cursor, p.start) + p.replacement;
      cursor = p.end;
    });
    out += src.slice(cursor);
    return out;
  }

  // ============================================================
  // Ruleset persistence (default JS object + localStorage override layer)
  // ============================================================

  function loadRuleOverrides() {
    try {
      var raw = localStorage.getItem(RULES_LS_KEY);
      if (!raw) return { profiles: [] };
      var parsed = JSON.parse(raw);
      return parsed && Array.isArray(parsed.profiles) ? parsed : { profiles: [] };
    } catch (e) { return { profiles: [] }; }
  }

  function saveRuleOverrides(overrideRuleset) {
    try { localStorage.setItem(RULES_LS_KEY, JSON.stringify(overrideRuleset)); return true; }
    catch (e) { return false; }
  }

  function clearRuleOverrides() {
    try { localStorage.removeItem(RULES_LS_KEY); return true; } catch (e) { return false; }
  }

  // Removes just one profile's override (reverting it to its shipped
  // default) without touching any other profile's customizations.
  function removeProfileOverride(profileId) {
    var overrides = loadRuleOverrides();
    overrides.profiles = (overrides.profiles || []).filter(function (p) { return p.id !== profileId; });
    return saveRuleOverrides(overrides);
  }

  // Reads the *merged* profile (default + any existing override) as the
  // base, lets `mutatorFn` change it, then writes the whole profile back as
  // that profile's override — the read/merge/write every rule edit needs.
  // Marks the result `__dirty` (unsaved changes since the last export/
  // import) — cleared by exportProfile() or removeProfileOverride().
  function updateProfileOverride(profileId, mutatorFn) {
    var merged = getMergedRuleset();
    var base = merged.profiles.find(function (p) { return p.id === profileId; });
    if (!base) return false;
    var draft = JSON.parse(JSON.stringify(base));
    mutatorFn(draft);
    draft.__dirty = true;
    var overrides = loadRuleOverrides();
    overrides.profiles = (overrides.profiles || []).filter(function (p) { return p.id !== profileId; }).concat(draft);
    return saveRuleOverrides(overrides);
  }

  function slugify(name) {
    return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ruleset';
  }

  // Builds a clean, downloadable profile object under the given name (no
  // internal __dirty bookkeeping field). A built-in starting-point profile
  // (servicenow/generic) always forks to a new id, since you can't overwrite
  // a starting point; any other (already-custom/imported) profile updates
  // in place under the same id, and this also clears its local __dirty flag
  // since exporting is that profile's "save point".
  function exportProfile(profile, name) {
    var isBuiltIn = profile.id === 'servicenow' || profile.id === 'generic';
    var result = {
      id: isBuiltIn ? (slugify(name) + '-' + Date.now().toString(36)) : profile.id,
      name: name,
      keyRules: profile.keyRules || [],
      patternRules: profile.patternRules || [],
    };
    if (!isBuiltIn) {
      var overrides = loadRuleOverrides();
      overrides.profiles = (overrides.profiles || []).filter(function (p) { return p.id !== profile.id; }).concat(Object.assign({}, result, { __dirty: false }));
      saveRuleOverrides(overrides);
    }
    return result;
  }

  // Merges every profile from an imported ruleset into the existing
  // overrides by id (replacing a matching id, adding a new one) — unlike a
  // wholesale save, this never discards customizations to *other* profiles
  // that simply weren't part of the imported file. Every imported profile
  // is forced clean (__dirty:false) regardless of what the file contains.
  // Returns the ids that were imported, in file order.
  function importAndMergeRuleset(ruleset) {
    var incoming = (ruleset && ruleset.profiles || []).map(function (p) {
      return Object.assign({}, p, { __dirty: false });
    });
    var overrides = loadRuleOverrides();
    var incomingIds = incoming.map(function (p) { return p.id; });
    overrides.profiles = (overrides.profiles || []).filter(function (p) { return incomingIds.indexOf(p.id) === -1; }).concat(incoming);
    saveRuleOverrides(overrides);
    return incomingIds;
  }

  // Override profiles fully replace a default profile of the same id;
  // profiles with a new id are appended. Simple, predictable "last one in
  // wins by id" merge — good enough for a single-user override layer.
  function mergeRulesets(base, overrides) {
    var byId = {};
    var order = [];
    (base && base.profiles || []).forEach(function (p) { byId[p.id] = p; order.push(p.id); });
    (overrides && overrides.profiles || []).forEach(function (p) {
      if (!byId[p.id]) order.push(p.id);
      byId[p.id] = p;
    });
    return { profiles: order.map(function (id) { return byId[id]; }) };
  }

  function getMergedRuleset() {
    return mergeRulesets(window.PAW_SANITIZE_DEFAULT_RULES, loadRuleOverrides());
  }

  function importRulesetText(text) {
    try {
      var parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.profiles)) return { ok: false, error: 'Expected {"profiles": [...]}' };
      return { ok: true, ruleset: parsed };
    } catch (e) {
      return { ok: false, error: 'Invalid JSON: ' + e.message };
    }
  }

  // ============================================================
  // Mapping persistence (real -> fake value map)
  // ============================================================

  function loadMapping() {
    var mapping = createMapping();
    try {
      var raw = localStorage.getItem(MAPPING_LS_KEY);
      if (raw) {
        var pairs = JSON.parse(raw);
        if (Array.isArray(pairs)) pairs.forEach(function (p) { if (Array.isArray(p) && p.length === 2) mapping.map.set(p[0], p[1]); });
      }
    } catch (e) {}
    return mapping;
  }

  function saveMapping(mapping) {
    try { localStorage.setItem(MAPPING_LS_KEY, JSON.stringify(Array.from(mapping.map.entries()))); return true; }
    catch (e) { return false; }
  }

  function clearMapping() {
    try { localStorage.removeItem(MAPPING_LS_KEY); return true; } catch (e) { return false; }
  }

  window.PAW_SANITIZE = {
    matchKeyRule: matchKeyRule,
    matchPatternRule: matchPatternRule,
    walkLeaves: walkLeaves,
    findStructuralHits: findStructuralHits,
    findEmbeddedFragments: findEmbeddedFragments,
    generateFake: generateFake,
    createMapping: createMapping,
    getOrCreateFake: getOrCreateFake,
    applyReplacementsJson: applyReplacementsJson,
    applyReplacementsXml: applyReplacementsXml,
    serializeJson: serializeJson,
    serializeXml: serializeXml,
    analyze: analyze,
    renderOutput: renderOutput,
    mergeRulesets: mergeRulesets,
    getMergedRuleset: getMergedRuleset,
    loadRuleOverrides: loadRuleOverrides,
    saveRuleOverrides: saveRuleOverrides,
    clearRuleOverrides: clearRuleOverrides,
    removeProfileOverride: removeProfileOverride,
    updateProfileOverride: updateProfileOverride,
    exportProfile: exportProfile,
    importRulesetText: importRulesetText,
    importAndMergeRuleset: importAndMergeRuleset,
    loadMapping: loadMapping,
    saveMapping: saveMapping,
    clearMapping: clearMapping,
    generatorNames: Object.keys(GENERATORS),
    TIMESTAMP_PATTERNS: TIMESTAMP_PATTERNS,
    denoiseTimestamps: denoiseTimestamps,
    detectPatternForValue: detectPatternForValue,
  };
})();
