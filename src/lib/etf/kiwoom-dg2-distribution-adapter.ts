import { createHash } from 'node:crypto'

const KOREAN_TICKER_PATTERN = /^\d{6}$/
const DOTTED_DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/
const COMPACT_DATE_PATTERN = /^\d{8}$/
const DECIMAL_PATTERN = /^\d+(?:\.\d+)?$/
const RFC3339_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

export interface KiwoomDistributionRow {
  gcode: string
  goodsNm: string
  stdDt: string
  payDt: string
  payRockDt: string
  cashPayDt: string
  dividendAmt: string
  taxableAmt: string
  dividendRate: string
  type: string
}

export interface KiwoomDg2CapturedDistributionSource {
  sourceUri: string
  sourceBytes: Uint8Array
  fetchedAt: string
}

export interface KiwoomDg2DistributionInput {
  ticker: string
  productName: string
  row: KiwoomDistributionRow
  capturedSource: KiwoomDg2CapturedDistributionSource
}

export interface KiwoomDg2DistributionCandidate {
  ticker: string
  productName: string
  sourceUri: string
  sourceSha256: string
  fetchedAt: string
  recordDate: string
  exDistributionDate: string
  paymentDate: string
  distributionAmount: number
  currency: 'KRW'
  distributionRatePercent: number
  dividendVerified: false
  verificationStatus: 'pending_source_date_review'
}

function toIsoDate(value: string, pattern: RegExp, separator: string): string {
  if (!pattern.test(value)) throw new Error(`Invalid Kiwoom date: ${value}`)
  const normalized = separator === '' ? value : value.replaceAll(separator, '-')
  const isoDate =
    separator === ''
      ? `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`
      : normalized
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== isoDate
  ) {
    throw new Error(`Invalid Kiwoom date: ${value}`)
  }
  return isoDate
}

function parseNonNegativeDecimal(value: string, field: string): number {
  if (!DECIMAL_PATTERN.test(value)) {
    throw new Error(`Invalid Kiwoom ${field}: ${value}`)
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid Kiwoom ${field}: ${value}`)
  }
  return parsed
}

function hasMatchingRawRow(
  value: unknown,
  expected: KiwoomDistributionRow
): boolean {
  if (!value || typeof value !== 'object' || !('resultList' in value))
    return false
  const resultList = value.resultList
  if (!Array.isArray(resultList)) return false
  return resultList.some(item => {
    if (!item || typeof item !== 'object') return false
    return (
      item.gcode === expected.gcode &&
      item.stdDt === expected.stdDt &&
      item.payDt === expected.payDt &&
      item.payRockDt === expected.payRockDt &&
      item.cashPayDt === expected.cashPayDt &&
      item.dividendAmt === expected.dividendAmt &&
      item.dividendRate === expected.dividendRate
    )
  })
}

function validateCapturedSource(
  source: KiwoomDg2CapturedDistributionSource
): void {
  const parsedUri = new URL(source.sourceUri)
  if (
    parsedUri.protocol !== 'https:' ||
    parsedUri.hostname !== 'www.kiwoometf.com' ||
    parsedUri.pathname !== '/service/report/KO03020200PSelectAjax' ||
    parsedUri.search ||
    parsedUri.hash
  ) {
    throw new Error('Kiwoom distribution source URI is not approved')
  }
  if (!RFC3339_PATTERN.test(source.fetchedAt)) {
    throw new Error(`Invalid Kiwoom fetch timestamp: ${source.fetchedAt}`)
  }
  const parsedTimestamp = Date.parse(source.fetchedAt)
  if (!Number.isFinite(parsedTimestamp)) {
    throw new Error(`Invalid Kiwoom fetch timestamp: ${source.fetchedAt}`)
  }
}

export function normalizeKiwoomDg2Distribution(
  input: KiwoomDg2DistributionInput
): KiwoomDg2DistributionCandidate {
  if (!KOREAN_TICKER_PATTERN.test(input.ticker)) {
    throw new Error(`Invalid Korean ETF ticker: ${input.ticker}`)
  }
  if (input.row.gcode !== input.ticker) {
    throw new Error(
      `Kiwoom distribution row does not match ticker: ${input.ticker}`
    )
  }
  if (!input.productName.trim())
    throw new Error('Kiwoom product name is required')

  validateCapturedSource(input.capturedSource)
  let rawResponse: unknown
  try {
    rawResponse = JSON.parse(
      new TextDecoder().decode(input.capturedSource.sourceBytes)
    )
  } catch {
    throw new Error('Kiwoom distribution source is not valid JSON')
  }
  if (!hasMatchingRawRow(rawResponse, input.row)) {
    throw new Error(
      `Kiwoom source does not contain the declared row: ${input.ticker}`
    )
  }

  const recordDate = toIsoDate(input.row.stdDt, DOTTED_DATE_PATTERN, '.')
  const exDistributionDate = toIsoDate(
    input.row.payRockDt,
    COMPACT_DATE_PATTERN,
    ''
  )
  const paymentDate = toIsoDate(input.row.payDt, DOTTED_DATE_PATTERN, '.')
  const cashPaymentDate = toIsoDate(
    input.row.cashPayDt,
    COMPACT_DATE_PATTERN,
    ''
  )
  if (paymentDate !== cashPaymentDate) {
    throw new Error(`Kiwoom payment dates do not match: ${input.ticker}`)
  }

  return {
    ticker: input.ticker,
    productName: input.productName,
    sourceUri: input.capturedSource.sourceUri,
    sourceSha256: createHash('sha256')
      .update(input.capturedSource.sourceBytes)
      .digest('hex'),
    fetchedAt: input.capturedSource.fetchedAt,
    recordDate,
    exDistributionDate,
    paymentDate,
    distributionAmount: parseNonNegativeDecimal(
      input.row.dividendAmt,
      'distribution amount'
    ),
    currency: 'KRW',
    distributionRatePercent: parseNonNegativeDecimal(
      input.row.dividendRate,
      'distribution rate'
    ),
    dividendVerified: false,
    verificationStatus: 'pending_source_date_review',
  }
}
