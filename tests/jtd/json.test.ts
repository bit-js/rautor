import { jtd_json_create_assert_func as create } from '../../src/jtd/json';
import { test, expect } from 'bun:test';

test('Type schema', () => {
  const assert = create({
    type: 'int8'
  });
  console.log(assert.toString());

  expect(assert(null)).toBe(false);
  expect(assert(128)).toBe(false);
  expect(assert(127)).toBe(true);
});

test('Elements schema', () => {
  const assert = create({
    elements: { type: 'string' }
  });
  console.log(assert.toString());

  expect(assert([1, '2', null])).toBe(false);
  expect(assert(['5', '6', '7'])).toBe(true);
});

test('Object schema', () => {
  const assert = create({
    properties: {
      name: { type: 'string' },
      age: { type: 'uint8' }
    },
    optionalProperties: {
      isAdmin: { type: 'boolean' }
    }
  });
  console.log(assert.toString());

  expect(assert({
    name: 'a',
    age: 18
  })).toBe(true);
  expect(assert({
    name: 'b',
    age: -1
  })).toBe(false);
  expect(assert({
    name: 'c'
  })).toBe(false);
});

test('Ref', () => {
  const assert = create({
    definitions: {
      node: {
        properties: {
          store: { type: 'int8' }
        },
        optionalProperties: {
          next: { ref: 'node' }
        }
      }
    },

    properties: {
      items: { elements: { type: 'string' } },
      root: { ref: 'node' }
    }
  });
  console.log(assert.toString());

  expect(assert({
    items: ['a', 'b', 'c'],
    root: {
      store: 0,
      next: {
        store: 2,
        next: {
          store: 1
        }
      }
    }
  })).toBe(true);
});
