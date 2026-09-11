import { execFile as execFileCallback } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

import {
  KiwoomRequestedDateMissingError,
  normalizeKiwoomEtfDailyResponse,
  normalizeKiwoomRequestedDate,
  type KiwoomEtfHistoricalDailyRow,
  type KiwoomEtfListEntry,
} from '../src/lib/etf/kiwoom-etf-historical-daily.ts'
import {
  chooseKiwoomDailyCaptureBatch,
  createKiwoomDailyCaptureCheckpoint,
  createKiwoomDailyCaptureRunDefinition,
  createKiwoomDailyCaptureRunLayout,
  renderKiwoomDailyCaptureRunReadme,
  sha256,
  validateKiwoomDailyCaptureCheckpoint,
  validateKiwoomDailyCaptureRunDefinition,
  type KiwoomDailyCaptureCheckpoint,
  type KiwoomDailyCaptureResultRecord,
  type KiwoomDailyCaptureRunDefinition,
  type KiwoomDailyCaptureRunLayout,
} from '../src/lib/etf/kiwoom-etf-historical-daily-run.ts'

const execFile = promisify(execFileCallback)
const KIWOOM_CLI_PATH = '/home/kwh8121/.local/bin/kiwoomcli'
const KIWOOM_LIST_TIMEOUT_MS = 30_000
const KIWOOM_DAILY_TIMEOUT_MS = 30_000
const INVOCATION_WORK_BUDGET_MS = 14 * 60 * 1_000
const LIST_ARGUMENTS = [
  'domestic',
  'etfs',
  'list',
  '--tax-type',
  'all',
  '--nav-compare',
  'all',
  '--manager',
  '0000',
  '--taxable',
  'all',
  '--tracking-index',
  '0',
  '--exchange',
  'KRX',
  '--pages',
  '0',
  '--format',
  'json',
]
const DAILY_COMMAND =
  'kiwoomcli domestic etfs daily --code <six-digit-ticker> --pages 1 --format json'
const SENSITIVE_FIELD_PATTERN =
  /(?:api[-_]?key|authorization|cookie|password|secret|token|account)/i

interface StoredDailyResult extends KiwoomDailyCaptureResultRecord {
  validatedRow?: KiwoomEtfHistoricalDailyRow
}

interface CompletedEntry {
  ticker: string
  status: StoredDailyResult['status']
}

function requiredArguments(argv: string[]): {
  requestedDate: string
  captureId: string
} {
  const [requestedDate, captureId] = argv
  if (!requestedDate || !captureId || argv.length !== 2) {
    throw new Error(
      'Usage: npm run capture:kiwoom-etf-historical-daily -- YYYYMMDD CAPTURE_ID'
    )
  }
  normalizeKiwoomRequestedDate(requestedDate)
  return { requestedDate, captureId }
}

function sanitizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_FIELD_PATTERN.test(key))
      .map(([key, item]) => [key, sanitizeJsonValue(item)])
  )
}

function sanitizeJson(rawOutput: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawOutput)
  } catch (error) {
    throw new Error('Kiwoom CLI returned invalid JSON', { cause: error })
  }
  return `${JSON.stringify(sanitizeJsonValue(parsed), null, 2)}\n`
}

function listCommand(): string {
  return `kiwoomcli ${LIST_ARGUMENTS.join(' ')}`
}

function parseStoredJson<T>(raw: string, name: string): T {
  try {
    return JSON.parse(raw) as T
  } catch (error) {
    throw new Error(`Kiwoom capture ${name} is not valid JSON`, {
      cause: error,
    })
  }
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error))
    return undefined
  return typeof error.code === 'string' ? error.code : undefined
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return false
    throw error
  }
}

async function runReadOnlyKiwoom(
  arguments_: string[],
  timeout: number
): Promise<string> {
  try {
    const { stdout } = await execFile(KIWOOM_CLI_PATH, arguments_, {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      timeout,
    })
    return stdout
  } catch (error) {
    throw new Error('Kiwoom ETF read-only command failed', { cause: error })
  }
}

async function fetchSanitizedList(): Promise<string> {
  try {
    return sanitizeJson(
      await runReadOnlyKiwoom(LIST_ARGUMENTS, KIWOOM_LIST_TIMEOUT_MS)
    )
  } catch (error) {
    throw new Error('Kiwoom ETF list read-only command failed', {
      cause: error,
    })
  }
}

async function fetchAndValidateDaily(input: {
  entry: KiwoomEtfListEntry
  requestedDate: string
}): Promise<{ raw: string; result: StoredDailyResult }> {
  let rawOutput: string
  try {
    rawOutput = await runReadOnlyKiwoom(
      [
        'domestic',
        'etfs',
        'daily',
        '--code',
        input.entry.ticker,
        '--pages',
        '1',
        '--format',
        'json',
      ],
      KIWOOM_DAILY_TIMEOUT_MS
    )
  } catch (error) {
    throw new Error(
      `Kiwoom ETF daily read-only command failed for ${input.entry.ticker}`,
      { cause: error }
    )
  }

  const raw = sanitizeJson(rawOutput)
  const rawSha256 = sha256(raw)
  try {
    const validatedRow = normalizeKiwoomEtfDailyResponse({
      rawResponse: raw,
      requestedDate: input.requestedDate,
      ticker: input.entry.ticker,
      productName: input.entry.productName,
    })
    return {
      raw,
      result: {
        ticker: input.entry.ticker,
        productName: input.entry.productName,
        requestedDate: input.requestedDate,
        status: 'captured',
        rawSha256,
        validatedRow,
      },
    }
  } catch (error) {
    if (error instanceof KiwoomRequestedDateMissingError) {
      return {
        raw,
        result: {
          ticker: input.entry.ticker,
          productName: input.entry.productName,
          requestedDate: input.requestedDate,
          status: 'missing_requested_date',
          rawSha256,
        },
      }
    }
    const validationMessage =
      error instanceof Error ? error.message : 'unknown validation failure'
    throw new Error(
      `Kiwoom daily validation failed for ${input.entry.ticker} on ${input.requestedDate}: ${validationMessage}`,
      { cause: error }
    )
  }
}

async function writeAtomicFile(path: string, content: string): Promise<void> {
  const temporaryPath = `${path}.${process.pid}.${randomUUID()}.tmp`
  try {
    await writeFile(temporaryPath, content, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, path)
  } catch (error) {
    await rm(temporaryPath, { force: true })
    throw error
  }
}

async function writeDailyEntry(input: {
  layout: KiwoomDailyCaptureRunLayout
  raw: string
  result: StoredDailyResult
}): Promise<void> {
  const entryPath = resolve(input.layout.entriesDirectory, input.result.ticker)
  const temporaryPath = resolve(
    input.layout.entriesDirectory,
    `.${input.result.ticker}.${process.pid}.${randomUUID()}.tmp`
  )
  try {
    await mkdir(temporaryPath)
    await writeFile(resolve(temporaryPath, 'raw.json'), input.raw, {
      encoding: 'utf8',
      flag: 'wx',
    })
    await writeFile(
      resolve(temporaryPath, 'result.json'),
      `${JSON.stringify(input.result, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx' }
    )
    await rename(temporaryPath, entryPath)
  } catch (error) {
    await rm(temporaryPath, { recursive: true, force: true })
    throw error
  }
}

function validateStoredEntry(input: {
  raw: string
  record: StoredDailyResult
  entry: KiwoomEtfListEntry
  requestedDate: string
}): CompletedEntry {
  const { raw, record, entry, requestedDate } = input
  if (
    !record ||
    typeof record !== 'object' ||
    record.ticker !== entry.ticker ||
    record.productName !== entry.productName ||
    record.requestedDate !== requestedDate ||
    (record.status !== 'captured' &&
      record.status !== 'missing_requested_date') ||
    record.rawSha256 !== sha256(raw)
  ) {
    throw new Error(`Kiwoom capture entry integrity failed for ${entry.ticker}`)
  }

  try {
    const normalized = normalizeKiwoomEtfDailyResponse({
      rawResponse: raw,
      requestedDate,
      ticker: entry.ticker,
      productName: entry.productName,
    })
    if (
      record.status !== 'captured' ||
      JSON.stringify(record.validatedRow) !== JSON.stringify(normalized)
    ) {
      throw new Error(
        `Kiwoom capture entry result mismatch for ${entry.ticker}`
      )
    }
  } catch (error) {
    if (
      error instanceof KiwoomRequestedDateMissingError &&
      record.status === 'missing_requested_date'
    ) {
      return { ticker: entry.ticker, status: record.status }
    }
    throw error
  }
  return { ticker: entry.ticker, status: record.status }
}

async function readCompletedEntries(input: {
  layout: KiwoomDailyCaptureRunLayout
  definition: KiwoomDailyCaptureRunDefinition
}): Promise<CompletedEntry[]> {
  const entries = await readdir(input.layout.entriesDirectory, {
    withFileTypes: true,
  })
  const candidates = new Map(
    input.definition.numericCandidates.map(entry => [entry.ticker, entry])
  )
  const completedEntries: CompletedEntry[] = []
  for (const directoryEntry of entries) {
    if (!directoryEntry.isDirectory() || directoryEntry.name.startsWith('.')) {
      throw new Error(
        'Kiwoom capture entries directory contains an invalid entry'
      )
    }
    const entry = candidates.get(directoryEntry.name)
    if (!entry) {
      throw new Error(
        `Kiwoom capture entries directory contains an unknown ticker: ${directoryEntry.name}`
      )
    }
    const entryDirectory = resolve(input.layout.entriesDirectory, entry.ticker)
    const [raw, rawResult] = await Promise.all([
      readFile(resolve(entryDirectory, 'raw.json'), 'utf8'),
      readFile(resolve(entryDirectory, 'result.json'), 'utf8'),
    ])
    completedEntries.push(
      validateStoredEntry({
        raw,
        record: parseStoredJson<StoredDailyResult>(rawResult, 'daily result'),
        entry,
        requestedDate: input.definition.requestedDate,
      })
    )
  }
  return completedEntries.sort((left, right) =>
    left.ticker.localeCompare(right.ticker)
  )
}

async function writeCheckpoint(input: {
  layout: KiwoomDailyCaptureRunLayout
  definition: KiwoomDailyCaptureRunDefinition
  completedEntries: CompletedEntry[]
}): Promise<void> {
  const checkpoint = createKiwoomDailyCaptureCheckpoint({
    definition: input.definition,
    completedTickers: input.completedEntries.map(entry => entry.ticker),
    updatedAt: new Date().toISOString(),
  })
  await writeAtomicFile(
    input.layout.checkpointPath,
    `${JSON.stringify(checkpoint, null, 2)}\n`
  )
}

async function initializeRun(input: {
  layout: KiwoomDailyCaptureRunLayout
  requestedDate: string
  captureId: string
}): Promise<KiwoomDailyCaptureRunDefinition> {
  const sanitizedList = await fetchSanitizedList()
  const definition = createKiwoomDailyCaptureRunDefinition({
    requestedDate: input.requestedDate,
    captureId: input.captureId,
    sanitizedList,
    sourceCommands: { list: listCommand(), daily: DAILY_COMMAND },
    createdAt: new Date().toISOString(),
  })
  const temporaryDirectory = `${input.layout.runDirectory}.initializing.${process.pid}.${randomUUID()}.tmp`
  try {
    await mkdir(temporaryDirectory)
    await mkdir(resolve(temporaryDirectory, 'entries'))
    await writeFile(resolve(temporaryDirectory, 'list.json'), sanitizedList, {
      encoding: 'utf8',
      flag: 'wx',
    })
    await writeFile(
      resolve(temporaryDirectory, 'run.json'),
      `${JSON.stringify(definition, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx' }
    )
    await writeFile(
      resolve(temporaryDirectory, 'README.md'),
      renderKiwoomDailyCaptureRunReadme(definition),
      { encoding: 'utf8', flag: 'wx' }
    )
    const checkpoint = createKiwoomDailyCaptureCheckpoint({
      definition,
      completedTickers: [],
      updatedAt: new Date().toISOString(),
    })
    await writeFile(
      resolve(temporaryDirectory, 'checkpoint.json'),
      `${JSON.stringify(checkpoint, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx' }
    )
    await rename(temporaryDirectory, input.layout.runDirectory)
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true })
    throw error
  }
  return definition
}

async function loadOrInitializeRun(input: {
  layout: KiwoomDailyCaptureRunLayout
  requestedDate: string
  captureId: string
}): Promise<KiwoomDailyCaptureRunDefinition> {
  if (!(await pathExists(input.layout.definitionPath))) {
    if (await pathExists(input.layout.runDirectory)) {
      throw new Error('Kiwoom capture run directory is incomplete')
    }
    return initializeRun(input)
  }
  const [rawDefinition, sanitizedList] = await Promise.all([
    readFile(input.layout.definitionPath, 'utf8'),
    readFile(input.layout.listPath, 'utf8'),
  ])
  const definition = parseStoredJson<KiwoomDailyCaptureRunDefinition>(
    rawDefinition,
    'run definition'
  )
  validateKiwoomDailyCaptureRunDefinition({
    definition,
    requestedDate: input.requestedDate,
    captureId: input.captureId,
    sanitizedList,
  })
  return definition
}

async function loadAndValidateCheckpoint(input: {
  layout: KiwoomDailyCaptureRunLayout
  definition: KiwoomDailyCaptureRunDefinition
}): Promise<KiwoomDailyCaptureCheckpoint> {
  const checkpoint = parseStoredJson<KiwoomDailyCaptureCheckpoint>(
    await readFile(input.layout.checkpointPath, 'utf8'),
    'checkpoint'
  )
  validateKiwoomDailyCaptureCheckpoint({
    definition: input.definition,
    checkpoint,
  })
  return checkpoint
}

async function acquireRunLock(
  layout: KiwoomDailyCaptureRunLayout
): Promise<void> {
  try {
    await writeFile(layout.lockPath, `${process.pid}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    })
  } catch (error) {
    if (errorCode(error) === 'EEXIST') {
      throw new Error('Kiwoom capture run is already active')
    }
    throw error
  }
}

function safeCaptureErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'unexpected capture failure'
  if (
    error.message === 'Kiwoom ETF list read-only command failed' ||
    /^Kiwoom ETF daily read-only command failed for \d{6}$/.test(
      error.message
    ) ||
    error.message === 'Kiwoom CLI returned invalid JSON' ||
    error.message.startsWith('Kiwoom daily validation failed for ')
  ) {
    return error.message
  }
  return 'capture validation or artifact persistence failed'
}

async function main(): Promise<void> {
  const { requestedDate, captureId } = requiredArguments(process.argv.slice(2))
  const layout = createKiwoomDailyCaptureRunLayout({ requestedDate, captureId })
  await mkdir(layout.dateDirectory, { recursive: true })
  await acquireRunLock(layout)
  try {
    const definition = await loadOrInitializeRun({
      layout,
      requestedDate,
      captureId,
    })
    await loadAndValidateCheckpoint({ layout, definition })
    const completedEntries = await readCompletedEntries({ layout, definition })
    await writeCheckpoint({ layout, definition, completedEntries })

    const startedAt = Date.now()
    const batch = chooseKiwoomDailyCaptureBatch({
      candidates: definition.numericCandidates,
      completedTickers: completedEntries.map(entry => entry.ticker),
    })
    let capturedThisInvocation = 0
    let missingThisInvocation = 0
    for (const entry of batch) {
      if (Date.now() - startedAt >= INVOCATION_WORK_BUDGET_MS) break
      const captured = await fetchAndValidateDaily({ entry, requestedDate })
      await writeDailyEntry({ layout, ...captured })
      const completedEntry = {
        ticker: entry.ticker,
        status: captured.result.status,
      } satisfies CompletedEntry
      completedEntries.push(completedEntry)
      await writeCheckpoint({ layout, definition, completedEntries })
      if (captured.result.status === 'captured') capturedThisInvocation += 1
      else missingThisInvocation += 1
    }

    const totalCaptured = completedEntries.filter(
      entry => entry.status === 'captured'
    ).length
    const totalMissingRequestedDate = completedEntries.length - totalCaptured
    console.log(
      JSON.stringify({
        batchLimit: batch.length,
        processedThisInvocation: capturedThisInvocation + missingThisInvocation,
        capturedThisInvocation,
        missingRequestedDateThisInvocation: missingThisInvocation,
        totalCandidates: definition.numericCandidates.length,
        completedCandidates: completedEntries.length,
        capturedCandidates: totalCaptured,
        missingRequestedDateCandidates: totalMissingRequestedDate,
        remainingCandidates:
          definition.numericCandidates.length - completedEntries.length,
        unsupportedIdentifierCount: definition.unsupportedIdentifiers.length,
      })
    )
  } finally {
    await unlink(layout.lockPath)
  }
}

void main().catch(error => {
  console.error(
    `Kiwoom ETF historical daily capture failed: ${safeCaptureErrorMessage(error)}`
  )
  process.exitCode = 1
})
