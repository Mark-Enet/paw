const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadTableModule() {
  const context = { window: {}, console };
  context.globalThis = context;
  vm.createContext(context);
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'table.js'), 'utf8');
  vm.runInContext(src, context, { filename: 'js/table.js' });
  return context.window.PAW_TABLE;
}

const PAW_TABLE = loadTableModule();

// Objects/arrays built inside the vm context are a different realm's Array/
// Object than this file's — deepEqual (strict) treats that as a mismatch
// even with identical content, so normalize through JSON before comparing.
function plain(x) { return JSON.parse(JSON.stringify(x)); }

test('detects and parses TSV (snutils-style tab-separated export)', () => {
  const input = 'Created\tLevel\tSource\tMessage\n2026-01-01 10:00:00\tError\tMyScript\tVPN client failed\n2026-01-01 10:00:01\tInfo\tMyScript\tRetrying';
  const parsed = PAW_TABLE.parse(input);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.format, 'table');
  assert.equal(parsed.tableMeta.kind, 'tsv');
  assert.deepEqual(plain(parsed.tableMeta.headers), ['Created', 'Level', 'Source', 'Message']);
  assert.equal(parsed.value.length, 2);
  assert.equal(parsed.value[0].Message, 'VPN client failed');
  assert.equal(parsed.value[1].Level, 'Info');
});

test('detects and parses CSV with quoted fields containing commas/newlines', () => {
  const input = 'sys_id,short_description\n8a92cfae1b3a4a1084b1e1c4f2b3d4e5,"VPN, client won\'t connect"\n' +
    'b1234,"Line one\nLine two"';
  const parsed = PAW_TABLE.parse(input);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.tableMeta.kind, 'csv');
  assert.equal(parsed.value[0].short_description, "VPN, client won't connect");
  assert.equal(parsed.value[1].short_description, 'Line one\nLine two');
});

test('detects and parses a Markdown table', () => {
  const input = '| Level | Message |\n| --- | --- |\n| Error | Boom |\n| Info | OK |';
  const parsed = PAW_TABLE.parse(input);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.tableMeta.kind, 'md');
  assert.deepEqual(plain(parsed.value), [{ Level: 'Error', Message: 'Boom' }, { Level: 'Info', Message: 'OK' }]);
});

test('rejects freeform text and single-line input (not tabular)', () => {
  assert.equal(PAW_TABLE.detect('just a plain log line with, a comma in it'), null);
  assert.equal(PAW_TABLE.detect('single line, no second row'), null);
  assert.equal(PAW_TABLE.detect(''), null);
});

test('rejects inconsistent row/column counts rather than guessing', () => {
  const input = 'a,b,c\n1,2\n3,4,5';
  assert.equal(PAW_TABLE.detect(input), null);
});

test('blank/duplicate headers get a stable column_N fallback name', () => {
  const input = 'a,,a\n1,2,3\n4,5,6';
  const parsed = PAW_TABLE.parse(input);
  assert.equal(parsed.ok, true);
  assert.deepEqual(plain(parsed.tableMeta.headers), ['a', 'column_2', 'a_3']);
});

test('serialize round-trips CSV/TSV/MD back to their original shape', () => {
  const csv = PAW_TABLE.parse('a,b\n1,2\n3,4');
  assert.equal(PAW_TABLE.serialize(csv.value, csv.tableMeta), 'a,b\n1,2\n3,4');

  const tsv = PAW_TABLE.parse('a\tb\n1\t2');
  assert.equal(PAW_TABLE.serialize(tsv.value, tsv.tableMeta), 'a\tb\n1\t2');

  const md = PAW_TABLE.parse('| a | b |\n| --- | --- |\n| 1 | 2 |');
  assert.equal(PAW_TABLE.serialize(md.value, md.tableMeta), '| a | b |\n| --- | --- |\n| 1 | 2 |');
});

test('serialize quotes CSV fields that need it after edits', () => {
  const csv = PAW_TABLE.parse('a,b\nfoo,bar');
  csv.value[0].b = 'has, a comma';
  assert.equal(PAW_TABLE.serialize(csv.value, csv.tableMeta), 'a,b\nfoo,"has, a comma"');
});

test('log column heuristics: level/timestamp/key guessing', () => {
  const headers = ['sys_created_on', 'level', 'source', 'message', 'sys_id'];
  assert.equal(PAW_TABLE.guessLevelColumn(headers), 'level');
  assert.equal(PAW_TABLE.guessTimestampColumn(headers), 'sys_created_on');
  assert.equal(PAW_TABLE.guessKeyColumn(headers), 'sys_id');
});

test('guessMessageColumn prefers a message-like header, falling back to the last column', () => {
  assert.equal(PAW_TABLE.guessMessageColumn(['level', 'message', 'source']), 'message');
  assert.equal(PAW_TABLE.guessMessageColumn(['a', 'b', 'c']), 'c');
  assert.equal(PAW_TABLE.guessMessageColumn([]), null);
});

test('normalizeLevel maps common ServiceNow-style level text to a canonical bucket', () => {
  assert.equal(PAW_TABLE.normalizeLevel('Error'), 'error');
  assert.equal(PAW_TABLE.normalizeLevel('3 - Warning'), 'warn');
  assert.equal(PAW_TABLE.normalizeLevel('INFO'), 'info');
  assert.equal(PAW_TABLE.normalizeLevel('trace'), 'debug');
  assert.equal(PAW_TABLE.normalizeLevel(''), null);
  assert.equal(PAW_TABLE.normalizeLevel('mystery'), null);
});

test('isContinuationRow treats a blank level as a continuation, even with a repeated (non-blank) timestamp', () => {
  const levelCol = 'level', timeCol = 'created';
  assert.equal(PAW_TABLE.isContinuationRow({ level: '', created: '' }, levelCol, timeCol), true);
  assert.equal(PAW_TABLE.isContinuationRow({ level: 'Error', created: '' }, levelCol, timeCol), false);
  // Blank level but a repeated/non-blank timestamp is still a continuation — level is the primary signal.
  assert.equal(PAW_TABLE.isContinuationRow({ level: '', created: '2026-01-01' }, levelCol, timeCol), true);
  // No level column at all: fall back to the timestamp.
  assert.equal(PAW_TABLE.isContinuationRow({ created: '' }, null, timeCol), true);
  assert.equal(PAW_TABLE.isContinuationRow({ created: '2026-01-01' }, null, timeCol), false);
});
