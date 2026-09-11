import { z } from 'zod'

export const UNIVERSE_FILTER_VERSION = 'korean-etf-universe-v1'

const masterCandidateSchema = z.object({
  instrumentId: z.string().min(1),
  ticker: z.string().regex(/^\d{6}$/),
  name: z.string().min(1),
  market: z.literal('KR'),
  instrumentType: z.enum(['ETF', 'ETN']),
  isLeveragedOrInverse: z.boolean(),
  listedAt: z.string().date(),
  averageDailyTradingValue: z.number().finite().nonnegative(),
})

const dailyQuoteSchema = z.object({
  ticker: z.string().regex(/^\d{6}$/),
  asOf: z.string().date(),
  close: z.number().finite().nonnegative().nullable(),
  volume: z.number().finite().nonnegative().nullable(),
  tradeValue: z.number().finite().nonnegative().nullable(),
  fxRate: z.literal(1),
  dividend: z.number().finite().nonnegative().nullable(),
})

export interface EtfMasterCandidate {
  instrumentId: string
  ticker: string
  name: string
  market: 'KR'
  instrumentType: 'ETF' | 'ETN'
  isLeveragedOrInverse: boolean
  listedAt: string
  averageDailyTradingValue: number
}

export interface UniverseFilterConfig {
  version: string
  asOf: string
  minimumListingAgeDays: number
  minimumAverageDailyTradingValue: number
}

export interface UniverseFilterDecision {
  instrumentId: string
  ticker: string
  accepted: boolean
  filterVersion: string
  reason: string
}

export interface DailyQuoteInput {
  ticker: string
  asOf: string
  close: number | null
  volume: number | null
  tradeValue: number | null
  fxRate: 1
  dividend: number | null
}

export interface DailyQuoteRecord extends DailyQuoteInput {
  instrumentId: string
  source: 'kiwoom' | 'krx' | 'csv'
  fetchedAt: string
}

export interface DailyQualityFlag {
  ticker: string
  asOf: string
  ruleId:
    | 'PRICE_JUMP_30_PERCENT'
    | 'MISSING_THREE_BUSINESS_DAYS'
    | 'MISSING_TRADE_VALUE'
    | 'COLLECTION_FAILED'
  severity: 'warning' | 'error'
  reason: string
}

export interface CollectionAttempt {
  ticker: string
  attempt: number
  status: 'succeeded' | 'failed'
  at: string
  reason: string | null
}

export interface CollectionRun {
  id: string
  asOf: string
  startedAt: string
  finishedAt: string | null
  status: 'running' | 'succeeded' | 'partial' | 'failed'
  attempts: CollectionAttempt[]
}

export interface QualityDashboardReadModel {
  asOf: string
  filterVersion: string
  totalCandidates: number
  acceptedCandidates: number
  excludedCandidates: number
  quoteSuccesses: number
  quoteFailures: number
  flaggedQuotes: number
  flagCounts: Record<DailyQualityFlag['ruleId'], number>
  sampleMismatchRate: number | null
}

export interface CollectionResult {
  run: CollectionRun
  decisions: UniverseFilterDecision[]
  quotes: DailyQuoteRecord[]
  flags: DailyQualityFlag[]
  dashboard: QualityDashboardReadModel
}

export interface CollectionRepository {
  startRun(asOf: string, startedAt: string): CollectionRun
  recordAttempt(attempt: CollectionAttempt): void
  saveQuote(quote: DailyQuoteRecord): void
  saveFlag(flag: DailyQualityFlag): void
  finishRun(
    runId: string,
    status: CollectionRun['status'],
    finishedAt: string
  ): CollectionRun
}

export class InMemoryCollectionRepository implements CollectionRepository {
  private readonly runs = new Map<string, CollectionRun>()
  readonly quotes: DailyQuoteRecord[] = []
  readonly flags: DailyQualityFlag[] = []

  startRun(asOf: string, startedAt: string): CollectionRun {
    const run: CollectionRun = {
      id: `daily:${asOf}:${this.runs.size + 1}`,
      asOf,
      startedAt,
      finishedAt: null,
      status: 'running',
      attempts: [],
    }
    this.runs.set(run.id, run)
    return run
  }

  recordAttempt(attempt: CollectionAttempt) {
    const run = [...this.runs.values()].at(-1)
    if (!run) throw new Error('No active collection run')
    run.attempts.push(attempt)
  }

  saveQuote(quote: DailyQuoteRecord) {
    const index = this.quotes.findIndex(
      existing =>
        existing.ticker === quote.ticker && existing.asOf === quote.asOf
    )
    if (index >= 0) this.quotes[index] = quote
    else this.quotes.push(quote)
  }

  saveFlag(flag: DailyQualityFlag) {
    if (
      !this.flags.some(
        existing =>
          existing.ticker === flag.ticker &&
          existing.asOf === flag.asOf &&
          existing.ruleId === flag.ruleId
      )
    ) {
      this.flags.push(flag)
    }
  }

  finishRun(
    runId: string,
    status: CollectionRun['status'],
    finishedAt: string
  ) {
    const run = this.runs.get(runId)
    if (!run) throw new Error(`Unknown collection run: ${runId}`)
    run.status = status
    run.finishedAt = finishedAt
    return run
  }
}

export function normalizeMasterCandidates(
  candidates: unknown[]
): EtfMasterCandidate[] {
  return candidates.map(candidate => masterCandidateSchema.parse(candidate))
}

function daysBetween(start: string, end: string): number {
  return Math.floor(
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
      86_400_000
  )
}

export function filterUniverse(
  candidates: EtfMasterCandidate[],
  config: UniverseFilterConfig
): UniverseFilterDecision[] {
  if (
    config.minimumListingAgeDays < 0 ||
    config.minimumAverageDailyTradingValue < 0
  ) {
    throw new Error('Universe filter thresholds must be non-negative')
  }
  return candidates.map(candidate => {
    const reason =
      candidate.instrumentType === 'ETN'
        ? 'ETN is excluded'
        : candidate.isLeveragedOrInverse
          ? 'leveraged or inverse ETF is excluded'
          : daysBetween(candidate.listedAt, config.asOf) <
              config.minimumListingAgeDays
            ? 'listing age is below the minimum'
            : candidate.averageDailyTradingValue <
                config.minimumAverageDailyTradingValue
              ? 'average daily trading value is below the minimum'
              : 'accepted'
    return {
      instrumentId: candidate.instrumentId,
      ticker: candidate.ticker,
      accepted: reason === 'accepted',
      filterVersion: config.version,
      reason,
    }
  })
}

export function normalizeDailyQuote(value: unknown): DailyQuoteInput {
  return dailyQuoteSchema.parse(value)
}

export function qualityFlags(
  quote: DailyQuoteInput,
  previousQuotes: DailyQuoteInput[]
): DailyQualityFlag[] {
  const flags: DailyQualityFlag[] = []
  const previous = previousQuotes.at(-1)
  if (
    previous?.close !== null &&
    previous?.close !== undefined &&
    previous.close > 0 &&
    quote.close !== null &&
    Math.abs((quote.close - previous.close) / previous.close) >= 0.3
  ) {
    flags.push({
      ticker: quote.ticker,
      asOf: quote.asOf,
      ruleId: 'PRICE_JUMP_30_PERCENT',
      severity: 'error',
      reason: 'close changed by at least 30% from the previous quote',
    })
  }
  const recent = [...previousQuotes.slice(-2), quote]
  if (recent.length === 3 && recent.every(item => item.close === null)) {
    flags.push({
      ticker: quote.ticker,
      asOf: quote.asOf,
      ruleId: 'MISSING_THREE_BUSINESS_DAYS',
      severity: 'error',
      reason: 'close is missing for three consecutive business days',
    })
  }
  if (quote.tradeValue === null) {
    flags.push({
      ticker: quote.ticker,
      asOf: quote.asOf,
      ruleId: 'MISSING_TRADE_VALUE',
      severity: 'warning',
      reason: 'trade value is missing',
    })
  }
  return flags
}

export const DG2_SAMPLE_SIZE = 30
export const DG2_SAMPLE_SELECTOR_VERSION = 'dg2-kiwoom-trade-value-top-30-v1'

const dg2SampleAsOfSchema = z.string().date()

export interface Dg2SampleMember {
  ticker: string
  instrumentId: string
  tradeValue: number
  rank: number
}

export interface Dg2SampleSelection {
  asOf: string
  source: 'kiwoom'
  sampleSize: number
  selectorVersion: string
  members: Dg2SampleMember[]
}

export function selectDg2SampleByTradeValue(
  decisions: UniverseFilterDecision[],
  quotes: DailyQuoteRecord[],
  asOf: string
): Dg2SampleSelection {
  dg2SampleAsOfSchema.parse(asOf)

  const seenTickers = new Set<string>()
  for (const quote of quotes) {
    if (seenTickers.has(quote.ticker)) {
      throw new Error(
        `duplicate ticker in DG2 sample candidates: ${quote.ticker}`
      )
    }
    seenTickers.add(quote.ticker)
  }

  const acceptedTickers = new Set(
    decisions
      .filter(decision => decision.accepted)
      .map(decision => decision.ticker)
  )
  const quotesByTicker = new Map(quotes.map(quote => [quote.ticker, quote]))

  const validCandidates: Omit<Dg2SampleMember, 'rank'>[] = []
  for (const ticker of acceptedTickers) {
    const quote = quotesByTicker.get(ticker)
    if (!quote) {
      throw new Error(
        `missing Kiwoom quote for accepted DG2 candidate: ${ticker}`
      )
    }
    if (quote.source !== 'kiwoom') {
      throw new Error(
        `non-Kiwoom quote source for accepted DG2 candidate: ${ticker}`
      )
    }
    if (quote.asOf !== asOf) {
      throw new Error(
        `quote asOf does not match the declared DG2 sample date for accepted candidate: ${ticker}`
      )
    }
    if (
      quote.tradeValue === null ||
      !Number.isFinite(quote.tradeValue) ||
      quote.tradeValue < 0
    ) {
      throw new Error(
        `missing or invalid trade value for accepted DG2 candidate: ${ticker}`
      )
    }
    validCandidates.push({
      ticker: quote.ticker,
      instrumentId: quote.instrumentId,
      tradeValue: quote.tradeValue,
    })
  }

  if (validCandidates.length < DG2_SAMPLE_SIZE) {
    throw new Error(
      `insufficient eligible Kiwoom quotes for the DG2 sample: expected at least ${DG2_SAMPLE_SIZE}, received ${validCandidates.length}`
    )
  }

  const sorted = [...validCandidates].sort((a, b) => {
    if (a.tradeValue !== b.tradeValue) return b.tradeValue - a.tradeValue
    if (a.ticker < b.ticker) return -1
    if (a.ticker > b.ticker) return 1
    return 0
  })

  return {
    asOf,
    source: 'kiwoom',
    sampleSize: DG2_SAMPLE_SIZE,
    selectorVersion: DG2_SAMPLE_SELECTOR_VERSION,
    members: sorted.slice(0, DG2_SAMPLE_SIZE).map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    })),
  }
}

export function calculateSampleMismatchRate(
  expected: Array<{ ticker: string; close: number }>,
  observed: Array<{ ticker: string; close: number }>,
  tolerance = 0.001
): number {
  if (expected.length === 0) return 0
  const observedByTicker = new Map(
    observed.map(item => [item.ticker, item.close])
  )
  const mismatches = expected.filter(item => {
    const actual = observedByTicker.get(item.ticker)
    if (actual === undefined) return true
    if (item.close === 0) return actual !== 0
    return Math.abs(actual - item.close) / item.close > tolerance
  }).length
  return mismatches / expected.length
}

export async function collectDailyQuotes(
  candidates: EtfMasterCandidate[],
  config: UniverseFilterConfig,
  fetchQuote: (candidate: EtfMasterCandidate, asOf: string) => Promise<unknown>,
  repository: CollectionRepository,
  options: {
    maxAttempts?: number
    now?: () => Date
    previousQuotes?: Map<string, DailyQuoteInput[]>
  } = {}
): Promise<CollectionResult> {
  const now = options.now ?? (() => new Date())
  const maxAttempts = options.maxAttempts ?? 3
  if (maxAttempts < 1) throw new Error('maxAttempts must be at least 1')
  const decisions = filterUniverse(candidates, config)
  const run = repository.startRun(config.asOf, now().toISOString())
  const quotes: DailyQuoteRecord[] = []
  const flags: DailyQualityFlag[] = []
  for (const candidate of candidates.filter(
    candidate =>
      decisions.find(
        decision => decision.instrumentId === candidate.instrumentId
      )?.accepted
  )) {
    let succeeded = false
    for (let attempt = 1; attempt <= maxAttempts && !succeeded; attempt += 1) {
      try {
        const normalized = normalizeDailyQuote(
          await fetchQuote(candidate, config.asOf)
        )
        if (
          normalized.ticker !== candidate.ticker ||
          normalized.asOf !== config.asOf
        ) {
          throw new Error(
            'daily quote identity does not match the collection request'
          )
        }
        const record = {
          ...normalized,
          instrumentId: candidate.instrumentId,
          source: 'csv' as const,
          fetchedAt: now().toISOString(),
        }
        const currentFlags = qualityFlags(
          normalized,
          options.previousQuotes?.get(candidate.ticker) ?? []
        )
        repository.saveQuote(record)
        currentFlags.forEach(flag => repository.saveFlag(flag))
        quotes.push(record)
        flags.push(...currentFlags)
        repository.recordAttempt({
          ticker: candidate.ticker,
          attempt,
          status: 'succeeded',
          at: now().toISOString(),
          reason: null,
        })
        succeeded = true
      } catch (error) {
        repository.recordAttempt({
          ticker: candidate.ticker,
          attempt,
          status: 'failed',
          at: now().toISOString(),
          reason: error instanceof Error ? error.message : String(error),
        })
        if (attempt === maxAttempts) {
          const failureFlag: DailyQualityFlag = {
            ticker: candidate.ticker,
            asOf: config.asOf,
            ruleId: 'COLLECTION_FAILED',
            severity: 'error',
            reason: 'daily quote collection failed after all retries',
          }
          flags.push(failureFlag)
          repository.saveFlag(failureFlag)
        }
      }
    }
  }
  const successes = quotes.length
  const failures =
    candidates.filter(
      candidate =>
        decisions.find(
          decision => decision.instrumentId === candidate.instrumentId
        )?.accepted
    ).length - successes
  const finishedRun = repository.finishRun(
    run.id,
    failures === 0 ? 'succeeded' : successes === 0 ? 'failed' : 'partial',
    now().toISOString()
  )
  const flagCounts = {
    PRICE_JUMP_30_PERCENT: flags.filter(
      flag => flag.ruleId === 'PRICE_JUMP_30_PERCENT'
    ).length,
    MISSING_THREE_BUSINESS_DAYS: flags.filter(
      flag => flag.ruleId === 'MISSING_THREE_BUSINESS_DAYS'
    ).length,
    MISSING_TRADE_VALUE: flags.filter(
      flag => flag.ruleId === 'MISSING_TRADE_VALUE'
    ).length,
    COLLECTION_FAILED: flags.filter(flag => flag.ruleId === 'COLLECTION_FAILED')
      .length,
  }
  return {
    run: finishedRun,
    decisions,
    quotes,
    flags,
    dashboard: {
      asOf: config.asOf,
      filterVersion: config.version,
      totalCandidates: candidates.length,
      acceptedCandidates: decisions.filter(decision => decision.accepted)
        .length,
      excludedCandidates: decisions.filter(decision => !decision.accepted)
        .length,
      quoteSuccesses: successes,
      quoteFailures: failures,
      flaggedQuotes: new Set(flags.map(flag => `${flag.ticker}:${flag.asOf}`))
        .size,
      flagCounts,
      sampleMismatchRate: null,
    },
  }
}
