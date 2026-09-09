import { createHash } from 'node:crypto'

import { calculateKrwReturn, type BacktestObservation } from './backtest.ts'

export interface Dg3EvidenceProvenance {
  sourceUri: string
  sourceSha256: string
  sourceEffectiveAsOf: string
  sourcePublishedAt: string
  fetchedAt: string
  observationDates: string[]
}

export interface Dg3RawObservation extends BacktestObservation {
  provenance: Dg3EvidenceProvenance
  rawBytes: Uint8Array
}

export interface Dg3NormalizedObservation extends BacktestObservation {
  provenance: Dg3EvidenceProvenance
  rawBytes: Uint8Array
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const RFC3339_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

function isRfc3339Timestamp(value: string): boolean {
  if (!RFC3339_PATTERN.test(value)) return false
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return false
  const canonical = new Date(parsed).toISOString()
  return value.includes('.')
    ? canonical === value
    : canonical.replace('.000Z', 'Z') === value
}

function ensureFinite(values: number[], ticker: string): void {
  if (values.some(value => !Number.isFinite(value) || value < -1)) {
    throw new Error(`DG3 numeric evidence must be finite: ${ticker}`)
  }
}

function validateRawObservation(row: Dg3RawObservation): void {
  if (
    typeof row !== 'object' ||
    row === null ||
    typeof row.provenance !== 'object' ||
    row.provenance === null
  ) {
    throw new Error('DG3 runtime evidence shape is invalid')
  }
  const provenance = row.provenance
  if (
    typeof row.ticker !== 'string' ||
    row.ticker.length === 0 ||
    (row.market !== 'KR' && row.market !== 'US') ||
    (row.strategy !== 'momentum' && row.strategy !== 'oversold') ||
    typeof row.period !== 'string' ||
    row.period.trim().length === 0 ||
    typeof row.industry !== 'string' ||
    row.industry.trim().length === 0 ||
    typeof row.strategyVersion !== 'string' ||
    row.strategyVersion.trim().length === 0 ||
    typeof row.passesFilter !== 'boolean' ||
    !(row.rawBytes instanceof Uint8Array) ||
    !Array.isArray(provenance.observationDates) ||
    typeof provenance.sourceUri !== 'string' ||
    typeof provenance.sourceSha256 !== 'string' ||
    typeof provenance.sourceEffectiveAsOf !== 'string' ||
    typeof provenance.sourcePublishedAt !== 'string' ||
    typeof provenance.fetchedAt !== 'string'
  ) {
    throw new Error(`DG3 runtime evidence shape is invalid: ${row.ticker}`)
  }
  if (!provenance.sourceUri.trim()) {
    throw new Error(`DG3 source URI is required: ${row.ticker}`)
  }
  if (!SHA256_PATTERN.test(provenance.sourceSha256)) {
    throw new Error(`DG3 source SHA-256 is invalid: ${row.ticker}`)
  }
  const actualSha256 = createHash('sha256').update(row.rawBytes).digest('hex')
  if (actualSha256 !== provenance.sourceSha256) {
    throw new Error(
      `DG3 source SHA-256 does not match raw bytes: ${row.ticker}`
    )
  }
  if (!isIsoDate(row.signalAsOf) || !isIsoDate(row.evaluationEnd)) {
    throw new Error(
      `DG3 signal and evaluation dates must be ISO dates: ${row.ticker}`
    )
  }
  if (row.evaluationEnd <= row.signalAsOf) {
    throw new Error(`DG3 evaluation must follow signal date: ${row.ticker}`)
  }
  if (
    !isIsoDate(provenance.sourceEffectiveAsOf) ||
    provenance.sourceEffectiveAsOf > row.signalAsOf
  ) {
    throw new Error(
      `DG3 source evidence contains future information: ${row.ticker}`
    )
  }
  if (
    !isRfc3339Timestamp(provenance.sourcePublishedAt) ||
    Date.parse(provenance.sourcePublishedAt) >
      Date.parse(`${row.signalAsOf}T23:59:59.999Z`)
  ) {
    throw new Error(
      `DG3 publication timestamp contains future information: ${row.ticker}`
    )
  }
  if (!isRfc3339Timestamp(provenance.fetchedAt)) {
    throw new Error(
      `DG3 fetchedAt must be a canonical non-future timestamp: ${row.ticker}`
    )
  }
  if (
    Date.parse(provenance.sourcePublishedAt) > Date.parse(provenance.fetchedAt)
  ) {
    throw new Error(`DG3 fetch timestamp precedes publication: ${row.ticker}`)
  }
  if (Date.parse(provenance.fetchedAt) > Date.now()) {
    throw new Error(
      `DG3 fetchedAt must be a canonical non-future timestamp: ${row.ticker}`
    )
  }
  if (
    provenance.observationDates.length === 0 ||
    provenance.observationDates.some(
      date => !isIsoDate(date) || date > row.signalAsOf
    )
  ) {
    throw new Error(`DG3 observations must precede signal date: ${row.ticker}`)
  }
  ensureFinite(
    [
      row.percentile,
      row.liquidityScore,
      row.priceReturnLocal,
      row.fxReturn,
      row.dividendReturn,
      row.benchmarkReturnKrw,
    ],
    row.ticker
  )
  const krwReturn = calculateKrwReturn(row)
  if (Object.values(krwReturn).some(value => !Number.isFinite(value))) {
    throw new Error(`DG3 derived KRW return must be finite: ${row.ticker}`)
  }
}

export function normalizeDg3Observations(
  rows: Dg3RawObservation[]
): Dg3NormalizedObservation[] {
  if (rows.length === 0) {
    throw new Error('At least one DG3 evidence row is required')
  }
  rows.forEach(validateRawObservation)
  return rows.map(row => ({
    ticker: row.ticker,
    market: row.market,
    industry: row.industry,
    period: row.period,
    strategy: row.strategy,
    strategyVersion: row.strategyVersion,
    signalAsOf: row.signalAsOf,
    evaluationEnd: row.evaluationEnd,
    percentile: row.percentile,
    passesFilter: row.passesFilter,
    liquidityScore: row.liquidityScore,
    priceReturnLocal: row.priceReturnLocal,
    fxReturn: row.fxReturn,
    dividendReturn: row.dividendReturn,
    benchmarkReturnKrw: row.benchmarkReturnKrw,
    provenance: {
      sourceUri: row.provenance.sourceUri,
      sourceSha256: row.provenance.sourceSha256,
      sourceEffectiveAsOf: row.provenance.sourceEffectiveAsOf,
      sourcePublishedAt: row.provenance.sourcePublishedAt,
      fetchedAt: row.provenance.fetchedAt,
      observationDates: [...row.provenance.observationDates],
    },
    rawBytes: row.rawBytes.slice(),
  }))
}
