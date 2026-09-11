import { createHash } from 'node:crypto'

import type { StrategyInput, StrategyName } from './strategy.ts'

export const DG2_COMMON_FIELDS = [
  'ticker',
  'asOf',
  'valuationCurrency',
  'universeFilterVersion',
  'qualityStatus',
  'dataConfidence',
  'isEtf',
  'isLeveragedOrInverse',
  'liquidityScore',
  'portfolioRiskPassed',
  'fundamentalTriggerPassed',
  'thesisEvidence',
  'volumeLiquidity',
] as const

export const DG2_MOMENTUM_ONLY_FIELDS = [
  'relativeStrength1M',
  'relativeStrength3M',
  'relativeStrength6M',
  'momentumAcceleration',
  'industryFundamental',
  'overheatRisk',
] as const

export const DG2_OVERSOLD_ONLY_FIELDS = [
  'drawdownDepth',
  'drawdownDuration',
  'reversalSignal',
  'fundamentalRecovery',
  'structuralDamage',
] as const

export type Dg2CommonField = (typeof DG2_COMMON_FIELDS)[number]
export type Dg2MomentumOnlyField = (typeof DG2_MOMENTUM_ONLY_FIELDS)[number]
export type Dg2OversoldOnlyField = (typeof DG2_OVERSOLD_ONLY_FIELDS)[number]
export type Dg2StrategyInputField =
  | Dg2CommonField
  | Dg2MomentumOnlyField
  | Dg2OversoldOnlyField

export const DG2_APPROVED_TICKERS = [
  '069500',
  '102110',
  '229200',
  '360750',
  '133690',
] as const

export const DG2_PINNED_AS_OF = '2026-08-03'
export const DG2_PINNED_STRATEGY_VERSION = 'strategy-v0.2'

const DG2_ALL_FIELDS: readonly Dg2StrategyInputField[] = [
  ...DG2_COMMON_FIELDS,
  ...DG2_MOMENTUM_ONLY_FIELDS,
  ...DG2_OVERSOLD_ONLY_FIELDS,
]
const DG2_ALL_FIELDS_SET: ReadonlySet<string> = new Set(DG2_ALL_FIELDS)
const DG2_COMMON_FIELDS_SET: ReadonlySet<string> = new Set(DG2_COMMON_FIELDS)

const BOOLEAN_FIELDS: ReadonlySet<string> = new Set([
  'isEtf',
  'isLeveragedOrInverse',
  'portfolioRiskPassed',
  'fundamentalTriggerPassed',
])
const IDENTITY_STRING_FIELDS: ReadonlySet<string> = new Set([
  'universeFilterVersion',
  'thesisEvidence',
])
const LOOKBACK_WINDOWED_FIELDS: ReadonlySet<string> = new Set([
  'relativeStrength1M',
  'relativeStrength3M',
  'relativeStrength6M',
  'drawdownDepth',
  'drawdownDuration',
])

function requiredFieldsFor(
  strategy: StrategyName
): readonly Dg2StrategyInputField[] {
  return strategy === 'momentum'
    ? [...DG2_COMMON_FIELDS, ...DG2_MOMENTUM_ONLY_FIELDS]
    : [...DG2_COMMON_FIELDS, ...DG2_OVERSOLD_ONLY_FIELDS]
}

function allowedFieldsFor(strategy: StrategyName): ReadonlySet<string> {
  return new Set(requiredFieldsFor(strategy))
}

export interface Dg2SourceRecord {
  sourceUri: string
  sourceField: string
  formula: string
  publishedAt: string
  effectiveAsOf: string
  observationStart?: string
  observationEnd?: string
  fetchedAt: string
  transformVersion: string
  reviewer: string
  sourceSha256: string
  sourceBytes: Uint8Array
}

export interface Dg2PersistableSourceRecord {
  sourceUri: string
  sourceField: string
  formula: string
  publishedAt: string
  effectiveAsOf: string
  observationStart?: string
  observationEnd?: string
  fetchedAt: string
  transformVersion: string
  reviewer: string
  sourceSha256: string
}

export interface Dg2StrategyInputEvidence {
  field: Dg2StrategyInputField
  value: string | number | boolean
  source: Dg2SourceRecord
}

export interface Dg2PersistableStrategyInputEvidence {
  field: Dg2StrategyInputField
  value: string | number | boolean
  source: Dg2PersistableSourceRecord
}

export interface Dg2RawStrategyEvidence {
  ticker: string
  asOf: string
  strategy: StrategyName
  strategyVersion: string
  inputs: Dg2StrategyInputEvidence[]
}

export interface Dg2PersistableStrategyEvidence {
  ticker: string
  asOf: string
  strategy: StrategyName
  strategyVersion: string
  inputs: readonly Dg2PersistableStrategyInputEvidence[]
}

export interface Dg2StrategyEvidenceBatchResult {
  artifacts: Dg2PersistableStrategyEvidence[]
  mergedInputs: StrategyInput[]
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

function validateSourceUri(sourceUri: string, ticker: string): void {
  let parsed: URL
  try {
    parsed = new URL(sourceUri)
  } catch {
    throw new Error(`DG2 source URI must be an absolute URL: ${ticker}`)
  }
  if (parsed.username || parsed.password) {
    throw new Error(
      `DG2 source URI must not contain embedded credentials: ${ticker}`
    )
  }
  if (parsed.search) {
    throw new Error(`DG2 source URI must not contain a query string: ${ticker}`)
  }
  if (parsed.hash) {
    throw new Error(`DG2 source URI must not contain a fragment: ${ticker}`)
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`DG2 source URI must use https: ${ticker}`)
  }
}

function validateSourceRecord(
  source: Dg2SourceRecord,
  ticker: string,
  asOf: string,
  fieldLabel: string
): void {
  if (
    typeof source !== 'object' ||
    source === null ||
    typeof source.sourceUri !== 'string' ||
    typeof source.sourceField !== 'string' ||
    typeof source.formula !== 'string' ||
    typeof source.publishedAt !== 'string' ||
    typeof source.effectiveAsOf !== 'string' ||
    typeof source.fetchedAt !== 'string' ||
    typeof source.transformVersion !== 'string' ||
    typeof source.reviewer !== 'string' ||
    typeof source.sourceSha256 !== 'string' ||
    !(source.sourceBytes instanceof Uint8Array)
  ) {
    throw new Error(`DG2 runtime evidence shape is invalid: ${ticker}`)
  }
  validateSourceUri(source.sourceUri, ticker)
  if (!source.sourceField.trim()) {
    throw new Error(`DG2 source field is required for ${fieldLabel}: ${ticker}`)
  }
  if (!source.formula.trim()) {
    throw new Error(
      `DG2 calculation formula is required for ${fieldLabel}: ${ticker}`
    )
  }
  if (!SHA256_PATTERN.test(source.sourceSha256)) {
    throw new Error(
      `DG2 source SHA-256 is invalid for ${fieldLabel}: ${ticker}`
    )
  }
  const actualSha256 = createHash('sha256')
    .update(source.sourceBytes)
    .digest('hex')
  if (actualSha256 !== source.sourceSha256) {
    throw new Error(
      `DG2 source SHA-256 does not match captured source bytes for ${fieldLabel}: ${ticker}`
    )
  }
  if (!isRfc3339Timestamp(source.publishedAt)) {
    throw new Error(
      `DG2 publishedAt must be a canonical timestamp for ${fieldLabel}: ${ticker}`
    )
  }
  if (Date.parse(source.publishedAt) > Date.parse(`${asOf}T23:59:59.999Z`)) {
    throw new Error(
      `DG2 source publication must precede the signal date for ${fieldLabel}: ${ticker}`
    )
  }
  if (!isIsoDate(source.effectiveAsOf)) {
    throw new Error(
      `DG2 effectiveAsOf must be an ISO date for ${fieldLabel}: ${ticker}`
    )
  }
  if (source.effectiveAsOf > asOf) {
    throw new Error(
      `DG2 source evidence contains future information for ${fieldLabel}: ${ticker}`
    )
  }
  if (LOOKBACK_WINDOWED_FIELDS.has(fieldLabel)) {
    if (
      typeof source.observationStart !== 'string' ||
      typeof source.observationEnd !== 'string'
    ) {
      throw new Error(
        `DG2 lookback observation window is required for ${fieldLabel}: ${ticker}`
      )
    }
    if (
      !isIsoDate(source.observationStart) ||
      !isIsoDate(source.observationEnd)
    ) {
      throw new Error(
        `DG2 lookback observation window must use ISO dates for ${fieldLabel}: ${ticker}`
      )
    }
    if (source.observationStart > source.observationEnd) {
      throw new Error(
        `DG2 lookback observation window is inverted for ${fieldLabel}: ${ticker}`
      )
    }
    if (source.observationEnd > asOf) {
      throw new Error(
        `DG2 lookback observation window leaks future information for ${fieldLabel}: ${ticker}`
      )
    }
  }
  if (!isRfc3339Timestamp(source.fetchedAt)) {
    throw new Error(
      `DG2 fetchedAt must be a canonical non-future timestamp for ${fieldLabel}: ${ticker}`
    )
  }
  if (Date.parse(source.fetchedAt) > Date.now()) {
    throw new Error(
      `DG2 fetchedAt must be a canonical non-future timestamp for ${fieldLabel}: ${ticker}`
    )
  }
  if (Date.parse(source.fetchedAt) < Date.parse(source.publishedAt)) {
    throw new Error(
      `DG2 fetch timestamp precedes publication for ${fieldLabel}: ${ticker}`
    )
  }
  if (!source.transformVersion.trim()) {
    throw new Error(
      `DG2 transform version is required for ${fieldLabel}: ${ticker}`
    )
  }
  if (!source.reviewer.trim()) {
    throw new Error(`DG2 reviewer is required for ${fieldLabel}: ${ticker}`)
  }
}

function validateFieldValue(
  row: Dg2RawStrategyEvidence,
  fieldEntry: Dg2StrategyInputEvidence
): void {
  const { field, value } = fieldEntry
  if (field === 'ticker') {
    if (typeof value !== 'string' || value !== row.ticker) {
      throw new Error(
        `DG2 ticker input must match the record ticker: ${row.ticker}`
      )
    }
    return
  }
  if (field === 'asOf') {
    if (typeof value !== 'string' || value !== row.asOf || !isIsoDate(value)) {
      throw new Error(
        `DG2 asOf input must match the record signal date: ${row.ticker}`
      )
    }
    return
  }
  if (field === 'valuationCurrency') {
    if (value !== 'KRW') {
      throw new Error(`DG2 valuationCurrency input must be KRW: ${row.ticker}`)
    }
    return
  }
  if (field === 'qualityStatus') {
    if (value !== 'passed' && value !== 'warning' && value !== 'blocked') {
      throw new Error(
        `DG2 qualityStatus input must be passed, warning, or blocked: ${row.ticker}`
      )
    }
    return
  }
  if (IDENTITY_STRING_FIELDS.has(field)) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(
        `DG2 ${field} input must be a non-empty string: ${row.ticker}`
      )
    }
    return
  }
  if (BOOLEAN_FIELDS.has(field)) {
    if (typeof value !== 'boolean') {
      throw new Error(`DG2 ${field} input must be a boolean: ${row.ticker}`)
    }
    return
  }
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      `DG2 ${field} input must be finite and between 0 and 100: ${row.ticker}`
    )
  }
}

function validateRawEvidence(row: Dg2RawStrategyEvidence): void {
  if (typeof row !== 'object' || row === null || !Array.isArray(row.inputs)) {
    throw new Error('DG2 runtime evidence shape is invalid')
  }
  if (
    typeof row.ticker !== 'string' ||
    row.ticker.length === 0 ||
    typeof row.asOf !== 'string' ||
    (row.strategy !== 'momentum' && row.strategy !== 'oversold') ||
    typeof row.strategyVersion !== 'string' ||
    row.strategyVersion.trim().length === 0
  ) {
    throw new Error(`DG2 runtime evidence shape is invalid: ${row.ticker}`)
  }
  if (!isIsoDate(row.asOf)) {
    throw new Error(`DG2 signal date must be an ISO date: ${row.ticker}`)
  }
  if (row.inputs.length === 0) {
    throw new Error(
      `DG2 strategy evidence requires at least one input: ${row.ticker}`
    )
  }

  const allowedFields = allowedFieldsFor(row.strategy)
  const seenFields = new Set<string>()
  row.inputs.forEach(fieldEntry => {
    if (
      typeof fieldEntry !== 'object' ||
      fieldEntry === null ||
      typeof fieldEntry.field !== 'string'
    ) {
      throw new Error(`DG2 runtime evidence shape is invalid: ${row.ticker}`)
    }
    if (!DG2_ALL_FIELDS_SET.has(fieldEntry.field)) {
      throw new Error(
        `DG2 strategy evidence references an unknown input field: ${row.ticker}`
      )
    }
    if (!allowedFields.has(fieldEntry.field)) {
      throw new Error(
        `DG2 ${row.strategy} evidence must not include ${fieldEntry.field}, which belongs to the other strategy: ${row.ticker}`
      )
    }
    if (seenFields.has(fieldEntry.field)) {
      throw new Error(
        `DG2 strategy evidence contains a duplicate input field: ${row.ticker}`
      )
    }
    seenFields.add(fieldEntry.field)
    validateFieldValue(row, fieldEntry)
    validateSourceRecord(
      fieldEntry.source,
      row.ticker,
      row.asOf,
      fieldEntry.field
    )
  })

  const missing = requiredFieldsFor(row.strategy).filter(
    field => !seenFields.has(field)
  )
  if (missing.length > 0) {
    throw new Error(
      `DG2 strategy evidence is missing required ${row.strategy} inputs: ${row.ticker} (${missing.join(', ')})`
    )
  }
}

function toPersistableSource(
  source: Dg2SourceRecord
): Dg2PersistableSourceRecord {
  return Object.freeze({
    sourceUri: source.sourceUri,
    sourceField: source.sourceField,
    formula: source.formula,
    publishedAt: source.publishedAt,
    effectiveAsOf: source.effectiveAsOf,
    ...(source.observationStart === undefined
      ? {}
      : { observationStart: source.observationStart }),
    ...(source.observationEnd === undefined
      ? {}
      : { observationEnd: source.observationEnd }),
    fetchedAt: source.fetchedAt,
    transformVersion: source.transformVersion,
    reviewer: source.reviewer,
    sourceSha256: source.sourceSha256,
  })
}

function toPersistableInput(
  fieldEntry: Dg2StrategyInputEvidence
): Dg2PersistableStrategyInputEvidence {
  return Object.freeze({
    field: fieldEntry.field,
    value: fieldEntry.value,
    source: toPersistableSource(fieldEntry.source),
  })
}

function toPersistable(
  row: Dg2RawStrategyEvidence
): Dg2PersistableStrategyEvidence {
  return Object.freeze({
    ticker: row.ticker,
    asOf: row.asOf,
    strategy: row.strategy,
    strategyVersion: row.strategyVersion,
    inputs: Object.freeze(row.inputs.map(toPersistableInput)),
  })
}

export function normalizeDg2StrategyEvidence(
  rows: Dg2RawStrategyEvidence[]
): Dg2PersistableStrategyEvidence[] {
  if (rows.length === 0) {
    throw new Error('At least one DG2 evidence row is required')
  }
  rows.forEach(validateRawEvidence)
  return rows.map(toPersistable)
}

function getStringField(
  byField: ReadonlyMap<string, string | number | boolean>,
  field: string,
  ticker: string
): string {
  const value = byField.get(field)
  if (typeof value !== 'string') {
    throw new Error(
      `DG2 merged StrategyInput field ${field} must be a string: ${ticker}`
    )
  }
  return value
}

function getNumberField(
  byField: ReadonlyMap<string, string | number | boolean>,
  field: string,
  ticker: string
): number {
  const value = byField.get(field)
  if (typeof value !== 'number') {
    throw new Error(
      `DG2 merged StrategyInput field ${field} must be a number: ${ticker}`
    )
  }
  return value
}

function getBooleanField(
  byField: ReadonlyMap<string, string | number | boolean>,
  field: string,
  ticker: string
): boolean {
  const value = byField.get(field)
  if (typeof value !== 'boolean') {
    throw new Error(
      `DG2 merged StrategyInput field ${field} must be a boolean: ${ticker}`
    )
  }
  return value
}

function buildStrategyInput(
  ticker: string,
  byField: ReadonlyMap<string, string | number | boolean>
): StrategyInput {
  const valuationCurrency = getStringField(byField, 'valuationCurrency', ticker)
  if (valuationCurrency !== 'KRW') {
    throw new Error(
      `DG2 merged StrategyInput valuationCurrency must be KRW: ${ticker}`
    )
  }
  const qualityStatus = getStringField(byField, 'qualityStatus', ticker)
  if (
    qualityStatus !== 'passed' &&
    qualityStatus !== 'warning' &&
    qualityStatus !== 'blocked'
  ) {
    throw new Error(
      `DG2 merged StrategyInput qualityStatus is invalid: ${ticker}`
    )
  }
  return {
    ticker: getStringField(byField, 'ticker', ticker),
    asOf: getStringField(byField, 'asOf', ticker),
    valuationCurrency: 'KRW',
    universeFilterVersion: getStringField(
      byField,
      'universeFilterVersion',
      ticker
    ),
    qualityStatus,
    dataConfidence: getNumberField(byField, 'dataConfidence', ticker),
    isEtf: getBooleanField(byField, 'isEtf', ticker),
    isLeveragedOrInverse: getBooleanField(
      byField,
      'isLeveragedOrInverse',
      ticker
    ),
    fundamentalTriggerPassed: getBooleanField(
      byField,
      'fundamentalTriggerPassed',
      ticker
    ),
    thesisEvidence: getStringField(byField, 'thesisEvidence', ticker),
    liquidityScore: getNumberField(byField, 'liquidityScore', ticker),
    portfolioRiskPassed: getBooleanField(
      byField,
      'portfolioRiskPassed',
      ticker
    ),
    relativeStrength1M: getNumberField(byField, 'relativeStrength1M', ticker),
    relativeStrength3M: getNumberField(byField, 'relativeStrength3M', ticker),
    relativeStrength6M: getNumberField(byField, 'relativeStrength6M', ticker),
    momentumAcceleration: getNumberField(
      byField,
      'momentumAcceleration',
      ticker
    ),
    industryFundamental: getNumberField(byField, 'industryFundamental', ticker),
    volumeLiquidity: getNumberField(byField, 'volumeLiquidity', ticker),
    overheatRisk: getNumberField(byField, 'overheatRisk', ticker),
    drawdownDepth: getNumberField(byField, 'drawdownDepth', ticker),
    drawdownDuration: getNumberField(byField, 'drawdownDuration', ticker),
    reversalSignal: getNumberField(byField, 'reversalSignal', ticker),
    fundamentalRecovery: getNumberField(byField, 'fundamentalRecovery', ticker),
    structuralDamage: getNumberField(byField, 'structuralDamage', ticker),
  }
}

function mergeArtifactPair(
  momentum: Dg2PersistableStrategyEvidence,
  oversold: Dg2PersistableStrategyEvidence
): StrategyInput {
  if (momentum.ticker !== oversold.ticker) {
    throw new Error(
      `DG2 Momentum/Oversold pair ticker mismatch: ${momentum.ticker} vs ${oversold.ticker}`
    )
  }
  const ticker = momentum.ticker
  if (momentum.asOf !== oversold.asOf) {
    throw new Error(`DG2 Momentum/Oversold pair asOf mismatch: ${ticker}`)
  }
  if (momentum.strategyVersion !== oversold.strategyVersion) {
    throw new Error(
      `DG2 Momentum/Oversold pair strategyVersion mismatch: ${ticker}`
    )
  }

  const byField = new Map<string, string | number | boolean>()
  const assign = (
    entries: readonly Dg2PersistableStrategyInputEvidence[]
  ): void => {
    entries.forEach(fieldEntry => {
      if (
        DG2_COMMON_FIELDS_SET.has(fieldEntry.field) &&
        byField.has(fieldEntry.field)
      ) {
        const existing = byField.get(fieldEntry.field)
        if (existing !== fieldEntry.value) {
          throw new Error(
            `DG2 Momentum/Oversold pair has inconsistent ${fieldEntry.field} for ${ticker}: ${String(existing)} vs ${String(fieldEntry.value)}`
          )
        }
      }
      byField.set(fieldEntry.field, fieldEntry.value)
    })
  }
  assign(momentum.inputs)
  assign(oversold.inputs)

  const missing = DG2_ALL_FIELDS.filter(field => !byField.has(field))
  if (missing.length > 0) {
    throw new Error(
      `DG2 merged StrategyInput is missing fields for ${ticker}: ${missing.join(', ')}`
    )
  }

  return buildStrategyInput(ticker, byField)
}

export function normalizeDg2StrategyEvidenceBatch(
  rows: Dg2RawStrategyEvidence[]
): Dg2StrategyEvidenceBatchResult {
  const expectedKeys = DG2_APPROVED_TICKERS.flatMap(ticker =>
    (['momentum', 'oversold'] as const).map(strategy => `${ticker}:${strategy}`)
  )
  const expectedKeySet = new Set(expectedKeys)
  const counts = new Map<string, number>()
  rows.forEach(row => {
    const key = `${row.ticker}:${row.strategy}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  const missingKeys = expectedKeys.filter(key => (counts.get(key) ?? 0) === 0)
  if (missingKeys.length > 0) {
    throw new Error(
      `DG2 evidence batch is missing required ticker/strategy artifacts: ${missingKeys.join(', ')}`
    )
  }
  const invalid = [...counts.entries()]
    .filter(([key, count]) => count > 1 || !expectedKeySet.has(key))
    .map(([key]) => key)
  if (invalid.length > 0) {
    throw new Error(
      `DG2 evidence batch must not duplicate or add unapproved ticker/strategy combinations: ${invalid.join(', ')}`
    )
  }
  rows.forEach(row => {
    if (row.asOf !== DG2_PINNED_AS_OF) {
      throw new Error(
        `DG2 evidence batch must pin asOf to ${DG2_PINNED_AS_OF}: ${row.ticker}:${row.strategy}`
      )
    }
    if (row.strategyVersion !== DG2_PINNED_STRATEGY_VERSION) {
      throw new Error(
        `DG2 evidence batch must pin strategyVersion to ${DG2_PINNED_STRATEGY_VERSION}: ${row.ticker}:${row.strategy}`
      )
    }
  })

  const artifacts = normalizeDg2StrategyEvidence(rows)
  const byTicker = new Map<
    string,
    {
      momentum?: Dg2PersistableStrategyEvidence
      oversold?: Dg2PersistableStrategyEvidence
    }
  >()
  artifacts.forEach(artifact => {
    const pair = byTicker.get(artifact.ticker) ?? {}
    pair[artifact.strategy] = artifact
    byTicker.set(artifact.ticker, pair)
  })
  const mergedInputs = DG2_APPROVED_TICKERS.map(ticker => {
    const pair = byTicker.get(ticker)
    if (!pair?.momentum || !pair.oversold) {
      throw new Error(`DG2 evidence batch pair is incomplete: ${ticker}`)
    }
    return mergeArtifactPair(pair.momentum, pair.oversold)
  })

  return { artifacts, mergedInputs }
}
