import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'

import {
  captureKrxEtfDailyMarketData,
  KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI,
  type KrxEtfDailyMarketDataFetch,
} from '../src/lib/etf/krx-etf-daily-market-data.ts'

const BAS_DD = '20260908'
const ETF_ROW = {
  BAS_DD,
  ISU_CD: '451060',
  ISU_NM: 'KODEX CD금리액티브(합성)',
  TDD_CLSPRC: '10,305',
  NAV: '10,304.87',
  ACC_TRDVOL: '1,000',
  ACC_TRDVAL: '10,305,000',
}

interface MockResponse {
  ok: boolean
  arrayBuffer(): Promise<ArrayBuffer>
}

function response(body: string, ok = true): MockResponse {
  return {
    ok,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  }
}

function captureInput(
  mockResponse: MockResponse,
  overrides: {
    apiKey?: string
    basDd?: string
  } = {}
) {
  const requests: Array<{
    url: string
    headers: { AUTH_KEY: string }
    redirect: 'error'
  }> = []
  const fetch: KrxEtfDailyMarketDataFetch = async (url, init) => {
    requests.push({ url, headers: init.headers, redirect: init.redirect })
    return mockResponse
  }

  return {
    input: {
      apiKey: overrides.apiKey ?? 'test-api-key',
      basDd: overrides.basDd ?? BAS_DD,
      fetch,
    },
    requests,
  }
}

describe('KRX ETF daily market data capture', () => {
  it('captures, hashes, and validates documented ETF rows through the exact endpoint', async () => {
    const body = JSON.stringify({ OutBlock_1: [ETF_ROW] })
    const { input, requests } = captureInput(response(body))

    const result = await captureKrxEtfDailyMarketData(input)

    assert.deepEqual(requests, [
      {
        url: `${KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI}?basDd=${BAS_DD}`,
        headers: { AUTH_KEY: 'test-api-key' },
        redirect: 'error',
      },
    ])
    assert.equal(result.sourceUri, KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI)
    assert.equal(
      result.sourceSha256,
      createHash('sha256').update(new TextEncoder().encode(body)).digest('hex')
    )
    assert.match(result.fetchedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    assert.deepEqual(result.rows, [ETF_ROW])
    assert.deepEqual(result.sourceBytes, new TextEncoder().encode(body))
  })

  it('accepts an uppercase alphanumeric KRX ISU_CD from the daily market response', async () => {
    const { input } = captureInput(
      response(
        JSON.stringify({ OutBlock_1: [{ ...ETF_ROW, ISU_CD: '0184E0' }] })
      )
    )

    const result = await captureKrxEtfDailyMarketData(input)

    assert.equal(result.rows[0]?.ISU_CD, '0184E0')
  })

  it('rejects a non-OK response without accepting its body', async () => {
    const { input } = captureInput(response('not used', false))

    await assert.rejects(
      () => captureKrxEtfDailyMarketData(input),
      /KRX ETF daily market data response was not successful/
    )
  })

  it('rejects invalid JSON and absent or empty OutBlock_1 rows', async () => {
    for (const body of ['not json', '{}', '{"OutBlock_1":[]}']) {
      const { input } = captureInput(response(body))
      await assert.rejects(() => captureKrxEtfDailyMarketData(input))
    }
  })

  it('rejects malformed rows, including invalid ticker and numeric quote fields', async () => {
    const invalidRows = [
      { ...ETF_ROW, ISU_CD: '45106' },
      { ...ETF_ROW, ISU_CD: '0184e0' },
      { ...ETF_ROW, ISU_NM: ' ' },
      { ...ETF_ROW, TDD_CLSPRC: 'not-a-number' },
      { ...ETF_ROW, NAV: '-1' },
      { ...ETF_ROW, ACC_TRDVOL: '1,23' },
      { ...ETF_ROW, ACC_TRDVAL: '' },
    ]

    for (const invalidRow of invalidRows) {
      const { input } = captureInput(
        response(JSON.stringify({ OutBlock_1: [invalidRow] }))
      )
      await assert.rejects(() => captureKrxEtfDailyMarketData(input))
    }
  })

  it('rejects fractional cumulative volume', async () => {
    const { input } = captureInput(
      response(
        JSON.stringify({
          OutBlock_1: [{ ...ETF_ROW, ACC_TRDVOL: '1,000.5' }],
        })
      )
    )

    await assert.rejects(() => captureKrxEtfDailyMarketData(input))
  })

  it('rejects fractional cumulative trade value', async () => {
    const { input } = captureInput(
      response(
        JSON.stringify({
          OutBlock_1: [{ ...ETF_ROW, ACC_TRDVAL: '10,305,000.5' }],
        })
      )
    )

    await assert.rejects(() => captureKrxEtfDailyMarketData(input))
  })

  it('rejects duplicate daily instrument rows', async () => {
    const { input } = captureInput(
      response(JSON.stringify({ OutBlock_1: [ETF_ROW, { ...ETF_ROW }] }))
    )

    await assert.rejects(
      () => captureKrxEtfDailyMarketData(input),
      /duplicate daily instrument row/
    )
  })

  it('rejects rows that are not bound to the requested date', async () => {
    const { input } = captureInput(
      response(
        JSON.stringify({ OutBlock_1: [{ ...ETF_ROW, BAS_DD: '20260907' }] })
      )
    )

    await assert.rejects(
      () => captureKrxEtfDailyMarketData(input),
      /does not match requested basDd/
    )
  })

  it('rejects invalid requested dates and missing API keys before calling fetch', async () => {
    const invalidDate = captureInput(
      response(JSON.stringify({ OutBlock_1: [ETF_ROW] })),
      { basDd: '2026090x' }
    )
    await assert.rejects(
      () => captureKrxEtfDailyMarketData(invalidDate.input),
      /YYYYMMDD/
    )
    assert.equal(invalidDate.requests.length, 0)

    const missingKey = captureInput(
      response(JSON.stringify({ OutBlock_1: [ETF_ROW] })),
      { apiKey: ' ' }
    )
    await assert.rejects(
      () => captureKrxEtfDailyMarketData(missingKey.input),
      /API key is required/
    )
    assert.equal(missingKey.requests.length, 0)
  })
})
