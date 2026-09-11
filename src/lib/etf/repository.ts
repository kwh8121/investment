import { createHash } from 'node:crypto'

import type {
  DataSource,
  DailyQuote,
  EtfMaster,
  IngestionRun,
  PipelineStage,
  QualityEvent,
  RawSnapshot,
} from './types.ts'

export interface PipelineRepository {
  findSuccessfulRun(requestKey: string): IngestionRun | undefined
  startRun(
    requestKey: string,
    source: DataSource,
    startedAt: string
  ): IngestionRun
  finishRun(
    runId: string,
    status: 'succeeded' | 'failed',
    finishedAt: string,
    failureReason?: string
  ): IngestionRun
  findRawSnapshot(
    source: DataSource,
    endpoint: string,
    asOf: string,
    payloadHash: string
  ): RawSnapshot | undefined
  saveRawSnapshot(snapshot: RawSnapshot): RawSnapshot
  saveEtfMaster(master: EtfMaster): EtfMaster
  saveDailyQuote(quote: DailyQuote): DailyQuote
  saveQualityEvent(event: QualityEvent): QualityEvent
}

export class InMemoryPipelineRepository implements PipelineRepository {
  private readonly runs = new Map<string, IngestionRun>()
  private readonly snapshots = new Map<string, RawSnapshot>()
  private readonly masters = new Map<string, EtfMaster>()
  private readonly quotes = new Map<string, DailyQuote>()
  private readonly qualityEvents = new Map<string, QualityEvent>()

  findSuccessfulRun(requestKey: string) {
    return [...this.runs.values()].find(
      run => run.requestKey === requestKey && run.status === 'succeeded'
    )
  }

  startRun(requestKey: string, source: DataSource, startedAt: string) {
    const attempt =
      [...this.runs.values()].filter(run => run.requestKey === requestKey)
        .length + 1
    const run: IngestionRun = {
      id: `${requestKey}:${attempt}`,
      requestKey,
      source,
      startedAt,
      finishedAt: null,
      status: 'running',
      attempt,
      failureReason: null,
    }
    this.runs.set(run.id, run)
    return run
  }

  finishRun(
    runId: string,
    status: 'succeeded' | 'failed',
    finishedAt: string,
    failureReason?: string
  ) {
    const current = this.runs.get(runId)
    if (!current) throw new Error(`Unknown ingestion run: ${runId}`)
    const finished = {
      ...current,
      status,
      finishedAt,
      failureReason: failureReason ?? null,
    } satisfies IngestionRun
    this.runs.set(runId, finished)
    return finished
  }

  findRawSnapshot(
    source: DataSource,
    endpoint: string,
    asOf: string,
    payloadHash: string
  ) {
    return [...this.snapshots.values()].find(
      snapshot =>
        snapshot.source === source &&
        snapshot.endpoint === endpoint &&
        snapshot.asOf === asOf &&
        snapshot.payloadHash === payloadHash
    )
  }

  saveRawSnapshot(snapshot: RawSnapshot) {
    const existing = this.findRawSnapshot(
      snapshot.source,
      snapshot.endpoint,
      snapshot.asOf,
      snapshot.payloadHash
    )
    if (existing) return existing
    this.snapshots.set(snapshot.id, snapshot)
    return snapshot
  }

  saveEtfMaster(master: EtfMaster) {
    this.masters.set(`${master.instrumentId}:${master.asOf}`, master)
    return master
  }

  saveDailyQuote(quote: DailyQuote) {
    this.quotes.set(
      `${quote.instrumentId}:${quote.source}:${quote.asOf}`,
      quote
    )
    return quote
  }

  saveQualityEvent(event: QualityEvent) {
    this.qualityEvents.set(event.id, event)
    return event
  }
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined'
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`
}

export function sha256(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

export function requestKey(
  source: DataSource,
  endpoint: string,
  asOf: string,
  requestParameters: Record<string, string>
): string {
  return sha256({ source, endpoint, asOf, requestParameters })
}

export function stageError(stage: PipelineStage, reason: string): Error {
  return new Error(`${stage}: ${reason}`)
}
