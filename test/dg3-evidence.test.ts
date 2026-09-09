import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  normalizeDg3Observations,
  type Dg3RawObservation,
} from '../src/lib/etf/dg3-evidence.ts'

const rawBytes = new TextEncoder().encode('raw-evidence')
const rawSha256 = createHash('sha256').update(rawBytes).digest('hex')

const validRow = (): Dg3RawObservation => ({
  ticker: '069500',
  market: 'KR',
  industry: 'index',
  period: '2022',
  strategy: 'momentum',
  strategyVersion: 'strategy-v0.2',
  signalAsOf: '2022-01-03',
  evaluationEnd: '2022-12-30',
  percentile: 95,
  passesFilter: true,
  liquidityScore: 90,
  priceReturnLocal: -0.1,
  fxReturn: 0,
  dividendReturn: 0.01,
  benchmarkReturnKrw: -0.12,
  provenance: {
    sourceUri: 'https://example.test/krx/069500/2022',
    sourceSha256: rawSha256,
    sourceEffectiveAsOf: '2021-12-30',
    sourcePublishedAt: '2021-12-30T00:00:00Z',
    fetchedAt: new Date(Date.now() - 1000).toISOString(),
    observationDates: ['2021-12-30', '2022-01-03'],
  },
  rawBytes,
})

describe('DG3 evidence normalization', () => {
  it('retains provenance after validating a real-data-shaped row', () => {
    const [observation] = normalizeDg3Observations([validRow()])

    assert.equal(observation?.ticker, '069500')
    assert.equal(observation?.priceReturnLocal, -0.1)
    assert.equal(observation?.provenance.sourceSha256, rawSha256)
    assert.deepEqual(observation?.rawBytes, rawBytes)
    assert.notStrictEqual(observation?.rawBytes, rawBytes)
  })

  it('rejects source evidence published after the signal date', () => {
    const row = validRow()
    row.provenance.sourceEffectiveAsOf = '2022-01-04'

    assert.throws(() => normalizeDg3Observations([row]), /future information/)
  })

  it('rejects invalid hashes and missing observation dates', () => {
    const invalidHash = validRow()
    invalidHash.provenance.sourceSha256 = 'not-a-hash'
    assert.throws(() => normalizeDg3Observations([invalidHash]), /SHA-256/)

    const missingDates = validRow()
    missingDates.provenance.observationDates = []
    assert.throws(
      () => normalizeDg3Observations([missingDates]),
      /observations/
    )
  })

  it('rejects digest mismatches and future fetch timestamps', () => {
    const digestMismatch = validRow()
    digestMismatch.rawBytes = new TextEncoder().encode('changed-evidence')
    assert.throws(
      () => normalizeDg3Observations([digestMismatch]),
      /does not match/
    )

    const futureFetch = validRow()
    futureFetch.provenance.fetchedAt = '2999-01-01T00:00:00Z'
    assert.throws(() => normalizeDg3Observations([futureFetch]), /non-future/)
  })

  it('rejects finite values that cannot produce a valid return', () => {
    const oversizedReturn = validRow()
    oversizedReturn.priceReturnLocal = Number.MAX_VALUE
    assert.throws(
      () => normalizeDg3Observations([oversizedReturn]),
      /derived KRW return/
    )

    const invalidReturn = validRow()
    invalidReturn.dividendReturn = -1.01
    assert.throws(() => normalizeDg3Observations([invalidReturn]), /finite/)
  })

  it('rejects impossible timestamps and fetches before publication', () => {
    const impossibleDate = validRow()
    impossibleDate.provenance.sourcePublishedAt = '2021-02-29T00:00:00Z'
    assert.throws(
      () => normalizeDg3Observations([impossibleDate]),
      /publication timestamp/
    )

    const invalidChronology = validRow()
    invalidChronology.provenance.fetchedAt = '2021-12-29T00:00:00Z'
    assert.throws(
      () => normalizeDg3Observations([invalidChronology]),
      /precedes publication/
    )

    const mixedPrecision = validRow()
    mixedPrecision.provenance.sourcePublishedAt = '2021-12-30T00:00:00.999Z'
    mixedPrecision.provenance.fetchedAt = '2021-12-30T00:00:00Z'
    assert.throws(
      () => normalizeDg3Observations([mixedPrecision]),
      /precedes publication/
    )

    const validPrecision = validRow()
    validPrecision.provenance.sourcePublishedAt = '2021-12-30T00:00:00Z'
    validPrecision.provenance.fetchedAt = '2021-12-30T00:00:00.999Z'
    assert.doesNotThrow(() => normalizeDg3Observations([validPrecision]))
  })

  it('rejects overflow in any derived KRW return component', () => {
    const overflow = validRow()
    overflow.fxReturn = Number.MAX_VALUE
    assert.throws(
      () => normalizeDg3Observations([overflow]),
      /derived KRW return/
    )
  })

  it('rejects malformed runtime fields despite TypeScript declarations', () => {
    const malformedIndustry = validRow()
    Reflect.set(malformedIndustry, 'industry', 123)
    assert.throws(
      () => normalizeDg3Observations([malformedIndustry]),
      /runtime evidence shape/
    )

    const malformedBytes = validRow()
    Reflect.set(malformedBytes, 'rawBytes', 'raw-evidence')
    assert.throws(
      () => normalizeDg3Observations([malformedBytes]),
      /runtime evidence shape/
    )
  })
})
