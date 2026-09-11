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

const S = loadSanitizeModule();

test('detectPatternForValue recognizes a GUID', () => {
  const d = S.detectPatternForValue('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', []);
  assert.equal(d.type, 'shape');
  assert.equal(d.generator, 'guid');
  assert.match('a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6', new RegExp('^(?:' + d.pattern + ')$'));
});

test('detectPatternForValue recognizes a 32-char hex id', () => {
  const d = S.detectPatternForValue('550e8400e29b41d4a716446655440000', []);
  assert.equal(d.type, 'shape');
  assert.equal(d.generator, 'hex32');
});

test('detectPatternForValue recognizes an email', () => {
  const d = S.detectPatternForValue('jane.doe@example.com', []);
  assert.equal(d.type, 'shape');
  assert.equal(d.generator, 'email');
});

test('detectPatternForValue recognizes IPv6 and MAC addresses', () => {
  const ipv6 = S.detectPatternForValue('2001:0db8:85a3:0000:0000:8a2e:0370:7334', []);
  assert.equal(ipv6.type, 'shape');
  assert.equal(ipv6.generator, 'ipv6');
  const ipv6Short = S.detectPatternForValue('::1', []);
  assert.equal(ipv6Short.type, 'shape');
  assert.equal(ipv6Short.generator, 'ipv6');

  const mac = S.detectPatternForValue('00:1A:2B:3C:4D:5E', []);
  assert.equal(mac.type, 'shape');
  assert.equal(mac.generator, 'mac');
});

test('detectPatternForValue recognizes a URL', () => {
  const d = S.detectPatternForValue('https://example.com/path?x=1', []);
  assert.equal(d.type, 'shape');
  assert.equal(d.generator, 'url');
});

test('detectPatternForValue recognizes timestamp shapes (absolute and relative)', () => {
  const iso = S.detectPatternForValue('2026-01-01T10:00:00Z', []);
  assert.equal(iso.type, 'shape');
  assert.equal(iso.generator, 'timestamp');

  const usAmpm = S.detectPatternForValue('09/10/2026 02:20:40 PM', []);
  assert.equal(usAmpm.type, 'shape');
  assert.equal(usAmpm.generator, 'timestamp');

  const relative = S.detectPatternForValue('2 hours ago', []);
  assert.equal(relative.type, 'shape');
  assert.equal(relative.generator, 'timestamp');
});

test('detectPatternForValue falls back to a length-preserving digit/hex/alnum class for unrecognized shapes', () => {
  const digits = S.detectPatternForValue('123456', []);
  assert.equal(digits.type, 'fallback');
  assert.equal(digits.generator, 'numericId');
  assert.equal(digits.pattern, '\\b\\d{6}\\b');

  const alnum = S.detectPatternForValue('abc123XY', []);
  assert.equal(alnum.type, 'fallback');
  assert.equal(alnum.generator, 'generic');
  assert.equal(alnum.pattern, '\\b[A-Za-z0-9]{8}\\b');
});

test('detectPatternForValue treats a purely alphanumeric value as one flat class+length pattern, regardless of internal digit/letter arrangement', () => {
  const d = S.detectPatternForValue('INC0012345', []);
  assert.equal(d.type, 'fallback');
  assert.equal(d.pattern, '\\b[A-Za-z0-9]{10}\\b');
});

test('detectPatternForValue falls back to a segmented structure-preserving pattern when punctuation/spacing is mixed in', () => {
  const d = S.detectPatternForValue('INC-0012345', []);
  assert.equal(d.type, 'fallback');
  assert.equal(d.pattern, '[A-Za-z]{3}-\\d{7}');
  assert.match('INC-0012345', new RegExp('^(?:' + d.pattern + ')$'));
  assert.doesNotMatch('XYZ-0012345Q', new RegExp('^(?:' + d.pattern + ')$'));
});

test('detectPatternForValue reports an existing match instead of creating a near-duplicate rule', () => {
  const existingRules = [{ id: 'r1', label: 'sys_id shape', type: 'pattern', pattern: '\\b[0-9a-fA-F]{32}\\b', generator: 'hex32' }];
  const d = S.detectPatternForValue('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', existingRules);
  assert.equal(d.type, 'existing');
  assert.equal(d.rule.id, 'r1');
});

test('detectPatternForValue returns null for empty/whitespace-only input', () => {
  assert.equal(S.detectPatternForValue('', []), null);
  assert.equal(S.detectPatternForValue('   ', []), null);
});

test('new generators are deterministic and format-preserving', () => {
  const ts1 = S.generateFake('09/10/2026 02:20:40 PM', { generator: 'timestamp' });
  const ts2 = S.generateFake('09/10/2026 02:20:40 PM', { generator: 'timestamp' });
  assert.equal(ts1, ts2);
  assert.match(ts1, /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2} PM$/);
  assert.notEqual(ts1, '09/10/2026 02:20:40 PM');

  const url1 = S.generateFake('https://example.com/incident/1234', { generator: 'url' });
  assert.match(url1, /^https:\/\/[a-z]+\.[a-z]+\/[A-Za-z]+\/\d{4}$/);

  const ipv6a = S.generateFake('2001:0db8:85a3:0000:0000:8a2e:0370:7334', { generator: 'ipv6' });
  const ipv6b = S.generateFake('2001:0db8:85a3:0000:0000:8a2e:0370:7334', { generator: 'ipv6' });
  assert.equal(ipv6a, ipv6b);
  assert.equal(ipv6a.split(':').length, 8);

  const mac1 = S.generateFake('00:1A:2B:3C:4D:5E', { generator: 'mac' });
  assert.match(mac1, /^[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}$/);
});
