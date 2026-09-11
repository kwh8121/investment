import { createHash } from 'node:crypto'

export const KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI =
  'https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd'

const COMPACT_DATE_PATTERN = /^\d{8}$/
const KRX_ETF_ISU_CD_PATTERN = /^[A-Z0-9]{6}$/
const NUMERIC_QUOTE_PATTERN =
  /^(?:0|[1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)(?:\.\d+)?$/
const NON_NEGATIVE_WHOLE_NUMBER_PATTERN =
  /^(?:0|[1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)$/

export interface KrxEtfDailyMarketDataRow {
  BAS_DD: string
  ISU_CD: string
  ISU_NM: string
  TDD_CLSPRC: string
  NAV: string
  ACC_TRDVOL: string
  ACC_TRDVAL: string
}

export interface KrxEtfDailyMarketDataFetchResponse {
  ok: boolean
  arrayBuffer(): Promise<ArrayBuffer>
}

export type KrxEtfDailyMarketDataFetch = (
  url: string,
  init: { headers: { AUTH_KEY: string }; redirect: 'error' }
) => Promise<KrxEtfDailyMarketDataFetchResponse>

export interface KrxEtfDailyMarketDataCaptureRequest {
  apiKey: string
  basDd: string
  fetch: KrxEtfDailyMarketDataFetch
}

export interface KrxEtfDailyMarketDataCapture {
  basDd: string
  sourceUri: typeof KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI
  sourceBytes: Uint8Array
  sourceSha256: string
  fetchedAt: string
  rows: KrxEtfDailyMarketDataRow[]
}

function assertCompactDate(value: string): void {
  if (!COMPACT_DATE_PATTERN.test(value)) {
    throw new Error(`KRX basDd must use YYYYMMDD: ${value}`)
  }
  const isoDate = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== isoDate
  ) {
    throw new Error(`KRX basDd must be a calendar date: ${value}`)
  }
}

function requiredString(
  row: Record<string, unknown>,
  field: keyof KrxEtfDailyMarketDataRow
): string {
  const value = row[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`KRX ETF row has an invalid ${field}`)
  }
  return value
}

function validateRow(
  value: unknown,
  requestedBasDd: string
): KrxEtfDailyMarketDataRow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('KRX ETF OutBlock_1 contains a malformed row')
  }

  const row = value as Record<string, unknown>
  const validatedRow: KrxEtfDailyMarketDataRow = {
    BAS_DD: requiredString(row, 'BAS_DD'),
    ISU_CD: requiredString(row, 'ISU_CD'),
    ISU_NM: requiredString(row, 'ISU_NM'),
    TDD_CLSPRC: requiredString(row, 'TDD_CLSPRC'),
    NAV: requiredString(row, 'NAV'),
    ACC_TRDVOL: requiredString(row, 'ACC_TRDVOL'),
    ACC_TRDVAL: requiredString(row, 'ACC_TRDVAL'),
  }

  assertCompactDate(validatedRow.BAS_DD)
  if (validatedRow.BAS_DD !== requestedBasDd) {
    throw new Error('KRX ETF row date does not match requested basDd')
  }
  if (!KRX_ETF_ISU_CD_PATTERN.test(validatedRow.ISU_CD)) {
    throw new Error(`KRX ETF row has an invalid ISU_CD: ${validatedRow.ISU_CD}`)
  }
  for (const field of ['TDD_CLSPRC', 'NAV'] as const) {
    if (!NUMERIC_QUOTE_PATTERN.test(validatedRow[field])) {
      throw new Error(`KRX ETF row has an invalid numeric ${field}`)
    }
  }
  for (const field of ['ACC_TRDVOL', 'ACC_TRDVAL'] as const) {
    if (!NON_NEGATIVE_WHOLE_NUMBER_PATTERN.test(validatedRow[field])) {
      throw new Error(`KRX ETF row has an invalid whole-number ${field}`)
    }
  }

  return validatedRow
}

function extractRows(value: unknown, requestedBasDd: string) {
  if (!value || typeof value !== 'object' || !('OutBlock_1' in value)) {
    throw new Error('KRX ETF daily market data has no OutBlock_1')
  }
  const outBlock = value.OutBlock_1
  if (!Array.isArray(outBlock) || outBlock.length === 0) {
    throw new Error('KRX ETF daily market data OutBlock_1 is empty')
  }
  const rows = outBlock.map(row => validateRow(row, requestedBasDd))
  const dailyInstrumentKeys = new Set<string>()
  for (const row of rows) {
    const key = `${row.BAS_DD}:${row.ISU_CD}`
    if (dailyInstrumentKeys.has(key)) {
      throw new Error(
        `KRX ETF response has a duplicate daily instrument row: ${key}`
      )
    }
    dailyInstrumentKeys.add(key)
  }
  return rows
}

export async function captureKrxEtfDailyMarketData(
  input: KrxEtfDailyMarketDataCaptureRequest
): Promise<KrxEtfDailyMarketDataCapture> {
  assertCompactDate(input.basDd)
  if (!input.apiKey.trim()) {
    throw new Error('KRX API key is required')
  }

  const response = await input.fetch(
    `${KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI}?basDd=${input.basDd}`,
    { headers: { AUTH_KEY: input.apiKey }, redirect: 'error' }
  )
  if (!response.ok) {
    throw new Error('KRX ETF daily market data response was not successful')
  }

  const sourceBytes = new Uint8Array(await response.arrayBuffer())
  let rawResponse: unknown
  try {
    rawResponse = JSON.parse(new TextDecoder().decode(sourceBytes))
  } catch {
    throw new Error('KRX ETF daily market data response is not valid JSON')
  }

  return {
    basDd: input.basDd,
    sourceUri: KRX_ETF_DAILY_MARKET_DATA_SOURCE_URI,
    sourceBytes,
    sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
    fetchedAt: new Date().toISOString(),
    rows: extractRows(rawResponse, input.basDd),
  }
}
