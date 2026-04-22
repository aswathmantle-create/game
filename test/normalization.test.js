const test = require('node:test');
const assert = require('node:assert/strict');
const { textOrNull, toAbsoluteUrl } = require('../src/utils');

test('textOrNull normalizes whitespace', () => {
  assert.equal(textOrNull('  hello\n   world  '), 'hello world');
});

test('textOrNull returns null for empty values', () => {
  assert.equal(textOrNull('   '), null);
  assert.equal(textOrNull(undefined), null);
});

test('toAbsoluteUrl converts relative URL', () => {
  assert.equal(toAbsoluteUrl('/p/item', 'https://www.noon.com/uae-en/'), 'https://www.noon.com/p/item');
});
