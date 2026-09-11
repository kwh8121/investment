import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'

import {
  normalizeKiwoomDg2Distribution,
  type KiwoomDistributionRow,
} from '../src/lib/etf/kiwoom-dg2-distribution-adapter.ts'

const row: KiwoomDistributionRow = {
  gcode: '069660',
  goodsNm: '',
  stdDt: '2026.07.31',
  payDt: '2026.08.04',
  payRockDt: '20260730',
  cashPayDt: '20260804',
  dividendAmt: '130',
  taxableAmt: '130',
  dividendRate: '0.15',
  type: '',
}

const rawBytes = new TextEncoder().encode(JSON.stringify({ resultList: [row] }))

function input(
  overrides: Partial<Parameters<typeof normalizeKiwoomDg2Distribution>[0]> = {}
) {
  return {
    ticker: '069660',
    productName: 'KIWOOM 200',
    row,
    capturedSource: {
      sourceUri:
        'https://www.kiwoometf.com/service/report/KO03020200PSelectAjax',
      sourceBytes: rawBytes,
      fetchedAt: '2026-09-10T04:40:55Z',
    },
    ...overrides,
  }
}

describe('Kiwoom DG2 distribution adapter', () => {
  it('normalizes an official Kiwoom distribution row as unverified candidate evidence', () => {
    const result = normalizeKiwoomDg2Distribution(input())

    assert.equal(result.ticker, '069660')
    assert.equal(result.productName, 'KIWOOM 200')
    assert.equal(result.recordDate, '2026-07-31')
    assert.equal(result.exDistributionDate, '2026-07-30')
    assert.equal(result.paymentDate, '2026-08-04')
    assert.equal(result.distributionAmount, 130)
    assert.equal(result.currency, 'KRW')
    assert.equal(result.distributionRatePercent, 0.15)
    assert.equal(
      result.sourceSha256,
      createHash('sha256').update(rawBytes).digest('hex')
    )
    assert.equal(result.dividendVerified, false)
  })

  it('rejects a row whose code, payment dates, or amount are invalid', () => {
    assert.throws(() =>
      normalizeKiwoomDg2Distribution(
        input({ row: { ...row, gcode: '123456' } })
      )
    )
    assert.throws(() =>
      normalizeKiwoomDg2Distribution(
        input({ row: { ...row, cashPayDt: '20260805' } })
      )
    )
    assert.throws(() =>
      normalizeKiwoomDg2Distribution(
        input({ row: { ...row, dividendAmt: '-1' } })
      )
    )
  })

  it('rejects source bytes that do not hash to the declared captured response', () => {
    assert.throws(() =>
      normalizeKiwoomDg2Distribution(
        input({
          capturedSource: {
            sourceUri:
              'https://www.kiwoometf.com/service/report/KO03020200PSelectAjax',
            sourceBytes: new TextEncoder().encode('different response'),
            fetchedAt: '2026-09-10T04:40:55Z',
          },
        })
      )
    )
  })
})
