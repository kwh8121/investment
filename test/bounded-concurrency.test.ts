import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mapBoundedInOrder } from '../src/lib/etf/bounded-concurrency.ts'

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

describe('mapBoundedInOrder', () => {
  it('limits in-flight work and preserves input order', async () => {
    let active = 0
    let maximumActive = 0

    const results = await mapBoundedInOrder([3, 2, 1, 0], 2, async value => {
      active += 1
      maximumActive = Math.max(maximumActive, active)
      await delay(value)
      active -= 1
      return value * 10
    })

    assert.equal(maximumActive, 2)
    assert.deepEqual(results, [30, 20, 10, 0])
  })

  it('rejects a worker failure without scheduling further work', async () => {
    const started: number[] = []

    await assert.rejects(
      () =>
        mapBoundedInOrder([0, 1, 2, 3], 2, async value => {
          started.push(value)
          if (value === 0) throw new Error('expected failure')
          await delay(1)
          return value
        }),
      /expected failure/
    )

    assert.deepEqual(started, [0, 1])
  })

  it('rejects invalid concurrency limits', async () => {
    await assert.rejects(() => mapBoundedInOrder([], 0, async value => value))
  })
})
