import { createHash } from 'node:crypto'

import {
  normalizeDg2StrategyEvidence,
  normalizeDg2StrategyEvidenceBatch,
  type Dg2PersistableStrategyEvidence,
  type Dg2RawStrategyEvidence,
  type Dg2StrategyEvidenceBatchResult,
  type Dg2StrategyInputEvidence,
  type Dg2StrategyInputField,
} from './dg2-evidence.ts'
import type { KrxDailyEtfRow } from './krx-dg3-adapter.ts'
import type { StrategyName } from './strategy.ts'

export interface KrxDg2CapturedSource {
  sourceUri: string
  sourceBytes: Uint8Array
  publishedAt: string
  fetchedAt: string
  transformVersion: string
  reviewer: string
}

export interface KrxDg2DerivedInput {
  field: Dg2StrategyInputField
  value: string | number | boolean
  sourceField: string
  formula: string
  effectiveAsOf: string
  observationStart?: string
  observationEnd?: string
}

export interface KrxDg2WindowInput {
  ticker: string
  asOf: string
  strategy: StrategyName
  strategyVersion: string
  row: KrxDailyEtfRow
  krxDerivedInputs: KrxDg2DerivedInput[]
  capturedSource: KrxDg2CapturedSource
  otherInputs: Dg2StrategyInputEvidence[]
}

function toIsoDate(value: string): string {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(`KRX date must use YYYYMMDD: ${value}`)
  }
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

function krxDerivedEntries(
  input: KrxDg2WindowInput
): Dg2StrategyInputEvidence[] {
  const sourceSha256 = createHash('sha256')
    .update(input.capturedSource.sourceBytes)
    .digest('hex')
  return input.krxDerivedInputs.map(derived => ({
    field: derived.field,
    value: derived.value,
    source: {
      sourceUri: input.capturedSource.sourceUri,
      sourceField: derived.sourceField,
      formula: derived.formula,
      publishedAt: input.capturedSource.publishedAt,
      effectiveAsOf: derived.effectiveAsOf,
      ...(derived.observationStart === undefined
        ? {}
        : { observationStart: derived.observationStart }),
      ...(derived.observationEnd === undefined
        ? {}
        : { observationEnd: derived.observationEnd }),
      fetchedAt: input.capturedSource.fetchedAt,
      transformVersion: input.capturedSource.transformVersion,
      reviewer: input.capturedSource.reviewer,
      sourceSha256,
      sourceBytes: input.capturedSource.sourceBytes,
    },
  }))
}

function rawEvidence(input: KrxDg2WindowInput): Dg2RawStrategyEvidence {
  if (
    !/^https:\/\/(?:data-dbg|openapi)\.krx\.co\.kr\//.test(
      input.capturedSource.sourceUri
    )
  ) {
    throw new Error(`KRX source URI is not approved: ${input.ticker}`)
  }
  if (input.row.ISU_CD !== input.ticker) {
    throw new Error(`KRX ETF row does not match ticker: ${input.ticker}`)
  }
  const rowAsOf = toIsoDate(input.row.BAS_DD)
  if (rowAsOf !== input.asOf) {
    throw new Error(
      `KRX row date does not match the DG2 signal date: ${input.ticker}`
    )
  }
  return {
    ticker: input.ticker,
    asOf: input.asOf,
    strategy: input.strategy,
    strategyVersion: input.strategyVersion,
    inputs: [...krxDerivedEntries(input), ...input.otherInputs],
  }
}

export function normalizeKrxDg2Window(
  input: KrxDg2WindowInput
): Dg2PersistableStrategyEvidence {
  return normalizeDg2StrategyEvidence([rawEvidence(input)])[0]!
}

export function normalizeKrxDg2WindowBatch(
  inputs: KrxDg2WindowInput[]
): Dg2StrategyEvidenceBatchResult {
  return normalizeDg2StrategyEvidenceBatch(inputs.map(rawEvidence))
}
