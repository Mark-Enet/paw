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
    XPathResult: {
      ANY_TYPE: 0,
      NUMBER_TYPE: 1,
      STRING_TYPE: 2,
      BOOLEAN_TYPE: 3,
      UNORDERED_NODE_ITERATOR_TYPE: 4,
      ORDERED_NODE_ITERATOR_TYPE: 5,
      UNORDERED_NODE_SNAPSHOT_TYPE: 6,
      ORDERED_NODE_SNAPSHOT_TYPE: 7,
      ANY_UNORDERED_NODE_TYPE: 8,
      FIRST_ORDERED_NODE_TYPE: 9,
    },
    console,
  };
  context.globalThis = context;
  vm.runInNewContext(source, context, { filename: 'js/app.js' });
  return { Component: context.__Component, XPathResult: context.XPathResult };
}

const { Component, XPathResult } = loadComponentClass();
const component = Object.create(Component.prototype);

function makeSnapshot(nodes, type = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
  return {
    resultType: type,
    snapshotLength: nodes.length,
    snapshotItem(index) { return nodes[index] || null; },
  };
}

function makeIterator(nodes, type = XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
  let index = 0;
  return {
    resultType: type,
    iterateNext() { return nodes[index++] || null; },
  };
}

function elementNode(name, outerHTML, textContent) {
  return { nodeType: 1, nodeName: name, outerHTML, textContent: textContent || '' };
}

function textNode(text) {
  return { nodeType: 3, nodeName: '#text', textContent: text };
}

function attrNode(name, value) {
  return { nodeType: 2, nodeName: name, value, textContent: value };
}

function evalWith(result) {
  const doc = {
    evaluate(expr, contextNode, resolver, type) {
      assert.equal(type, XPathResult.ANY_TYPE);
      return result;
    },
  };
  return component.runXPath(doc, 'dummy');
}

test('supports snapshot node-set XPath results', () => {
  const result = evalWith(makeSnapshot([
    elementNode('title', '<title>Sword</title>', 'Sword'),
    elementNode('title', '<title>Shield</title>', 'Shield'),
  ]));

  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, r => r.val), ['<title>Sword</title>', '<title>Shield</title>']);
});

test('supports iterator node-set XPath results', () => {
  const result = evalWith(makeIterator([
    elementNode('price', '<price>8.95</price>', '8.95'),
    elementNode('price', '<price>12.99</price>', '12.99'),
  ]));

  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, r => r.val), ['<price>8.95</price>', '<price>12.99</price>']);
});

test('supports attribute and text-node XPath results', () => {
  const doc = {
    calls: 0,
    evaluate(expr, contextNode, resolver, type) {
      assert.equal(type, XPathResult.ANY_TYPE);
      this.calls += 1;
      return this.calls === 1
        ? makeSnapshot([attrNode('id', 'd2')])
        : makeSnapshot([textNode('Produce')]);
    },
  };

  const attrRes = component.runXPath(doc, '//department/@id');
  const textRes = component.runXPath(doc, '//department/title/text()');

  assert.equal(attrRes.ok, true);
  assert.equal(textRes.ok, true);
  assert.deepEqual(Array.from(attrRes.results, r => r.val), ['d2']);
  assert.deepEqual(Array.from(textRes.results, r => r.val), ['Produce']);
});

test('supports string XPath results', () => {
  const result = evalWith({ resultType: XPathResult.STRING_TYPE, stringValue: 'Produce' });
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, r => r.val), ['Produce']);
});

test('supports numeric XPath results', () => {
  const result = evalWith({ resultType: XPathResult.NUMBER_TYPE, numberValue: 3 });
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, r => r.val), [3]);
});

test('supports boolean XPath results', () => {
  const result = evalWith({ resultType: XPathResult.BOOLEAN_TYPE, booleanValue: true });
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.results, r => r.val), [true]);
});

test('rejects invalid XPath expressions', () => {
  const doc = {
    evaluate() {
      throw new Error('Invalid XPath');
    },
  };
  const result = component.runXPath(doc, '//*[');
  assert.equal(result.ok, false);
});
