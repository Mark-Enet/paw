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

test('denoiseTimestamps handles ISO timestamps (regression: already worked before this change)', () => {
  assert.equal(S.denoiseTimestamps('created at 2026-01-01T10:00:00Z'), 'created at <TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('2026-01-01 10:00:00.123'), '<TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('2026-01-01T10:00:00+05:30'), '<TIMESTAMP>');
});

test('denoiseTimestamps handles US date + 12h time with AM/PM', () => {
  assert.equal(S.denoiseTimestamps('09/10/2026 02:20:40 PM'), '<TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('Updated: 9/10/2026, 2:20 PM'), 'Updated: <TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('09/10/2026 02:20:40 pm'), '<TIMESTAMP>');
});

test('denoiseTimestamps handles the ServiceNow-style combined absolute + trailing relative format', () => {
  assert.equal(S.denoiseTimestamps('09/10/2026 02:03:43 PM about 16 hours ago'), '<TIMESTAMP> <RELATIVE_TIME>');
});

test('denoiseTimestamps handles a standalone relative-time phrase with no leading absolute stamp', () => {
  assert.equal(S.denoiseTimestamps('2 hours ago'), '<RELATIVE_TIME>');
  assert.equal(S.denoiseTimestamps('just now'), '<RELATIVE_TIME>');
  assert.equal(S.denoiseTimestamps('~5 minutes ago'), '<RELATIVE_TIME>');
  assert.equal(S.denoiseTimestamps('updated approximately 3 days ago'), 'updated <RELATIVE_TIME>');
});

test('denoiseTimestamps handles bare date-only values (no time part)', () => {
  assert.equal(S.denoiseTimestamps('2026-01-01'), '<TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('09/10/2026'), '<TIMESTAMP>');
});

test('denoiseTimestamps handles month-name dates, with and without a time part, both cases', () => {
  assert.equal(S.denoiseTimestamps('Jan 5, 2026'), '<TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('January 5, 2026 2:20:40 PM'), '<TIMESTAMP>');
  assert.equal(S.denoiseTimestamps('jan 5, 2026'), '<TIMESTAMP>');
});

test('denoiseTimestamps does not touch a bare epoch number or a hex32 sys_id', () => {
  assert.equal(S.denoiseTimestamps('1717000000'), '1717000000');
  assert.equal(S.denoiseTimestamps('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'), 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4');
});

test('denoiseTimestamps is idempotent (running twice on already-denoised text is a no-op)', () => {
  const once = S.denoiseTimestamps('09/10/2026 02:03:43 PM about 16 hours ago');
  const twice = S.denoiseTimestamps(once);
  assert.equal(once, twice);
});
