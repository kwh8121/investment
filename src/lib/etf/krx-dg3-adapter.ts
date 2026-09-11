import { createHash } from 'node:crypto'

import {
  normalizeDg3Observations,
  type Dg3NormalizedObservation,
  type Dg3RawObservation,
} from './dg3-evidence.ts'
import type { StrategyName } from './strategy.ts'

export interface KrxDailyEtfRow {
  BAS_DD: string
  ISU_CD: string
  ISU_NM: string
  TDD_CLSPRC: string
  NAV: string
  ACC_TRDVOL: string
}

export interface KrxDividendEvidence {
  sourceUri: string
  sourceSha256: string
  rawBytes: Uint8Array
}

export interface KrxDg3WindowInput {
  ticker: string
  industry: string
  period: string
  strategy: StrategyName
  strategyVersion: string
  signalAsOf: string
  evaluationEnd: string
  percentile: number
  passesFilter: boolean
  liquidityScore: number
  start: KrxDailyEtfRow
  end: KrxDailyEtfRow
  benchmarkTicker: string
  benchmarkStartDate: string
  benchmarkStartClose: string
  benchmarkEndDate: string
  benchmarkEndClose: string
  dividendReturn: number
  dividendEvidence: KrxDividendEvidence
  sourceUri: string
  sourcePublishedAt: string
  fetchedAt: string
  rawBytes: Uint8Array
}

interface CanonicalKrxEvidence {
  version: 'krx-dg3-v1'
  ticker: string
  industry: string
  period: string
  strategy: StrategyName
  strategyVersion: string
  signalAsOf: string
  evaluationEnd: string
  percentile: number
  passesFilter: boolean
  liquidityScore: number
  start: KrxDailyEtfRow
  end: KrxDailyEtfRow
  benchmarkTicker: string
  benchmarkStartDate: string
  benchmarkStartClose: string
  benchmarkEndDate: string
  benchmarkEndClose: string
  dividendReturn: number
  dividendEvidenceSha256: string
  dividendEvidenceUri: string
  sourceUri: string
  sourcePublishedAt: string
  fetchedAt: string
}

function canonicalEvidence(input: KrxDg3WindowInput): CanonicalKrxEvidence {
  return {
    version: 'krx-dg3-v1',
    ticker: input.ticker,
    industry: input.industry,
    period: input.period,
    strategy: input.strategy,
    strategyVersion: input.strategyVersion,
    signalAsOf: input.signalAsOf,
    evaluationEnd: input.evaluationEnd,
    percentile: input.percentile,
    passesFilter: input.passesFilter,
    liquidityScore: input.liquidityScore,
    start: input.start,
    end: input.end,
    benchmarkTicker: input.benchmarkTicker,
    benchmarkStartDate: input.benchmarkStartDate,
    benchmarkStartClose: input.benchmarkStartClose,
    benchmarkEndDate: input.benchmarkEndDate,
    benchmarkEndClose: input.benchmarkEndClose,
    dividendReturn: input.dividendReturn,
    dividendEvidenceSha256: input.dividendEvidence.sourceSha256,
    dividendEvidenceUri: input.dividendEvidence.sourceUri,
    sourceUri: input.sourceUri,
    sourcePublishedAt: input.sourcePublishedAt,
    fetchedAt: input.fetchedAt,
  }
}

export function encodeKrxDg3Evidence(input: KrxDg3WindowInput): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(canonicalEvidence(input)))
}

function parseFinite(value: string, field: string): number {
  const parsed = Number(value.replaceAll(',', '').trim())
  if (!Number.isFinite(parsed)) {
    throw new Error(`KRX ${field} must be finite`)
  }
  return parsed
}

function toIsoDate(value: string): string {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(`KRX date must use YYYYMMDD: ${value}`)
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

function returnFrom(start: number, end: number, field: string): number {
  if (start <= 0 || end <= 0) {
    throw new Error(`KRX ${field} prices must be positive`)
  }
  return end / start - 1
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function rawObservation(input: KrxDg3WindowInput): Dg3RawObservation {
  if (!sameBytes(input.rawBytes, encodeKrxDg3Evidence(input))) {
    throw new Error(
      `KRX raw bytes do not bind DG3 calculation inputs: ${input.ticker}`
    )
  }
  const dividendHash = createHash('sha256')
    .update(input.dividendEvidence.rawBytes)
    .digest('hex')
  if (dividendHash !== input.dividendEvidence.sourceSha256) {
    throw new Error(
      `Dividend evidence hash does not match raw bytes: ${input.ticker}`
    )
  }
  if (!/^https:\/\/(?:data-dbg|openapi)\.krx\.co\.kr\//.test(input.sourceUri)) {
    throw new Error(`KRX source URI is not approved: ${input.ticker}`)
  }
  if (input.benchmarkTicker !== 'KOSPI200') {
    throw new Error(`KRX benchmark identity is invalid: ${input.ticker}`)
  }
  if (
    input.start.ISU_CD !== input.ticker ||
    input.end.ISU_CD !== input.ticker
  ) {
    throw new Error(`KRX ETF rows do not match ticker: ${input.ticker}`)
  }
  const startAsOf = toIsoDate(input.start.BAS_DD)
  const endAsOf = toIsoDate(input.end.BAS_DD)
  if (
    startAsOf !== input.signalAsOf ||
    endAsOf !== input.evaluationEnd ||
    input.benchmarkStartDate !== input.signalAsOf ||
    input.benchmarkEndDate !== input.evaluationEnd
  ) {
    throw new Error(`KRX rows do not match the DG3 window: ${input.ticker}`)
  }
  const startClose = parseFinite(input.start.TDD_CLSPRC, 'ETF start close')
  const endClose = parseFinite(input.end.TDD_CLSPRC, 'ETF end close')
  const benchmarkStart = parseFinite(
    input.benchmarkStartClose,
    'benchmark start close'
  )
  const benchmarkEnd = parseFinite(
    input.benchmarkEndClose,
    'benchmark end close'
  )
  return {
    ticker: input.ticker,
    market: 'KR',
    industry: input.industry,
    period: input.period,
    strategy: input.strategy,
    strategyVersion: input.strategyVersion,
    signalAsOf: input.signalAsOf,
    evaluationEnd: input.evaluationEnd,
    percentile: input.percentile,
    passesFilter: input.passesFilter,
    liquidityScore: input.liquidityScore,
    priceReturnLocal: returnFrom(startClose, endClose, 'ETF'),
    fxReturn: 0,
    dividendReturn: input.dividendReturn,
    benchmarkReturnKrw: returnFrom(benchmarkStart, benchmarkEnd, 'benchmark'),
    provenance: {
      sourceUri: input.sourceUri,
      sourceSha256: createHash('sha256').update(input.rawBytes).digest('hex'),
      sourceEffectiveAsOf: startAsOf,
      sourcePublishedAt: input.sourcePublishedAt,
      fetchedAt: input.fetchedAt,
      observationDates: [startAsOf],
      outcomeDates: [endAsOf],
      dividendEvidence: {
        sourceUri: input.dividendEvidence.sourceUri,
        sourceSha256: input.dividendEvidence.sourceSha256,
        rawBytes: input.dividendEvidence.rawBytes,
      },
    },
    rawBytes: input.rawBytes,
  }
}

export function normalizeKrxDg3Window(
  input: KrxDg3WindowInput
): Dg3NormalizedObservation {
  return normalizeDg3Observations([rawObservation(input)])[0]!
}
