import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'

import {
  encodeKrxDg3Evidence,
  normalizeKrxDg3Window,
  type KrxDg3WindowInput,
} from '../src/lib/etf/krx-dg3-adapter.ts'

const dividendBytes = new TextEncoder().encode('dividend-evidence')
const dividendSha256 = createHash('sha256').update(dividendBytes).digest('hex')

const input = (): KrxDg3WindowInput => {
  const candidate: KrxDg3WindowInput = {
    ticker: '069500',
    industry: 'index',
    period: '2022',
    strategy: 'momentum',
    strategyVersion: 'strategy-v0.2',
    signalAsOf: '2022-01-03',
    evaluationEnd: '2022-12-29',
    percentile: 95,
    passesFilter: true,
    liquidityScore: 90,
    start: {
      BAS_DD: '20220103',
      ISU_CD: '069500',
      ISU_NM: 'KODEX 200',
      TDD_CLSPRC: '100,000',
      NAV: '100000',
      ACC_TRDVOL: '1000000',
    },
    end: {
      BAS_DD: '20221229',
      ISU_CD: '069500',
      ISU_NM: 'KODEX 200',
      TDD_CLSPRC: '110000',
      NAV: '110000',
      ACC_TRDVOL: '2000000',
    },
    benchmarkTicker: 'KOSPI200',
    benchmarkStartDate: '2022-01-03',
    benchmarkStartClose: '1000',
    benchmarkEndDate: '2022-12-29',
    benchmarkEndClose: '1050',
    dividendReturn: 0.01,
    dividendEvidence: {
      sourceUri: 'https://fund.kodex.com/dividend/069500',
      sourceSha256: dividendSha256,
      rawBytes: dividendBytes,
    },
    sourceUri: 'https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd',
    sourcePublishedAt: '2022-01-03T00:00:00Z',
    fetchedAt: new Date(Date.now() - 1000).toISOString(),
    rawBytes: new Uint8Array(),
  }
  candidate.rawBytes = encodeKrxDg3Evidence(candidate)
  return candidate
}

describe('KRX DG3 adapter', () => {
  it('normalizes KRX rows into a validated DG3 observation', () => {
    const observation = normalizeKrxDg3Window(input())

    assert.equal(observation.ticker, '069500')
    assert.ok(Math.abs(observation.priceReturnLocal - 0.1) < Number.EPSILON)
    assert.ok(Math.abs(observation.benchmarkReturnKrw - 0.05) < Number.EPSILON)
    assert.deepEqual(observation.provenance.observationDates, ['2022-01-03'])
    assert.deepEqual(observation.provenance.outcomeDates, ['2022-12-29'])
    assert.equal(observation.dividendReturn, 0.01)
    assert.equal(
      observation.provenance.dividendEvidence?.sourceUri,
      'https://fund.kodex.com/dividend/069500'
    )
    assert.deepEqual(
      observation.provenance.dividendEvidence?.rawBytes,
      dividendBytes
    )
  })

  it('requires the KRX rows to match the declared window and ticker', () => {
    const mismatchedTicker = input()
    mismatchedTicker.end.ISU_CD = '102110'
    mismatchedTicker.rawBytes = encodeKrxDg3Evidence(mismatchedTicker)
    assert.throws(
      () => normalizeKrxDg3Window(mismatchedTicker),
      /do not match ticker/
    )

    const mismatchedDate = input()
    mismatchedDate.start.BAS_DD = '20220104'
    assert.throws(
      () => normalizeKrxDg3Window(mismatchedDate),
      /do not bind DG3 calculation inputs/
    )
  })

  it('rejects bytes that do not bind the calculation inputs', () => {
    const candidate = input()
    candidate.end.TDD_CLSPRC = '999999'
    assert.throws(
      () => normalizeKrxDg3Window(candidate),
      /do not bind DG3 calculation inputs/
    )
  })

  it('binds dividend provenance to the canonical evidence envelope', () => {
    const candidate = input()
    candidate.dividendEvidence.sourceUri = 'https://example.invalid/dividend'
    assert.throws(
      () => normalizeKrxDg3Window(candidate),
      /do not bind DG3 calculation inputs/
    )
  })

  it('rejects invalid prices and future outcomes', () => {
    const invalidPrice = input()
    invalidPrice.start.TDD_CLSPRC = '0'
    invalidPrice.rawBytes = encodeKrxDg3Evidence(invalidPrice)
    assert.throws(
      () => normalizeKrxDg3Window(invalidPrice),
      /prices must be positive/
    )

    const futureOutcome = input()
    futureOutcome.evaluationEnd = '2999-12-31'
    futureOutcome.end.BAS_DD = '29991231'
    futureOutcome.benchmarkEndDate = '2999-12-31'
    futureOutcome.rawBytes = encodeKrxDg3Evidence(futureOutcome)
    assert.throws(
      () => normalizeKrxDg3Window(futureOutcome),
      /outcome contains future information/
    )
  })
})
