export type DataSource = 'kiwoom' | 'krx' | 'csv'
export type QualityStatus = 'passed' | 'warning' | 'blocked'
export type PipelineStage =
  | 'raw_snapshot'
  | 'normalization'
  | 'quality'
  | 'calculation'
  | 'read_model'

export interface KoreanEtfPayload {
  instrumentId: string
  ticker: string
  name: string
  market: 'KR'
  currency: 'KRW'
  asOf: string
  close: number | null
  volume: number | null
  nav: number | null
  isEtf: boolean
  isLeveragedOrInverse: boolean
}

export interface RawSnapshotInput {
  source: DataSource
  endpoint: string
  asOf: string
  fetchedAt: string
  payload: unknown
}

export interface IngestionRun {
  id: string
  requestKey: string
  source: DataSource
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'succeeded' | 'failed'
  attempt: number
  failureReason: string | null
}

export interface RawSnapshot {
  id: string
  ingestionRunId: string
  source: DataSource
  endpoint: string
  asOf: string
  fetchedAt: string
  createdAt: string
  payloadHash: string
  payload: unknown
}

export interface EtfMaster {
  instrumentId: string
  ticker: string
  name: string
  market: 'KR'
  source: DataSource
  asOf: string
  fetchedAt: string
  snapshotId: string
  createdAt: string
}

export interface DailyQuote {
  id: string
  instrumentId: string
  source: DataSource
  asOf: string
  fetchedAt: string
  close: number | null
  volume: number | null
  nav: number | null
  snapshotId: string
  qualityStatus: QualityStatus
  createdAt: string
}

export interface QualityEvent {
  id: string
  dailyQuoteId: string
  ruleId: string
  severity: 'warning' | 'error'
  observedAt: string
  createdAt: string
  reason: string
}

export interface ComputedMetrics {
  baseCurrency: 'KRW'
  navPremiumDiscountPct: number | null
  volumeScore: number
  dataQualityScore: number
}

export interface ThesisTrigger {
  thesis: string
  triggers: string[]
  invalidation: string
}

export interface EtfReadModel {
  instrumentId: string
  ticker: string
  name: string
  asOf: string
  snapshotId: string
  qualityStatus: QualityStatus
  recommendationAllowed: boolean
  strategyVersion: string
  score: number | null
  metrics: ComputedMetrics
  thesis: ThesisTrigger | null
}

export interface PipelineTraceEntry {
  stage: PipelineStage
  status: 'started' | 'succeeded' | 'failed' | 'reused'
  at: string
  detail: string
}

export interface PipelineResult {
  ingestionRun: IngestionRun
  rawSnapshot: RawSnapshot
  etfMaster: EtfMaster | null
  dailyQuote: DailyQuote | null
  qualityEvents: QualityEvent[]
  readModel: EtfReadModel
  trace: PipelineTraceEntry[]
}
