import type { Fixtures } from './types'
import arraysNested from '@toon-format/spec/tests/fixtures/decode/arrays-nested.json'
import arraysPrimitive from '@toon-format/spec/tests/fixtures/decode/arrays-primitive.json'
import arraysTabular from '@toon-format/spec/tests/fixtures/decode/arrays-tabular.json'
import blankLines from '@toon-format/spec/tests/fixtures/decode/blank-lines.json'
import delimiters from '@toon-format/spec/tests/fixtures/decode/delimiters.json'
import indentationErrors from '@toon-format/spec/tests/fixtures/decode/indentation-errors.json'
import numbers from '@toon-format/spec/tests/fixtures/decode/numbers.json'
import objects from '@toon-format/spec/tests/fixtures/decode/objects.json'
import pathExpansion from '@toon-format/spec/tests/fixtures/decode/path-expansion.json'
import primitives from '@toon-format/spec/tests/fixtures/decode/primitives.json'
import rootForm from '@toon-format/spec/tests/fixtures/decode/root-form.json'
import validationErrors from '@toon-format/spec/tests/fixtures/decode/validation-errors.json'
import whitespace from '@toon-format/spec/tests/fixtures/decode/whitespace.json'
import { describe, expect, it } from 'vitest'
import { decode } from '../src/index'
import { complexRecordJson, complexRecordLines } from './record.fixtures'

const fixtureFiles = [
  primitives,
  numbers,
  objects,
  arraysPrimitive,
  arraysTabular,
  arraysNested,
  pathExpansion,
  delimiters,
  whitespace,
  rootForm,
  validationErrors,
  indentationErrors,
  blankLines,
] as Fixtures[]

for (const fixtures of fixtureFiles) {
  describe(fixtures.description, () => {
    for (const test of fixtures.tests) {
      it(test.name, () => {
        if (test.shouldError) {
          expect(() => decode(test.input as string, test.options))
            .toThrow()
        }
        else {
          const result = decode(test.input as string, test.options)
          expect(result).toEqual(test.expected)
        }
      })
    }
  })
}

describe('record layout decoding', () => {
  it('decodes compact record lines into object arrays', () => {
    const input = [
      'users::id:1;name:Alice;email:alice@mail;role:admin;age:32;flags:12;scores:10|11|12',
      'users::id:2;name:Bob;email:bob@mail;role:user;age:27;flags:4;scores:7|9',
      'orders::id:101;userId:1;total:129.9;status:paid;items:4|3|1',
      'orders::id:102;userId:2;total:39.9;status:pending;items:2|2',
      'orders::id:103;userId:3;total:560;status:paid;items:10|20|30',
      'orders::id:104;userId:5;total:79.99;status:shipped;items:1',
      'orders::id:105;userId:8;total:22.49;status:failed;items:',
    ].join('\n')

    expect(decode(input)).toEqual({
      users: [
        { id: 1, name: 'Alice', email: 'alice@mail', role: 'admin', age: 32, flags: 12, scores: [10, 11, 12] },
        { id: 2, name: 'Bob', email: 'bob@mail', role: 'user', age: 27, flags: 4, scores: [7, 9] },
      ],
      orders: [
        { id: 101, userId: 1, total: 129.9, status: 'paid', items: [4, 3, 1] },
        { id: 102, userId: 2, total: 39.9, status: 'pending', items: [2, 2] },
        { id: 103, userId: 3, total: 560, status: 'paid', items: [10, 20, 30] },
        { id: 104, userId: 5, total: 79.99, status: 'shipped', items: [1] },
        { id: 105, userId: 8, total: 22.49, status: 'failed', items: [] },
      ],
    })
  })

  it('handles quoted strings and preserves primitive fields', () => {
    const input = [
      'logs::id:evt-1;level:info;message:"hello, world";tags:alpha|beta;latency:12',
      'logs::id:evt-2;level:warn;message:"slow query; check index";tags:slow;latency:512',
      'logs::id:evt-3;level:error;message:"disk full";tags:;latency:1024',
    ].join('\n')

    expect(decode(input)).toEqual({
      logs: [
        { id: 'evt-1', level: 'info', message: 'hello, world', tags: ['alpha', 'beta'], latency: 12 },
        { id: 'evt-2', level: 'warn', message: 'slow query; check index', tags: ['slow'], latency: 512 },
        { id: 'evt-3', level: 'error', message: 'disk full', tags: [], latency: 1024 },
      ],
    })
  })

  it('expands dotted record keys back into nested objects when requested', () => {
    const input = [
      'users::id:1;settings.theme:dark;settings.notifications.email:true;settings.notifications.push:false;tags:alpha|beta',
      'users::id:2;settings.theme:light;settings.notifications.email:false;settings.notifications.push:true;tags:gamma',
    ].join('\n')

    expect(decode(input, { expandPaths: 'safe' })).toEqual({
      users: [
        {
          id: 1,
          settings: {
            theme: 'dark',
            notifications: { email: true, push: false },
          },
          tags: ['alpha', 'beta'],
        },
        {
          id: 2,
          settings: {
            theme: 'light',
            notifications: { email: false, push: true },
          },
          tags: ['gamma'],
        },
      ],
    })
  })

  it('round-trips the large mixed dataset back to JSON', () => {
    expect(decode(complexRecordLines)).toEqual(complexRecordJson)
  })
})
