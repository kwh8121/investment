import { createHash } from 'node:crypto'
import { resolve } from 'node:path'

import {
  normalizeKiwoomEtfListResponse,
  normalizeKiwoomRequestedDate,
  type KiwoomEtfListEntry,
} from './kiwoom-etf-historical-daily.ts'

export const KIWOOM_DAILY_CAPTURE_BATCH_LIMIT = 100
export const KIWOOM_DAILY_CAPTURE_RUN_SCHEMA_VERSION = 1
export const KIWOOM_DAILY_CAPTURE_SANITIZER_VERSION = '1'
export const KIWOOM_DAILY_CAPTURE_RAW_ROOT =
  '/home/kwh8121/.local/share/stock-market/evidence-bundle/raw'

const CAPTURE_ID_PATTERN = /^[A-Za-z0-9_-]+$/
const SHA256_PATTERN = /^[a-f0-9]{64}$/

export interface KiwoomDailyCaptureRunLayout {
  dateDirectory: string
  runDirectory: string
  listPath: string
  definitionPath: string
  checkpointPath: string
  readmePath: string
  entriesDirectory: string
  lockPath: string
}

export interface KiwoomDailyCaptureRunDefinition {
  schemaVersion: number
  captureId: string
  requestedDate: string
  normalizedDate: string
  sanitizerVersion: string
  sourceCommands: {
    list: string
    daily: string
  }
  listSha256: string
  numericCandidates: KiwoomEtfListEntry[]
  numericCandidateSetSha256: string
  unsupportedIdentifiers: string[]
  unsupportedIdentifierSetSha256: string
  createdAt: string
}

export interface KiwoomDailyCaptureResultRecord {
  ticker: string
  productName: string
  requestedDate: string
  status: 'captured' | 'missing_requested_date'
  rawSha256: string
}

export interface KiwoomDailyCaptureCheckpoint {
  schemaVersion: number
  captureId: string
  requestedDate: string
  listSha256: string
  numericCandidateSetSha256: string
  unsupportedIdentifierSetSha256: string
  completedTickers: string[]
  updatedAt: string
}

export function validateKiwoomCaptureId(captureId: string): string {
  if (!CAPTURE_ID_PATTERN.test(captureId)) {
    throw new Error(
      'Kiwoom capture ID must use only ASCII letters, digits, hyphens, and underscores'
    )
  }
  return captureId
}

export function createKiwoomDailyCaptureRunLayout(input: {
  requestedDate: string
  captureId: string
  rawRoot?: string
}): KiwoomDailyCaptureRunLayout {
  normalizeKiwoomRequestedDate(input.requestedDate)
  const captureId = validateKiwoomCaptureId(input.captureId)
  const rawRoot = input.rawRoot ?? KIWOOM_DAILY_CAPTURE_RAW_ROOT
  const dateDirectory = resolve(
    rawRoot,
    'kiwoom-etf-historical-daily',
    input.requestedDate
  )
  const runDirectory = resolve(dateDirectory, captureId)

  return {
    dateDirectory,
    runDirectory,
    listPath: resolve(runDirectory, 'list.json'),
    definitionPath: resolve(runDirectory, 'run.json'),
    checkpointPath: resolve(runDirectory, 'checkpoint.json'),
    readmePath: resolve(runDirectory, 'README.md'),
    entriesDirectory: resolve(runDirectory, 'entries'),
    lockPath: resolve(dateDirectory, `.${captureId}.lock`),
  }
}

export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function candidateSetSha256(entries: KiwoomEtfListEntry[]): string {
  const canonicalEntries = [...entries].sort((left, right) =>
    left.ticker.localeCompare(right.ticker)
  )
  return sha256(JSON.stringify(canonicalEntries))
}

function identifierSetSha256(identifiers: string[]): string {
  return sha256(JSON.stringify([...identifiers].sort()))
}

function assertUniqueCandidates(entries: KiwoomEtfListEntry[]): void {
  const tickers = new Set<string>()
  for (const entry of entries) {
    if (!/^\d{6}$/.test(entry.ticker) || !entry.productName.trim()) {
      throw new Error('Kiwoom numeric candidate set is malformed')
    }
    if (tickers.has(entry.ticker)) {
      throw new Error(
        `Kiwoom numeric candidate set has a duplicate ticker: ${entry.ticker}`
      )
    }
    tickers.add(entry.ticker)
  }
}

function assertUniqueUnsupportedIdentifiers(identifiers: string[]): void {
  if (new Set(identifiers).size !== identifiers.length) {
    throw new Error('Kiwoom unsupported identifier set has duplicates')
  }
}

function assertSha256(value: string, name: string): void {
  if (!SHA256_PATTERN.test(value)) {
    throw new Error(`Kiwoom ${name} is not a SHA-256 digest`)
  }
}

export function createKiwoomDailyCaptureRunDefinition(input: {
  requestedDate: string
  captureId: string
  sanitizedList: string
  sourceCommands: KiwoomDailyCaptureRunDefinition['sourceCommands']
  createdAt: string
}): KiwoomDailyCaptureRunDefinition {
  const normalizedDate = normalizeKiwoomRequestedDate(input.requestedDate)
  const captureId = validateKiwoomCaptureId(input.captureId)
  const { numericEntries, unsupportedIdentifiers } =
    normalizeKiwoomEtfListResponse(input.sanitizedList)
  assertUniqueCandidates(numericEntries)
  assertUniqueUnsupportedIdentifiers(unsupportedIdentifiers)

  return {
    schemaVersion: KIWOOM_DAILY_CAPTURE_RUN_SCHEMA_VERSION,
    captureId,
    requestedDate: input.requestedDate,
    normalizedDate,
    sanitizerVersion: KIWOOM_DAILY_CAPTURE_SANITIZER_VERSION,
    sourceCommands: input.sourceCommands,
    listSha256: sha256(input.sanitizedList),
    numericCandidates: numericEntries,
    numericCandidateSetSha256: candidateSetSha256(numericEntries),
    unsupportedIdentifiers,
    unsupportedIdentifierSetSha256: identifierSetSha256(unsupportedIdentifiers),
    createdAt: input.createdAt,
  }
}

export function validateKiwoomDailyCaptureRunDefinition(input: {
  definition: KiwoomDailyCaptureRunDefinition
  requestedDate: string
  captureId: string
  sanitizedList: string
}): void {
  const { definition } = input
  const normalizedDate = normalizeKiwoomRequestedDate(input.requestedDate)
  const captureId = validateKiwoomCaptureId(input.captureId)
  if (definition.schemaVersion !== KIWOOM_DAILY_CAPTURE_RUN_SCHEMA_VERSION) {
    throw new Error('Kiwoom capture run schema version mismatch')
  }
  if (definition.captureId !== captureId) {
    throw new Error('Kiwoom capture run ID mismatch')
  }
  if (
    definition.requestedDate !== input.requestedDate ||
    definition.normalizedDate !== normalizedDate
  ) {
    throw new Error('Kiwoom capture run requested date mismatch')
  }
  if (definition.sanitizerVersion !== KIWOOM_DAILY_CAPTURE_SANITIZER_VERSION) {
    throw new Error('Kiwoom capture run sanitizer version mismatch')
  }
  assertUniqueCandidates(definition.numericCandidates)
  assertUniqueUnsupportedIdentifiers(definition.unsupportedIdentifiers)
  assertSha256(definition.listSha256, 'list hash')
  assertSha256(
    definition.numericCandidateSetSha256,
    'numeric candidate set hash'
  )
  assertSha256(
    definition.unsupportedIdentifierSetSha256,
    'unsupported identifier set hash'
  )

  const frozenDefinition = createKiwoomDailyCaptureRunDefinition({
    requestedDate: input.requestedDate,
    captureId,
    sanitizedList: input.sanitizedList,
    sourceCommands: definition.sourceCommands,
    createdAt: definition.createdAt,
  })
  if (definition.listSha256 !== frozenDefinition.listSha256) {
    throw new Error('Kiwoom capture run list hash mismatch')
  }
  if (
    definition.numericCandidateSetSha256 !==
      frozenDefinition.numericCandidateSetSha256 ||
    candidateSetSha256(definition.numericCandidates) !==
      frozenDefinition.numericCandidateSetSha256
  ) {
    throw new Error('Kiwoom capture run numeric candidate set mismatch')
  }
  if (
    definition.unsupportedIdentifierSetSha256 !==
      frozenDefinition.unsupportedIdentifierSetSha256 ||
    identifierSetSha256(definition.unsupportedIdentifiers) !==
      frozenDefinition.unsupportedIdentifierSetSha256
  ) {
    throw new Error('Kiwoom capture run unsupported identifier set mismatch')
  }
}

export function createKiwoomDailyCaptureCheckpoint(input: {
  definition: KiwoomDailyCaptureRunDefinition
  completedTickers: string[]
  updatedAt: string
}): KiwoomDailyCaptureCheckpoint {
  const candidateTickers = new Set(
    input.definition.numericCandidates.map(entry => entry.ticker)
  )
  const completedTickers = [...new Set(input.completedTickers)].sort()
  if (completedTickers.length !== input.completedTickers.length) {
    throw new Error('Kiwoom capture checkpoint has duplicate completed tickers')
  }
  for (const ticker of completedTickers) {
    if (!candidateTickers.has(ticker)) {
      throw new Error(
        `Kiwoom capture checkpoint has an unknown ticker: ${ticker}`
      )
    }
  }

  return {
    schemaVersion: KIWOOM_DAILY_CAPTURE_RUN_SCHEMA_VERSION,
    captureId: input.definition.captureId,
    requestedDate: input.definition.requestedDate,
    listSha256: input.definition.listSha256,
    numericCandidateSetSha256: input.definition.numericCandidateSetSha256,
    unsupportedIdentifierSetSha256:
      input.definition.unsupportedIdentifierSetSha256,
    completedTickers,
    updatedAt: input.updatedAt,
  }
}

export function validateKiwoomDailyCaptureCheckpoint(input: {
  definition: KiwoomDailyCaptureRunDefinition
  checkpoint: KiwoomDailyCaptureCheckpoint
}): void {
  const expected = input.definition
  const checkpoint = input.checkpoint
  if (
    checkpoint.schemaVersion !== KIWOOM_DAILY_CAPTURE_RUN_SCHEMA_VERSION ||
    checkpoint.captureId !== expected.captureId ||
    checkpoint.requestedDate !== expected.requestedDate ||
    checkpoint.listSha256 !== expected.listSha256 ||
    checkpoint.numericCandidateSetSha256 !==
      expected.numericCandidateSetSha256 ||
    checkpoint.unsupportedIdentifierSetSha256 !==
      expected.unsupportedIdentifierSetSha256
  ) {
    throw new Error('Kiwoom capture checkpoint immutable run fields mismatch')
  }
  createKiwoomDailyCaptureCheckpoint({
    definition: expected,
    completedTickers: checkpoint.completedTickers,
    updatedAt: checkpoint.updatedAt,
  })
}

export function chooseKiwoomDailyCaptureBatch(input: {
  candidates: KiwoomEtfListEntry[]
  completedTickers: Iterable<string>
  batchLimit?: number
}): KiwoomEtfListEntry[] {
  assertUniqueCandidates(input.candidates)
  const batchLimit = input.batchLimit ?? KIWOOM_DAILY_CAPTURE_BATCH_LIMIT
  if (
    !Number.isSafeInteger(batchLimit) ||
    batchLimit < 1 ||
    batchLimit > KIWOOM_DAILY_CAPTURE_BATCH_LIMIT
  ) {
    throw new Error(
      `Kiwoom capture batch limit must be between 1 and ${KIWOOM_DAILY_CAPTURE_BATCH_LIMIT}`
    )
  }
  const completed = new Set(input.completedTickers)
  return input.candidates
    .filter(entry => !completed.has(entry.ticker))
    .slice(0, batchLimit)
}

export function renderKiwoomDailyCaptureRunReadme(
  definition: KiwoomDailyCaptureRunDefinition
): string {
  return `# Kiwoom ETF historical daily capture run

Purpose: store sanitized, per-ticker external evidence for a bounded, resumable capture run.

Run schema version: ${definition.schemaVersion}
Capture ID: ${definition.captureId}
Requested date: ${definition.requestedDate} (${definition.normalizedDate})
Created at: ${definition.createdAt}
Sanitizer version: ${definition.sanitizerVersion}
Sanitized list SHA-256: ${definition.listSha256}
Numeric candidate count: ${definition.numericCandidates.length}
Numeric candidate set SHA-256: ${definition.numericCandidateSetSha256}
Unsupported identifier count: ${definition.unsupportedIdentifiers.length}
Unsupported identifier set SHA-256: ${definition.unsupportedIdentifierSetSha256}

List command: ${definition.sourceCommands.list}
Daily command: ${definition.sourceCommands.daily}

Only sanitized JSON is stored in this run. Each completed ticker has an atomic entry directory containing raw.json and result.json. checkpoint.json is a resumable progress index.

Selection, source-index sealing, Gate changes, and any claimed final snapshot are blocked for this run.
`
}
