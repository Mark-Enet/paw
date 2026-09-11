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
  };

  function generateFake(original, rule) {
    var gen = GENERATORS[(rule && rule.generator) || 'generic'] || GENERATORS.generic;
    return gen(original);
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
  };
})();
