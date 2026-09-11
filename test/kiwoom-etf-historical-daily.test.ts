import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  KIWOOM_ETF_HISTORICAL_DAILY_SOURCE_COMMAND,
  KiwoomRequestedDateMissingError,
  normalizeKiwoomEtfDailyResponse,
  normalizeKiwoomEtfListResponse,
  normalizeKiwoomRequestedDate,
} from '../src/lib/etf/kiwoom-etf-historical-daily.ts'

const REQUESTED_DATE = '20260908'
const listResponse = JSON.stringify({
  etfall_mrpr: [{ stk_cd: '069660', stk_nm: 'KIWOOM 200', stk_cls: 'ETF' }],
})
const dailyRow = {
  cntr_dt: REQUESTED_DATE,
  cur_prc: '12345',
  trde_qty: '1000',
  nav: '12344.56',
  acc_trde_prica: '12345000',
}

function dailyResponse(rows: unknown[]): string {
  return JSON.stringify({ etfdaly_trnsn: rows })
}

describe('Kiwoom ETF historical daily normalizer', () => {
  it('normalizes the requested daily row and converts its exact date to ISO', () => {
    const [listEntry] =
      normalizeKiwoomEtfListResponse(listResponse).numericEntries
    const result = normalizeKiwoomEtfDailyResponse({
      rawResponse: dailyResponse([
        { ...dailyRow, cntr_dt: '20260907' },
        dailyRow,
      ]),
      requestedDate: REQUESTED_DATE,
      ticker: listEntry!.ticker,
      productName: listEntry!.productName,
    })

    assert.deepEqual(result, {
      ticker: '069660',
      productName: 'KIWOOM 200',
      date: '2026-09-08',
      closePrice: 12345,
      tradeQuantity: 1000,
      nav: 12344.56,
      tradeValue: 12345000,
    })
  })

  it('normalizes signed Kiwoom price and NAV direction encodings to magnitudes', () => {
    const result = normalizeKiwoomEtfDailyResponse({
      rawResponse: dailyResponse([
        {
          ...dailyRow,
          cur_prc: '-99105',
          nav: '-99117.94',
          trde_qty: '27169695',
          acc_trde_prica: '2704425',
        },
      ]),
      requestedDate: REQUESTED_DATE,
      ticker: '069660',
      productName: 'KIWOOM 200',
    })

    assert.equal(result.closePrice, 99105)
    assert.equal(result.nav, 99117.94)

    const positiveResult = normalizeKiwoomEtfDailyResponse({
      rawResponse: dailyResponse([
        { ...dailyRow, cur_prc: '+99105', nav: '+99117.94' },
      ]),
      requestedDate: REQUESTED_DATE,
      ticker: '069660',
      productName: 'KIWOOM 200',
    })
    assert.equal(positiveResult.closePrice, 99105)
    assert.equal(positiveResult.nav, 99117.94)
  })

  it('rejects malformed JSON and invalid requested dates', () => {
    assert.throws(
      () => normalizeKiwoomEtfListResponse('not json'),
      /valid JSON/
    )
    assert.throws(
      () => normalizeKiwoomRequestedDate('20260230'),
      /calendar date/
    )
    assert.throws(() => normalizeKiwoomRequestedDate('2026-09-08'), /YYYYMMDD/)
  })

  it('classifies a missing requested-date row separately from duplicate rows', () => {
    assert.throws(
      () =>
        normalizeKiwoomEtfDailyResponse({
          rawResponse: dailyResponse([{ ...dailyRow, cntr_dt: '20260907' }]),
          requestedDate: REQUESTED_DATE,
          ticker: '069660',
          productName: 'KIWOOM 200',
        }),
      KiwoomRequestedDateMissingError
    )
    assert.throws(
      () =>
        normalizeKiwoomEtfDailyResponse({
          rawResponse: dailyResponse([dailyRow, { ...dailyRow }]),
          requestedDate: REQUESTED_DATE,
          ticker: '069660',
          productName: 'KIWOOM 200',
        }),
      /duplicate rows/
    )
  })

  it('rejects a fractional or negative trade value', () => {
    for (const acc_trde_prica of ['123.45', '-1']) {
      assert.throws(
        () =>
          normalizeKiwoomEtfDailyResponse({
            rawResponse: dailyResponse([{ ...dailyRow, acc_trde_prica }]),
            requestedDate: REQUESTED_DATE,
            ticker: '069660',
            productName: 'KIWOOM 200',
          }),
        /invalid integer acc_trde_prica/
      )
    }
  })

  it('rejects malformed signed quotes and signed integer trade fields', () => {
    for (const [cur_prc, nav] of [
      ['--99105', '99117.94'],
      ['+99105', '++99117.94'],
      ['99.105', '99117.94'],
      ['99105', '-'],
    ]) {
      assert.throws(
        () =>
          normalizeKiwoomEtfDailyResponse({
            rawResponse: dailyResponse([{ ...dailyRow, cur_prc, nav }]),
            requestedDate: REQUESTED_DATE,
            ticker: '069660',
            productName: 'KIWOOM 200',
          }),
        /invalid numeric/
      )
    }

    for (const field of ['trde_qty', 'acc_trde_prica'] as const) {
      for (const value of ['-1', '+1']) {
        assert.throws(
          () =>
            normalizeKiwoomEtfDailyResponse({
              rawResponse: dailyResponse([{ ...dailyRow, [field]: value }]),
              requestedDate: REQUESTED_DATE,
              ticker: '069660',
              productName: 'KIWOOM 200',
            }),
          /invalid integer/
        )
      }
    }
  })

  it('separates unsupported list identifiers from numeric daily candidates', () => {
    const result = normalizeKiwoomEtfListResponse(
      JSON.stringify({
        etfall_mrpr: [
          { stk_cd: '069660', stk_nm: 'KIWOOM 200' },
          {
            stk_cd: '0000D0',
            stk_nm: 'TIGER 엔비디아미국채커버드콜밸런스(합성)',
          },
        ],
      })
    )

    assert.deepEqual(result.numericEntries, [
      { ticker: '069660', productName: 'KIWOOM 200' },
    ])
    assert.deepEqual(result.unsupportedIdentifiers, ['0000D0'])
  })

  it('rejects duplicate list tickers, missing identity fields, and no numeric candidates', () => {
    assert.throws(
      () =>
        normalizeKiwoomEtfListResponse(
          JSON.stringify({
            etfall_mrpr: [
              { stk_cd: '069660', stk_nm: 'KIWOOM 200' },
              { stk_cd: '069660', stk_nm: 'KIWOOM 200 2' },
            ],
          })
        ),
      /duplicate ticker/
    )
    assert.throws(
      () =>
        normalizeKiwoomEtfListResponse(
          JSON.stringify({
            etfall_mrpr: [{ stk_cd: '069660', stk_nm: ' ' }],
          })
        ),
      /invalid stk_nm/
    )
    assert.throws(
      () =>
        normalizeKiwoomEtfListResponse(
          JSON.stringify({
            etfall_mrpr: [{ stk_cd: '0000D0', stk_nm: 'TIGER 예시' }],
          })
        ),
      /no numeric six-digit ticker/
    )
  })

  it('declares only the Kiwoom CLI source boundary', () => {
    assert.equal(
      KIWOOM_ETF_HISTORICAL_DAILY_SOURCE_COMMAND,
      'kiwoomcli domestic etfs'
    )
    assert.doesNotMatch(KIWOOM_ETF_HISTORICAL_DAILY_SOURCE_COMMAND, /krx/i)
  })
})
