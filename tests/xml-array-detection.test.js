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

function textNode(text) {
  return { nodeType: 3, textContent: text };
}

function elementNode(name, children = [], attrs = {}) {
  const attributes = Object.keys(attrs).map((k) => ({ name: k, value: attrs[k] }));
  return {
    nodeType: 1,
    nodeName: name,
    attributes,
    children: children.filter((n) => n && n.nodeType === 1),
    childNodes: children.slice(),
  };
}

const Component = loadComponentClass();

function buildXmlModel(rootEl) {
  const component = Object.create(Component.prototype);
  return component.buildXmlNode(rootEl, '/' + rootEl.nodeName, '/' + rootEl.nodeName);
}

test('repeated XML siblings are represented as array nodes', () => {
  const order1 = elementNode('item', [elementNode('id', [textNode('1')])]);
  const order2 = elementNode('item', [elementNode('id', [textNode('2')])]);
  const orders = elementNode('Orders', [order1, order2]);

  const model = buildXmlModel(orders);
  const itemGroup = model.children.find((n) => n.key === 'item');

  assert.ok(itemGroup, 'item group should exist');
  assert.equal(itemGroup.kind, 'array');
  assert.equal(itemGroup.count, 2);
  assert.equal(itemGroup.children[0].path, '/Orders/item[1]');
  assert.equal(itemGroup.children[1].path, '/Orders/item[2]');
  assert.equal(itemGroup.children[0].key, 0);
  assert.equal(itemGroup.children[1].key, 1);
});

test('XML stats count repeated sibling groups as arrays', () => {
  const itemA = elementNode('item', [elementNode('value', [textNode('a')])]);
  const itemB = elementNode('item', [elementNode('value', [textNode('b')])]);
  const itemC = elementNode('item', [elementNode('value', [textNode('c')])]);
  const orders = elementNode('Orders', [itemA, itemB, itemC]);

  const component = Object.create(Component.prototype);
  const model = component.buildXmlNode(orders, '/Orders', '/Orders');
  const stats = component.stats(model, '<Orders>...</Orders>');

  assert.equal(stats.arr, 1);
  assert.equal(stats.obj >= 1, true);
});
