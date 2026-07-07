const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadComponentClass() {
  const appPath = path.join(__dirname, '..', 'js', 'app.js');
  const source = fs.readFileSync(appPath, 'utf8') + '\n;globalThis.__Component = Component;';
  const context = {
    globalThis: {},
    window: {},
    document: {},
    localStorage: { getItem: () => null },
    location: { hash: '' },
    navigator: { platform: 'Linux', userAgent: 'node' },
    React: { createElement: () => ({}) },
    DCLogic: class {},
    TextEncoder,
    TextDecoder,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    console,
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: 'js/app.js' });
  return context.__Component;
}

const Component = loadComponentClass();
const component = Object.create(Component.prototype);
const sample = {
  store: {
    book: [
      { title: 'Sword', price: 8.95, category: 'fiction' },
      { title: 'Shield', price: 12.99, category: 'history' },
      { title: 'Map', price: 5.99, category: 'travel' },
    ],
    bicycle: { color: 'red', price: 19.95 },
  },
  misc: {
    'odd key': ['zero', 'one', 'two', 'three'],
  },
};

function valuesFor(pathExpr) {
  const result = component.runJsonPath(sample, pathExpr);
  assert.equal(result.ok, true, pathExpr + ' should parse');
  return Array.from(result.results, (entry) => entry.val);
}

test('supports bare root property access', () => {
  assert.deepEqual(valuesFor('$.store.book[0].title'), ['Sword']);
});

test('supports unions of array indexes', () => {
  assert.deepEqual(valuesFor('$.store.book[0,2].title'), ['Sword', 'Map']);
});

test('supports bracket key access for quoted keys with spaces', () => {
  assert.deepEqual(valuesFor("$.misc['odd key'][1]"), ['one']);
});

test('supports array slices with steps', () => {
  assert.deepEqual(valuesFor('$.misc["odd key"][0:4:2]'), ['zero', 'two']);
});

test('supports recursive descent for named properties', () => {
  assert.deepEqual(valuesFor('$..price'), [8.95, 12.99, 5.99, 19.95]);
});

test('supports wildcard over object properties', () => {
  assert.deepEqual(valuesFor('$.store.*.price'), [19.95]);
});

test('supports simple array filters', () => {
  assert.deepEqual(valuesFor('$.store.book[?(@.price < 10)].title'), ['Sword', 'Map']);
});

test('supports logical AND inside filters with parenthesized clauses', () => {
  const values = [
    { value: 90 },
    { value: 100 },
    { value: 110 },
    { value: 130 },
  ];
  const result = component.runJsonPath(values, '$[?((@.value >= 100) && (@.value < 120))].value');
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, (entry) => entry.val), [100, 110]);
});

test('supports logical AND when filter starts as ?(a) && (b)', () => {
  const values = [
    { value: 90 },
    { value: 100 },
    { value: 110 },
    { value: 130 },
  ];
  const result = component.runJsonPath(values, '$[?(@.value >= 100) && (@.value < 120)].value');
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, (entry) => entry.val), [100, 110]);
});

test('supports logical OR inside filters', () => {
  const result = component.runJsonPath(sample, '$.store.book[?((@.price < 7) || (@.category == "history"))].title');
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, (entry) => entry.val), ['Shield', 'Map']);
});

test('rejects malformed JSONPath expressions instead of silently succeeding', () => {
  const result = component.runJsonPath(sample, '$.store[');
  assert.equal(result.ok, false);
});

test('rejects malformed logical filters', () => {
  const result = component.runJsonPath(sample, '$.store.book[?(@.price >= 10 &&)].title');
  assert.equal(result.ok, false);
});
