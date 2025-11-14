import type { ResolvedEncodeOptions } from '../src/types'
import type { Fixtures, TestCase } from './types'
import arraysNested from '@toon-format/spec/tests/fixtures/encode/arrays-nested.json'
import arraysObjects from '@toon-format/spec/tests/fixtures/encode/arrays-objects.json'
import arraysPrimitive from '@toon-format/spec/tests/fixtures/encode/arrays-primitive.json'
import arraysTabular from '@toon-format/spec/tests/fixtures/encode/arrays-tabular.json'
import delimiters from '@toon-format/spec/tests/fixtures/encode/delimiters.json'
import keyFolding from '@toon-format/spec/tests/fixtures/encode/key-folding.json'
import objects from '@toon-format/spec/tests/fixtures/encode/objects.json'
import primitives from '@toon-format/spec/tests/fixtures/encode/primitives.json'
import whitespace from '@toon-format/spec/tests/fixtures/encode/whitespace.json'
import { describe, expect, it } from 'vitest'
import { DEFAULT_DELIMITER, encode } from '../src/index'
import { complexRecordJson, complexRecordLines } from './record.fixtures'

const fixtureFiles = [
  primitives,
  objects,
  arraysPrimitive,
  arraysTabular,
  arraysNested,
  arraysObjects,
  keyFolding,
  delimiters,
  whitespace,
] as Fixtures[]

for (const fixtures of fixtureFiles) {
  describe(fixtures.description, () => {
    for (const test of fixtures.tests) {
      it(test.name, () => {
        const resolvedOptions = resolveEncodeOptions(test.options)

        if (test.shouldError) {
          expect(() => encode(test.input, resolvedOptions))
            .toThrow()
        }
        else {
          const result = encode(test.input, resolvedOptions)
          expect(result).toBe(test.expected)
        }
      })
    }
  })
}

describe('auto delimiter selection', () => {
  it('prefers delimiter that avoids quoting for inline arrays', () => {
    const result = encode({
      tags: ['foo,bar', 'baz'],
    }, { delimiter: 'auto' })

    expect(result).toBe('tags[2	]: foo,bar	baz')
  })

  it('prefers delimiter that avoids quoting for tabular arrays', () => {
    const result = encode({
      rows: [
        { name: 'Alice, Bob', id: 1 },
        { name: 'Charlie', id: 2 },
      ],
    }, { delimiter: 'auto' })

    expect(result).toBe([
      'rows[2	]{name	id}:',
      '  Alice, Bob	1',
      '  Charlie	2',
    ].join('\n'))
  })
})

describe('record layout', () => {
  it('serializes uniform object arrays as compact records', () => {
    const data = {
      users: [
        { id: 1, name: 'Alice', email: 'alice@mail', role: 'admin', age: 32, flags: 12, scores: [10, 11, 12] },
        { id: 2, name: 'Bob', email: 'bob@mail', role: 'user', age: 27, flags: 4, scores: [7, 9] },
      ],
      orders: [
        { id: 101, userId: 1, total: 129.9, status: 'paid', items: [4, 3, 1] },
      ],
    }

    const result = encode(data, { layout: 'record', delimiter: '|' })

    expect(result).toBe([
      'users::id:1;name:Alice;email:alice@mail;role:admin;age:32;flags:12;scores:10|11|12',
      'users::id:2;name:Bob;email:bob@mail;role:user;age:27;flags:4;scores:7|9',
      'orders::id:101;userId:1;total:129.9;status:paid;items:4|3|1',
    ].join('\n'))
  })

  it('quotes record string values that would collide with delimiters', () => {
    const data = {
      logs: [
        { id: 'evt-1', message: 'hello, world', tags: ['alpha', 'beta'] },
      ],
    }

    const result = encode(data, { layout: 'record', delimiter: '|' })

    expect(result).toBe('logs::id:evt-1;message:"hello, world";tags:alpha|beta')
  })

  it('falls back to the standard layout when rows contain nested objects', () => {
    const data = {
      groups: [
        { id: 1, meta: { active: true } },
      ],
    }

    const standard = encode(data)
    const recordAttempt = encode(data, { layout: 'record' })

    expect(recordAttempt).toBe(standard)
  })

  it('flattens nested objects into dotted keys when key folding is safe', () => {
    const data = {
      users: [
        {
          id: 1,
          name: 'Alice',
          settings: {
            theme: 'dark',
            notifications: { email: true, push: false },
          },
          tags: ['alpha', 'beta'],
        },
        {
          id: 2,
          name: 'Bob',
          settings: {
            theme: 'light',
            notifications: { email: false, push: true },
          },
          tags: ['gamma'],
        },
      ],
    }

    const result = encode(data, { layout: 'record', keyFolding: 'safe', delimiter: '|' })

    expect(result).toBe([
      'users::id:1;name:Alice;settings.theme:dark;settings.notifications.email:true;settings.notifications.push:false;tags:alpha|beta',
      'users::id:2;name:Bob;settings.theme:light;settings.notifications.email:false;settings.notifications.push:true;tags:gamma',
    ].join('\n'))
  })

  it('serializes a large mixed dataset into compact records', () => {
    const result = encode(complexRecordJson, {
      layout: 'record',
      keyFolding: 'safe',
      delimiter: '|',
    })

    expect(result).toBe(complexRecordLines)
  })
})

function resolveEncodeOptions(options?: TestCase['options']): ResolvedEncodeOptions {
  const indent = options?.indent ?? 2
  const keyFolding = options?.keyFolding ?? 'off'
  const flattenDepth = options?.flattenDepth ?? Number.POSITIVE_INFINITY
  const delimiterOption = options?.delimiter ?? DEFAULT_DELIMITER
  const layout = options?.layout ?? 'standard'

  if (delimiterOption === 'auto') {
    return {
      indent,
      delimiter: DEFAULT_DELIMITER,
      delimiterStrategy: 'auto',
      layout,
      keyFolding,
      flattenDepth,
    }
  }

  return {
    indent,
    delimiter: delimiterOption,
    delimiterStrategy: 'fixed',
    layout,
    keyFolding,
    flattenDepth,
  }
}
