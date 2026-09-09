const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadSanitizeModule() {
  const context = {
    window: {},
    localStorage: (function () {
      let store = {};
      return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
      };
    })(),
    console,
  };
  context.globalThis = context;
  vm.createContext(context);

  const defaultsSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanitize-rules-default.js'), 'utf8');
  vm.runInContext(defaultsSrc, context, { filename: 'js/sanitize-rules-default.js' });
  const engineSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'sanitize.js'), 'utf8');
  vm.runInContext(engineSrc, context, { filename: 'js/sanitize.js' });

  return context.window.PAW_SANITIZE;
}

// Minimal fake DOM sufficient to exercise applyReplacementsXml — mirrors the
// style of tests/xml-array-detection.test.js's fake DOM helpers, extended
// with clone/mutate support (cloneNode, setAttribute, createTextNode).
function fakeAttr(name, value) { return { name, value }; }

function fakeElement(name, children = [], attrs = {}) {
  const attributes = Object.keys(attrs).map((k) => fakeAttr(k, attrs[k]));
  const childNodes = children.slice();
  const el = {
    nodeType: 1,
    nodeName: name,
    attributes,
    childNodes,
    get children() { return this.childNodes.filter((n) => n.nodeType === 1); },
    setAttribute(attrName, val) {
      const a = this.attributes.find((x) => x.name === attrName);
      if (a) a.value = val; else this.attributes.push(fakeAttr(attrName, val));
    },
    appendChild(node) { this.childNodes.push(node); },
  };
  return el;
}

function fakeText(text) { return { nodeType: 3, textContent: text }; }

function cloneFakeNode(node) {
  if (node.nodeType === 3) return fakeText(node.textContent);
  const clonedChildren = node.childNodes.map(cloneFakeNode);
  const attrs = {};
  node.attributes.forEach((a) => { attrs[a.name] = a.value; });
  return fakeElement(node.nodeName, clonedChildren, attrs);
}

function fakeDoc(rootEl) {
  return {
    documentElement: rootEl,
    createTextNode: (v) => fakeText(v),
    cloneNode() { return fakeDoc(cloneFakeNode(this.documentElement)); },
  };
}

// A tiny stand-in for app.js's buildXmlNode, just enough to produce leaves
// carrying `.el` back-references the way the real one does (see app.js).
function buildFakeXmlLeaves(el, path) {
  const leaves = [];
  el.attributes.forEach((a) => leaves.push({ kind: 'leaf', vType: 'attr', key: '@' + a.name, path: path + '/@' + a.name, disp: a.value, el }));
  const elemChildren = el.children;
  const text = el.childNodes.filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
  if (elemChildren.length === 0 && el.attributes.length === 0) {
    leaves.push({ kind: 'leaf', vType: 'string', key: el.nodeName, path, disp: text, el });
  } else {
    if (text) leaves.push({ kind: 'leaf', vType: 'text', key: '#text', path: path + '/#text', disp: text, el });
    elemChildren.forEach((c) => leaves.push(...buildFakeXmlLeaves(c, path + '/' + c.nodeName)));
  }
  return leaves;
}

test('matchKeyRule: wildcard is case-insensitive and anchors the whole key', () => {
  const S = loadSanitizeModule();
  assert.equal(S.matchKeyRule({ match: '*email*', matchMode: 'wildcard' }, 'u_Email_Address'), true);
  assert.equal(S.matchKeyRule({ match: 'sys_id', matchMode: 'wildcard' }, 'SYS_ID'), true);
  assert.equal(S.matchKeyRule({ match: 'sys_id', matchMode: 'wildcard' }, 'not_sys_id_at_all'), false);
  assert.equal(S.matchKeyRule({ match: 'sys_id', matchMode: 'wildcard' }, '@sys_id'), true);
});

test('matchPatternRule: matches the whole value, not a substring', () => {
  const S = loadSanitizeModule();
  const rule = { pattern: '[0-9a-fA-F]{32}' };
  assert.equal(S.matchPatternRule(rule, 'a'.repeat(32)), true);
  assert.equal(S.matchPatternRule(rule, 'a'.repeat(32) + 'x'), false);
  assert.equal(S.matchPatternRule(rule, ''), false);
});

test('getOrCreateFake is deterministic for a given original value', () => {
  const S = loadSanitizeModule();
  const mapping = S.createMapping();
  const rule = { generator: 'hex32' };
  const first = S.getOrCreateFake(mapping, 'abcd1234abcd1234abcd1234abcd1234', rule);
  const second = S.getOrCreateFake(mapping, 'abcd1234abcd1234abcd1234abcd1234', rule);
  assert.equal(first, second);
  assert.equal(mapping.map.size, 1);
});

test('hex32 generator preserves length and case', () => {
  const S = loadSanitizeModule();
  const lower = S.generateFake('abcd1234abcd1234abcd1234abcd1234', { generator: 'hex32' });
  assert.equal(lower.length, 32);
  assert.match(lower, /^[0-9a-f]{32}$/);
  const upper = S.generateFake('ABCD1234ABCD1234ABCD1234ABCD1234', { generator: 'hex32' });
  assert.match(upper, /^[0-9A-F]{32}$/);
});

test('phone generator preserves punctuation/format, only digits change', () => {
  const S = loadSanitizeModule();
  const fake = S.generateFake('(555) 123-4567', { generator: 'phone' });
  assert.equal(fake.replace(/\d/g, '#'), '(###) ###-####');
  assert.notEqual(fake, '(555) 123-4567');
});

test('email generator preserves the general shape (local@domain.tld)', () => {
  const S = loadSanitizeModule();
  const fake = S.generateFake('jane.doe@example.com', { generator: 'email' });
  assert.match(fake, /^[a-z0-9]+@[a-z]+\.com$/);
});

test('companyName generator produces a "Word Suffix" org name, deterministically, distinct from the name generator', () => {
  const S = loadSanitizeModule();
  const fake = S.generateFake('Acme Corp', { generator: 'companyName' });
  assert.match(fake, /^[A-Za-z ]+ (Inc\.|LLC|Co\.|Corp\.|Ltd\.)$/);
  assert.equal(S.generateFake('Acme Corp', { generator: 'companyName' }), fake);
  assert.notEqual(fake, S.generateFake('Acme Corp', { generator: 'name' }));
});

test('numericId generator preserves a leading alpha prefix and only randomizes digits', () => {
  const S = loadSanitizeModule();
  const fake = S.generateFake('INC0012345', { generator: 'numericId' });
  assert.match(fake, /^INC\d{7}$/);
  assert.notEqual(fake, 'INC0012345');
});

test('default ServiceNow rules cover number/account/customer_account/company/contact/serial_number', () => {
  const S = loadSanitizeModule();
  const sn = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  const byMatch = Object.fromEntries(sn.keyRules.map((r) => [r.match, r]));
  assert.equal(byMatch.number.generator, 'numericId');
  assert.equal(byMatch.account.generator, 'companyName');
  assert.equal(byMatch.customer_account.generator, 'companyName');
  assert.equal(byMatch.company.generator, 'companyName');
  assert.equal(byMatch.contact.generator, 'name');
  assert.equal(byMatch.serial_number.generator, 'generic');
});

test('findStructuralHits matches by key (whole value) and by value shape (substring within text)', () => {
  const S = loadSanitizeModule();
  const root = {
    kind: 'object',
    children: [
      { kind: 'leaf', key: 'sys_id', path: '/root/sys_id', disp: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' },
      { kind: 'leaf', key: 'note', path: '/root/note', disp: 'contact jane.doe@example.com please' },
      { kind: 'leaf', key: 'active', path: '/root/active', disp: 'true' },
    ],
  };
  const profile = { keyRules: [{ id: 'k1', match: 'sys_id', matchMode: 'wildcard', generator: 'hex32' }], patternRules: [{ id: 'p1', label: 'Email', pattern: '[\\w.]+@[\\w-]+\\.[A-Za-z]{2,}', generator: 'email' }] };
  const hits = S.findStructuralHits(profile, root);
  assert.equal(hits.length, 2);
  const byKey = Object.fromEntries(hits.map((h) => [h.key, h]));
  assert.equal(byKey.sys_id.wholeValue, true);
  // the email is embedded in a longer sentence — the whole leaf must still be
  // flagged, so a "notes"-style field isn't silently skipped just because
  // the PII isn't the entire value.
  assert.equal(byKey.note.wholeValue, false);
  assert.equal(byKey.note.rules[0].id, 'p1');
});

test('analyze + renderOutput round-trips a JSON payload, redacting matched leaves only', () => {
  const S = loadSanitizeModule();
  const src = JSON.stringify({ sys_id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', title: 'Printer jam', caller_id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' });
  const profile = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  const mapping = S.createMapping();
  const parseFns = {
    parseJSON: (text) => { try { return { format: 'json', ok: true, value: JSON.parse(text) }; } catch (e) { return { format: 'json', ok: false }; } },
    parseXML: () => ({ format: 'xml', ok: false }),
    rootNode: (parsed) => {
      const build = (key, value, p) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return { kind: 'object', key, path: p, children: Object.keys(value).map((k) => build(k, value[k], p + '/' + k)) };
        }
        return { kind: 'leaf', key, path: p, disp: typeof value === 'string' ? value : String(value) };
      };
      return build('root', parsed.value, '/root');
    },
  };

  const run = S.analyze(src, profile, mapping, parseFns);
  assert.equal(run.format, 'json');
  assert.equal(run.matches.length, 2);

  const output = S.renderOutput(src, run, run.matches);
  const parsedOut = JSON.parse(output);
  assert.equal(parsedOut.title, 'Printer jam');
  assert.notEqual(parsedOut.sys_id, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
  assert.match(parsedOut.sys_id, /^[0-9a-f]{32}$/);
  // same original value repeated twice -> same fake both times
  assert.equal(parsedOut.sys_id, parsedOut.caller_id);

  // excluding a match leaves the original value untouched
  const excluded = run.matches.map((m) => Object.assign({}, m, { excluded: m.key === 'sys_id' }));
  const output2 = JSON.parse(S.renderOutput(src, run, excluded));
  assert.equal(output2.sys_id, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
  assert.notEqual(output2.caller_id, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
});

test('a PII pattern embedded inside a longer structural leaf value (e.g. a notes field) is redacted, not skipped', () => {
  const S = loadSanitizeModule();
  const src = JSON.stringify({ short_description: "VPN client won't connect", notes: 'Caller reported the issue after contacting jane.doe@example.com from 192.168.1.42.' });
  const profile = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  const mapping = S.createMapping();
  const parseFns = {
    parseJSON: (text) => { try { return { format: 'json', ok: true, value: JSON.parse(text) }; } catch (e) { return { format: 'json', ok: false }; } },
    parseXML: () => ({ format: 'xml', ok: false }),
    rootNode: (parsed) => {
      const build = (key, value, p) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          return { kind: 'object', key, path: p, children: Object.keys(value).map((k) => build(k, value[k], p + '/' + k)) };
        }
        return { kind: 'leaf', key, path: p, disp: typeof value === 'string' ? value : String(value) };
      };
      return build('root', parsed.value, '/root');
    },
  };
  const run = S.analyze(src, profile, mapping, parseFns);
  assert.equal(run.matches.length, 1);
  const output = JSON.parse(S.renderOutput(src, run, run.matches));
  assert.equal(output.short_description, "VPN client won't connect");
  assert.equal(output.notes.startsWith('Caller reported the issue after contacting '), true);
  assert.equal(output.notes.includes('jane.doe@example.com'), false);
  assert.equal(output.notes.includes('192.168.1.42'), false);
});

test('findEmbeddedFragments extracts a JSON blob embedded in a freeform log line', () => {
  const S = loadSanitizeModule();
  const log = 'INFO 2026-01-01 Response body: {"caller_id":"abc"} end of line';
  const frags = S.findEmbeddedFragments(log);
  assert.equal(frags.length, 1);
  assert.equal(frags[0].kind, 'json');
  assert.equal(frags[0].text, '{"caller_id":"abc"}');
});

test('freeform pattern pass redacts values outside any embedded structure, byte-preserving the rest', () => {
  const S = loadSanitizeModule();
  const src = 'Caller: John Smith, email jane.doe@example.com, done.';
  const profile = { keyRules: [], patternRules: [{ id: 'p1', label: 'Email', pattern: '[\\w.]+@[\\w-]+\\.[A-Za-z]{2,}', generator: 'email' }] };
  const mapping = S.createMapping();
  const parseFns = {
    parseJSON: () => ({ ok: false }),
    parseXML: () => ({ ok: false }),
    rootNode: () => null,
  };
  const run = S.analyze(src, profile, mapping, parseFns);
  assert.equal(run.format, 'freeform');
  assert.equal(run.matches.length, 1);
  const output = S.renderOutput(src, run, run.matches);
  assert.equal(output.startsWith('Caller: John Smith, email '), true);
  assert.equal(output.endsWith(', done.'), true);
  assert.notEqual(output, src);
});

test('applyReplacementsXml mutates only the matched attribute/text leaves on a clone', () => {
  const S = loadSanitizeModule();
  const root = fakeElement('incident', [
    fakeElement('short_description', [fakeText('Printer jam')]),
  ], { sys_id: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' });
  const doc = fakeDoc(root);
  const leaves = buildFakeXmlLeaves(root, '/incident');
  const sysIdLeaf = leaves.find((l) => l.key === '@sys_id');
  const descLeaf = leaves.find((l) => l.key === 'short_description');

  const mapping = S.createMapping();
  const rule = { generator: 'hex32' };
  const matches = [
    { path: sysIdLeaf.path, node: sysIdLeaf, fake: S.getOrCreateFake(mapping, sysIdLeaf.disp, rule), excluded: false, customFake: null },
  ];
  const cloneDoc = S.applyReplacementsXml(doc, matches);

  const clonedSysId = cloneDoc.documentElement.attributes.find((a) => a.name === 'sys_id').value;
  assert.notEqual(clonedSysId, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
  assert.match(clonedSysId, /^[0-9a-f]{32}$/);
  // original document is untouched
  assert.equal(root.attributes.find((a) => a.name === 'sys_id').value, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
  // untouched leaf keeps its original text on the clone too
  const clonedDescEl = cloneDoc.documentElement.children[0];
  assert.equal(clonedDescEl.childNodes[0].textContent, 'Printer jam');
});

test('mergeRulesets: an override profile with the same id fully replaces the default one', () => {
  const S = loadSanitizeModule();
  const base = { profiles: [{ id: 'servicenow', name: 'ServiceNow', keyRules: [{ id: 'a' }] }] };
  const overrides = { profiles: [{ id: 'servicenow', name: 'ServiceNow (custom)', keyRules: [{ id: 'a' }, { id: 'b' }] }] };
  const merged = S.mergeRulesets(base, overrides);
  assert.equal(merged.profiles.length, 1);
  assert.equal(merged.profiles[0].name, 'ServiceNow (custom)');
  assert.equal(merged.profiles[0].keyRules.length, 2);
});

test('default ServiceNow ruleset ships with the documented key rules', () => {
  const S = loadSanitizeModule();
  const merged = S.getMergedRuleset();
  const sn = merged.profiles.find((p) => p.id === 'servicenow');
  assert.ok(sn, 'servicenow profile should exist');
  const keys = sn.keyRules.map((r) => r.match);
  ['*sys_id*', 'caller_id', 'opened_by', 'u_phone', '*email*', '*name*'].forEach((expected) => {
    assert.ok(keys.includes(expected), `expected default rules to include a key rule for ${expected}`);
  });
});

test('updateProfileOverride forks the merged profile into an override on first edit, leaving other profiles untouched', () => {
  const S = loadSanitizeModule();
  S.updateProfileOverride('servicenow', (profile) => {
    profile.keyRules.push({ id: 'custom-1', label: 'foo', type: 'key', match: 'foo', matchMode: 'wildcard', generator: 'generic' });
  });
  const merged = S.getMergedRuleset();
  const sn = merged.profiles.find((p) => p.id === 'servicenow');
  assert.ok(sn.keyRules.some((r) => r.id === 'custom-1'));
  // the default rules that came along for the fork are still present
  assert.ok(sn.keyRules.some((r) => r.match === 'sys_id' || r.match === '*sys_id*'));
  const generic = merged.profiles.find((p) => p.id === 'generic');
  assert.ok(!generic.keyRules.some((r) => r.id === 'custom-1'));
});

test('removeProfileOverride reverts only that profile to its shipped default', () => {
  const S = loadSanitizeModule();
  S.updateProfileOverride('servicenow', (profile) => { profile.keyRules = []; });
  S.updateProfileOverride('generic', (profile) => { profile.keyRules = []; });
  S.removeProfileOverride('servicenow');
  const merged = S.getMergedRuleset();
  const sn = merged.profiles.find((p) => p.id === 'servicenow');
  const generic = merged.profiles.find((p) => p.id === 'generic');
  assert.ok(sn.keyRules.length > 0, 'servicenow should be back to its shipped defaults');
  assert.equal(generic.keyRules.length, 0, 'generic override should be untouched');
});

test('updateProfileOverride marks the profile dirty; a shipped profile with no override is not dirty', () => {
  const S = loadSanitizeModule();
  const clean = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  assert.ok(!clean.__dirty);
  S.updateProfileOverride('servicenow', (profile) => { profile.keyRules.push({ id: 'x', type: 'key', match: 'x', matchMode: 'wildcard', generator: 'generic' }); });
  const dirty = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  assert.equal(dirty.__dirty, true);
});

test('removeProfileOverride clears dirty along with the override (reverts to the clean shipped default)', () => {
  const S = loadSanitizeModule();
  S.updateProfileOverride('servicenow', (profile) => { profile.keyRules = []; });
  S.removeProfileOverride('servicenow');
  const sn = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  assert.ok(!sn.__dirty);
});

test('exportProfile forks a built-in profile to a new id and leaves the original dirty state untouched', () => {
  const S = loadSanitizeModule();
  S.updateProfileOverride('servicenow', (profile) => { profile.keyRules.push({ id: 'x', type: 'key', match: 'x', matchMode: 'wildcard', generator: 'generic' }); });
  const dirtySn = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  const exported = S.exportProfile(dirtySn, 'My ServiceNow Variant');
  assert.notEqual(exported.id, 'servicenow');
  assert.equal(exported.name, 'My ServiceNow Variant');
  assert.ok(!('__dirty' in exported), 'exported JSON should not carry internal bookkeeping fields');
  // the original servicenow profile (and its dirty state) is unaffected by exporting a fork of it
  const stillDirtySn = S.getMergedRuleset().profiles.find((p) => p.id === 'servicenow');
  assert.equal(stillDirtySn.__dirty, true);
  // the fork itself is not registered as a selectable profile just by exporting
  assert.ok(!S.getMergedRuleset().profiles.some((p) => p.id === exported.id));
});

test('exportProfile updates an already-custom profile in place and clears its dirty flag', () => {
  const S = loadSanitizeModule();
  const imported = S.importAndMergeRuleset({ profiles: [{ id: 'my-custom', name: 'My Custom', keyRules: [], patternRules: [] }] });
  S.updateProfileOverride(imported[0], (profile) => { profile.keyRules.push({ id: 'x', type: 'key', match: 'x', matchMode: 'wildcard', generator: 'generic' }); });
  const dirtyCustom = S.getMergedRuleset().profiles.find((p) => p.id === 'my-custom');
  assert.equal(dirtyCustom.__dirty, true);
  const exported = S.exportProfile(dirtyCustom, 'My Custom Renamed');
  assert.equal(exported.id, 'my-custom');
  assert.equal(exported.name, 'My Custom Renamed');
  const afterExport = S.getMergedRuleset().profiles.find((p) => p.id === 'my-custom');
  assert.equal(afterExport.__dirty, false);
  assert.equal(afterExport.name, 'My Custom Renamed');
});

test('importAndMergeRuleset adds/replaces profiles by id without clobbering an unrelated profile\'s override', () => {
  const S = loadSanitizeModule();
  S.updateProfileOverride('generic', (profile) => { profile.keyRules.push({ id: 'kept', type: 'key', match: 'kept', matchMode: 'wildcard', generator: 'generic' }); });
  const importedIds = S.importAndMergeRuleset({ profiles: [{ id: 'servicenow-variant', name: 'SN Variant', keyRules: [], patternRules: [] }] });
  assert.deepEqual(importedIds, ['servicenow-variant']);
  const merged = S.getMergedRuleset();
  assert.ok(merged.profiles.some((p) => p.id === 'servicenow-variant' && p.name === 'SN Variant' && p.__dirty === false));
  const generic = merged.profiles.find((p) => p.id === 'generic');
  assert.ok(generic.keyRules.some((r) => r.id === 'kept'), 'importing an unrelated ruleset must not discard generic\'s existing customization');
});
