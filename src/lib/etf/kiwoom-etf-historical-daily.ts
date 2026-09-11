const COMPACT_DATE_PATTERN = /^\d{8}$/
const KOREAN_TICKER_PATTERN = /^\d{6}$/
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/
const SIGNED_INTEGER_PATTERN = /^[+-]?\d+$/
const SIGNED_DECIMAL_PATTERN = /^[+-]?\d+(?:\.\d+)?$/

export const KIWOOM_ETF_HISTORICAL_DAILY_SOURCE_COMMAND =
  'kiwoomcli domestic etfs'

export interface KiwoomEtfListEntry {
  ticker: string
  productName: string
}

export interface KiwoomEtfListNormalization {
  numericEntries: KiwoomEtfListEntry[]
  unsupportedIdentifiers: string[]
}

export interface KiwoomEtfHistoricalDailyRow {
  ticker: string
  productName: string
  date: string
  closePrice: number
  tradeQuantity: number
  nav: number
  tradeValue: number
}

export class KiwoomRequestedDateMissingError extends Error {
  constructor(ticker: string, requestedDate: string) {
    super(
      `Kiwoom ETF daily response has no row for ${ticker} on ${requestedDate}`
    )
    this.name = 'KiwoomRequestedDateMissingError'
  }
}

function parseJson(rawResponse: string, responseName: string): unknown {
  try {
    return JSON.parse(rawResponse)
  } catch {
    throw new Error(`Kiwoom ${responseName} response is not valid JSON`)
  }
}

function requiredRows(
  response: unknown,
  field: 'etfall_mrpr' | 'etfdaly_trnsn'
): unknown[] {
  if (!response || typeof response !== 'object' || !(field in response)) {
    throw new Error(`Kiwoom response has no ${field}`)
  }
  const rows = (response as Record<string, unknown>)[field]
  if (!Array.isArray(rows)) {
    throw new Error(`Kiwoom response ${field} is not an array`)
  }
  return rows
}

function requiredRecord(
  value: unknown,
  rowName: string
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Kiwoom ${rowName} contains a malformed row`)
  }
  return value as Record<string, unknown>
}

function requiredString(
  row: Record<string, unknown>,
  field: string,
  rowName: string
): string {
  const value = row[field]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Kiwoom ${rowName} has an invalid ${field}`)
  }
  return value
}

function parseNonNegativeInteger(value: string, field: string): number {
  if (!NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    throw new Error(`Kiwoom daily row has an invalid integer ${field}`)
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Kiwoom daily row has an invalid integer ${field}`)
  }
  return parsed
}

// Kiwoom signs encode quote direction; historical price and NAV values are magnitudes.
function parseSignedQuoteIntegerMagnitude(
  value: string,
  field: string
): number {
  if (!SIGNED_INTEGER_PATTERN.test(value)) {
    throw new Error(`Kiwoom daily row has an invalid numeric ${field}`)
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Kiwoom daily row has an invalid numeric ${field}`)
  }
  return Math.abs(parsed)
}

function parseSignedQuoteDecimalMagnitude(
  value: string,
  field: string
): number {
  if (!SIGNED_DECIMAL_PATTERN.test(value)) {
    throw new Error(`Kiwoom daily row has an invalid numeric ${field}`)
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Kiwoom daily row has an invalid numeric ${field}`)
  }
  return Math.abs(parsed)
}

export function normalizeKiwoomRequestedDate(requestedDate: string): string {
  if (!COMPACT_DATE_PATTERN.test(requestedDate)) {
    throw new Error(`Kiwoom requested date must use YYYYMMDD: ${requestedDate}`)
  }
  const isoDate = `${requestedDate.slice(0, 4)}-${requestedDate.slice(4, 6)}-${requestedDate.slice(6, 8)}`
  const parsed = new Date(`${isoDate}T00:00:00Z`)
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== isoDate
  ) {
    throw new Error(
      `Kiwoom requested date must be a calendar date: ${requestedDate}`
    )
  }
  return isoDate
}

export function normalizeKiwoomEtfListResponse(
  rawResponse: string
): KiwoomEtfListNormalization {
  const rows = requiredRows(parseJson(rawResponse, 'ETF list'), 'etfall_mrpr')
  if (rows.length === 0) throw new Error('Kiwoom ETF list response is empty')

  const tickers = new Set<string>()
  const numericEntries: KiwoomEtfListEntry[] = []
  const unsupportedIdentifiers: string[] = []
  for (const value of rows) {
    const row = requiredRecord(value, 'ETF list')
    const ticker = requiredString(row, 'stk_cd', 'ETF list')
    const productName = requiredString(row, 'stk_nm', 'ETF list')
    if (tickers.has(ticker)) {
      throw new Error(`Kiwoom ETF list has a duplicate ticker: ${ticker}`)
    }
    tickers.add(ticker)
    if (KOREAN_TICKER_PATTERN.test(ticker)) {
      numericEntries.push({ ticker, productName })
    } else {
      unsupportedIdentifiers.push(ticker)
    }
  }
  if (numericEntries.length === 0) {
    throw new Error('Kiwoom ETF list has no numeric six-digit ticker')
  }
  return { numericEntries, unsupportedIdentifiers }
}

export function normalizeKiwoomEtfDailyResponse(input: {
  rawResponse: string
  requestedDate: string
  ticker: string
  productName: string
}): KiwoomEtfHistoricalDailyRow {
  const date = normalizeKiwoomRequestedDate(input.requestedDate)
  if (!KOREAN_TICKER_PATTERN.test(input.ticker)) {
    throw new Error(
      `Kiwoom daily request has an invalid ticker: ${input.ticker}`
    )
  }
  if (!input.productName.trim()) {
    throw new Error('Kiwoom daily request has an empty product name')
  }

  const matchingRows = requiredRows(
    parseJson(input.rawResponse, 'ETF daily'),
    'etfdaly_trnsn'
  ).filter(value => {
    const row = requiredRecord(value, 'ETF daily')
    return row.cntr_dt === input.requestedDate
  })
  if (matchingRows.length === 0) {
    throw new KiwoomRequestedDateMissingError(input.ticker, input.requestedDate)
  }
  if (matchingRows.length > 1) {
    throw new Error(
      `Kiwoom ETF daily response has duplicate rows for ${input.ticker} on ${input.requestedDate}`
    )
  }

  const row = requiredRecord(matchingRows[0], 'ETF daily')
  const rowDate = requiredString(row, 'cntr_dt', 'ETF daily')
  if (rowDate !== input.requestedDate) {
    throw new Error(`Kiwoom ETF daily row date does not match: ${input.ticker}`)
  }
  return {
    ticker: input.ticker,
    productName: input.productName,
    date,
    closePrice: parseSignedQuoteIntegerMagnitude(
      requiredString(row, 'cur_prc', 'ETF daily'),
      'cur_prc'
    ),
    tradeQuantity: parseNonNegativeInteger(
      requiredString(row, 'trde_qty', 'ETF daily'),
      'trde_qty'
    ),
    nav: parseSignedQuoteDecimalMagnitude(
      requiredString(row, 'nav', 'ETF daily'),
      'nav'
    ),
    tradeValue: parseNonNegativeInteger(
      requiredString(row, 'acc_trde_prica', 'ETF daily'),
      'acc_trde_prica'
    ),
  }
}
