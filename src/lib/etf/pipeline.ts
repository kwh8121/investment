import {
  normalizeKoreanEtf,
  qualityStatusFor,
  sanitizeSecrets,
} from './normalize.ts'
import {
  requestKey,
  sha256,
  stageError,
  type PipelineRepository,
} from './repository.ts'
import type {
  ComputedMetrics,
  EtfReadModel,
  PipelineResult,
  PipelineStage,
  RawSnapshotInput,
  ThesisTrigger,
} from './types.ts'

export const STRATEGY_VERSION = 'korean-single-etf-v1'

export interface PipelineOptions {
  now?: () => Date
  afterStage?: (stage: PipelineStage) => void | Promise<void>
}

export interface KoreanEtfSource {
  fetch(request: { ticker: string; asOf: string }): Promise<RawSnapshotInput>
}

function scoreMetrics(metrics: ComputedMetrics): number {
  if (metrics.navPremiumDiscountPct === null) return 0
  const navAlignment = Math.max(
    0,
    40 - Math.abs(metrics.navPremiumDiscountPct) * 4
  )
  return Math.round(
    navAlignment + metrics.volumeScore + metrics.dataQualityScore
  )
}

function calculateMetrics(
  close: number | null,
  nav: number | null,
  volume: number | null
): ComputedMetrics {
  const navPremiumDiscountPct =
    close !== null && nav !== null && nav > 0
      ? ((close - nav) / nav) * 100
      : null
  return {
    baseCurrency: 'KRW',
    navPremiumDiscountPct,
    volumeScore: volume === null ? 0 : volume > 0 ? 30 : 0,
    dataQualityScore: navPremiumDiscountPct === null ? 0 : 30,
  }
}

function buildThesis(metrics: ComputedMetrics): ThesisTrigger {
  const discount =
    metrics.navPremiumDiscountPct !== null && metrics.navPremiumDiscountPct < 0
  return {
    thesis: discount
      ? 'NAV 대비 할인 여부를 확인할 수 있는 한국 ETF 데이터가 확보되었습니다.'
      : 'NAV 대비 가격 정합성을 확인할 수 있는 한국 ETF 데이터가 확보되었습니다.',
    triggers: [
      '다음 기준일에도 close·volume·NAV가 모두 유효할 것',
      discount
        ? 'NAV 대비 할인 폭이 사전에 정한 범위 안에서 유지될 것'
        : 'NAV 대비 괴리율을 재검증할 것',
    ],
    invalidation:
      '가격·거래량·NAV 중 하나라도 누락되거나 품질 Gate가 실패하면 추천을 무효화합니다.',
  }
}

function blockedReadModel(
  payload: { instrumentId: string; ticker: string; name: string; asOf: string },
  snapshotId: string,
  qualityStatus: 'blocked',
  metrics: ComputedMetrics
): EtfReadModel {
  return {
    instrumentId: payload.instrumentId,
    ticker: payload.ticker,
    name: payload.name,
    asOf: payload.asOf,
    snapshotId,
    qualityStatus,
    recommendationAllowed: false,
    strategyVersion: STRATEGY_VERSION,
    score: null,
    metrics,
    thesis: null,
  }
}

export async function runKoreanSingleEtfPipeline(
  input: RawSnapshotInput,
  repository: PipelineRepository,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const now = options.now ?? (() => new Date())
  const requestKeyValue = requestKey(
    input.source,
    input.endpoint,
    input.asOf,
    {}
  )
  const startedAt = now().toISOString()
  const run = repository.startRun(requestKeyValue, input.source, startedAt)
  const trace: PipelineResult['trace'] = []
  let currentStage: PipelineStage = 'raw_snapshot'
  try {
    const sanitizedPayload = sanitizeSecrets(input.payload)
    const payloadHash = sha256(sanitizedPayload)
    const snapshot =
      repository.findRawSnapshot(
        input.source,
        input.endpoint,
        input.asOf,
        payloadHash
      ) ??
      repository.saveRawSnapshot({
        id: `${input.source}:${input.endpoint}:${input.asOf}:${payloadHash}`,
        ingestionRunId: run.id,
        source: input.source,
        endpoint: input.endpoint,
        asOf: input.asOf,
        fetchedAt: input.fetchedAt,
        createdAt: now().toISOString(),
        payloadHash,
        payload: sanitizedPayload,
      })
    trace.push({
      stage: 'raw_snapshot',
      status: snapshot.ingestionRunId === run.id ? 'succeeded' : 'reused',
      at: now().toISOString(),
      detail: snapshot.id,
    })
    currentStage = 'normalization'
    await options.afterStage?.('raw_snapshot')

    const payload = normalizeKoreanEtf(snapshot)
    trace.push({
      stage: 'normalization',
      status: 'succeeded',
      at: now().toISOString(),
      detail: payload.instrumentId,
    })
    await options.afterStage?.('normalization')

    currentStage = 'quality'
    const quality = qualityStatusFor(payload)
    const master = repository.saveEtfMaster({
      instrumentId: payload.instrumentId,
      ticker: payload.ticker,
      name: payload.name,
      market: payload.market,
      source: input.source,
      asOf: payload.asOf,
      fetchedAt: input.fetchedAt,
      snapshotId: snapshot.id,
      createdAt: now().toISOString(),
    })
    const quoteId = `${payload.instrumentId}:${input.source}:${payload.asOf}`
    const quote = repository.saveDailyQuote({
      id: quoteId,
      instrumentId: payload.instrumentId,
      source: input.source,
      asOf: payload.asOf,
      fetchedAt: input.fetchedAt,
      close: payload.close,
      volume: payload.volume,
      nav: payload.nav,
      snapshotId: snapshot.id,
      qualityStatus: quality.status,
      createdAt: now().toISOString(),
    })
    const qualityEvents = quality.reasons.map((reason, index) =>
      repository.saveQualityEvent({
        id: `${quoteId}:quality:${index}`,
        dailyQuoteId: quoteId,
        ruleId: reason.includes('missing')
          ? 'G0-MISSING-FIELD'
          : 'G3-INSTRUMENT-FILTER',
        severity: 'error',
        observedAt: now().toISOString(),
        createdAt: now().toISOString(),
        reason,
      })
    )
    trace.push({
      stage: 'quality',
      status: quality.status === 'passed' ? 'succeeded' : 'failed',
      at: now().toISOString(),
      detail: quality.reasons.join('; ') || 'passed',
    })
    await options.afterStage?.('quality')

    currentStage = 'calculation'
    const metrics = calculateMetrics(payload.close, payload.nav, payload.volume)
    trace.push({
      stage: 'calculation',
      status: quality.status === 'passed' ? 'succeeded' : 'failed',
      at: now().toISOString(),
      detail:
        quality.status === 'passed'
          ? 'metrics calculated'
          : 'blocked by quality gate',
    })
    await options.afterStage?.('calculation')

    currentStage = 'read_model'
    const score = quality.status === 'passed' ? scoreMetrics(metrics) : null
    const readModel =
      quality.status === 'passed'
        ? {
            instrumentId: payload.instrumentId,
            ticker: payload.ticker,
            name: payload.name,
            asOf: payload.asOf,
            snapshotId: snapshot.id,
            qualityStatus: quality.status,
            recommendationAllowed: true,
            strategyVersion: STRATEGY_VERSION,
            score,
            metrics,
            thesis: buildThesis(metrics),
          }
        : blockedReadModel(payload, snapshot.id, 'blocked', metrics)
    trace.push({
      stage: 'read_model',
      status: quality.status === 'passed' ? 'succeeded' : 'failed',
      at: now().toISOString(),
      detail: readModel.recommendationAllowed
        ? 'recommendation ready'
        : 'recommendation blocked',
    })
    await options.afterStage?.('read_model')

    const finishedRun = repository.finishRun(
      run.id,
      'succeeded',
      now().toISOString()
    )
    return {
      ingestionRun: finishedRun,
      rawSnapshot: snapshot,
      etfMaster: master,
      dailyQuote: quote,
      qualityEvents,
      readModel,
      trace,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    repository.finishRun(
      run.id,
      'failed',
      now().toISOString(),
      `${currentStage}: ${reason}`
    )
    throw reason.startsWith(`${currentStage}:`)
      ? new Error(reason)
      : stageError(currentStage, reason)
  }
}

export async function runKoreanSingleEtfFromSource(
  request: { ticker: string; asOf: string },
  source: KoreanEtfSource,
  repository: PipelineRepository,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const input = await source.fetch(request)
  return runKoreanSingleEtfPipeline(input, repository, options)
}
