import type { StrategyEvaluation, StrategyName } from './strategy.ts'

export type RecommendationStatus =
  | '신규'
  | '유지'
  | '강화'
  | '관찰'
  | '약화'
  | '제외'

export type RadarStatus = '승격' | '유지' | '강등' | '관찰'

export interface ScannerCandidate {
  evaluation: StrategyEvaluation
  industry: string
  coreIndustry: string
  thesisValid: boolean
  overlapRatio: number
  portfolioCorrelation: number
  radarQualified: boolean
  radarEvidence: string
}

export interface ScannerConfig {
  maxOverlapRatio: number
  maxPortfolioCorrelation: number
  maxSameCoreIndustry: number
}

export interface ScannerWeek {
  week: string
  candidates: ScannerCandidate[]
  top3: ScannerCandidate[]
}

export interface Top3Entry {
  ticker: string
  strategy: StrategyName
  rank: number
  status: RecommendationStatus
  percentile: number
  reason: string
}

export interface ChallengerEntry {
  ticker: string
  percentile: number
  reason: string
}

export interface RadarEntry {
  ticker: string
  status: RadarStatus
  evidence: string
}

export interface ScannerReport {
  week: string
  strategy: StrategyName
  top3: Top3Entry[]
  challengers: ChallengerEntry[]
  dropped: Top3Entry[]
  excluded: Array<{ ticker: string; reasons: string[] }>
  radar: RadarEntry[]
}

const DEFAULT_CONFIG: ScannerConfig = {
  maxOverlapRatio: 0.5,
  maxPortfolioCorrelation: 0.8,
  maxSameCoreIndustry: 1,
}

function validateCandidate(candidate: ScannerCandidate): void {
  if (
    !Number.isFinite(candidate.overlapRatio) ||
    candidate.overlapRatio < 0 ||
    candidate.overlapRatio > 1
  ) {
    throw new Error(`Invalid overlap ratio: ${candidate.evaluation.ticker}`)
  }
  if (
    !Number.isFinite(candidate.portfolioCorrelation) ||
    candidate.portfolioCorrelation < -1 ||
    candidate.portfolioCorrelation > 1
  ) {
    throw new Error(
      `Invalid portfolio correlation: ${candidate.evaluation.ticker}`
    )
  }
  if (candidate.radarQualified && !candidate.radarEvidence.trim()) {
    throw new Error(
      `Radar evidence is required: ${candidate.evaluation.ticker}`
    )
  }
}

function candidateReasons(
  candidate: ScannerCandidate,
  config: ScannerConfig
): string[] {
  const reasons = [...candidate.evaluation.exclusionReasons]
  if (!candidate.thesisValid) reasons.push('G1: thesis is invalid')
  if (candidate.overlapRatio > config.maxOverlapRatio) {
    reasons.push('G4: portfolio overlap limit exceeded')
  }
  if (candidate.portfolioCorrelation > config.maxPortfolioCorrelation) {
    reasons.push('G4: portfolio correlation limit exceeded')
  }
  return reasons
}

function eligibleCandidates(
  candidates: ScannerCandidate[],
  strategy: StrategyName,
  config: ScannerConfig
): { eligible: ScannerCandidate[]; excluded: ScannerReport['excluded'] } {
  const eligible: ScannerCandidate[] = []
  const excluded: ScannerReport['excluded'] = []
  for (const candidate of candidates) {
    validateCandidate(candidate)
    if (candidate.evaluation.strategy !== strategy) {
      throw new Error(
        `Mixed strategies are not allowed in one scanner: ${candidate.evaluation.ticker}`
      )
    }
    const reasons = candidateReasons(candidate, config)
    if (reasons.length > 0) {
      excluded.push({ ticker: candidate.evaluation.ticker, reasons })
    } else {
      eligible.push(candidate)
    }
  }
  return { eligible, excluded }
}

function selectTop3(
  candidates: ScannerCandidate[],
  config: ScannerConfig
): ScannerCandidate[] {
  const sorted = [...candidates].sort(
    (left, right) => right.evaluation.percentile - left.evaluation.percentile
  )
  const counts = new Map<string, number>()
  const selected: ScannerCandidate[] = []
  for (const candidate of sorted) {
    const count = counts.get(candidate.coreIndustry) ?? 0
    if (count >= config.maxSameCoreIndustry) continue
    selected.push(candidate)
    counts.set(candidate.coreIndustry, count + 1)
    if (selected.length === 3) break
  }
  return selected
}

function twoWeekReplacement(
  candidate: ScannerCandidate,
  previous: ScannerWeek,
  twoWeeksAgo: ScannerWeek | undefined
): boolean {
  if (!twoWeeksAgo) return false
  const previousThird = previous.top3[2]
  const twoWeeksAgoThird = twoWeeksAgo.top3[2]
  const previousCandidate = previous.candidates.find(
    item => item.evaluation.ticker === candidate.evaluation.ticker
  )
  const oldCandidate = twoWeeksAgo.candidates.find(
    item => item.evaluation.ticker === candidate.evaluation.ticker
  )
  return Boolean(
    previousThird &&
      twoWeeksAgoThird &&
      previousCandidate &&
      oldCandidate &&
      candidate.evaluation.percentile > previousThird.evaluation.percentile &&
      previousCandidate.evaluation.percentile >
        twoWeeksAgoThird.evaluation.percentile &&
      oldCandidate.evaluation.percentile > 0
  )
}

function radarEntries(
  current: ScannerCandidate[],
  previous: ScannerCandidate[] | undefined
): RadarEntry[] {
  const previousByTicker = new Map(
    (previous ?? []).map(candidate => [candidate.evaluation.ticker, candidate])
  )
  return current
    .filter(
      candidate =>
        candidate.radarQualified ||
        previousByTicker.get(candidate.evaluation.ticker)?.radarQualified
    )
    .map(candidate => {
      const wasQualified =
        previousByTicker.get(candidate.evaluation.ticker)?.radarQualified ??
        false
      return {
        ticker: candidate.evaluation.ticker,
        status: candidate.radarQualified
          ? wasQualified
            ? '유지'
            : '승격'
          : '강등',
        evidence:
          candidate.radarEvidence || 'radar qualification no longer met',
      }
    })
}

export function scanStrategy(
  current: ScannerWeek,
  strategy: StrategyName,
  previous?: ScannerWeek,
  twoWeeksAgo?: ScannerWeek,
  config: ScannerConfig = DEFAULT_CONFIG
): ScannerReport {
  if (config.maxSameCoreIndustry < 1) {
    throw new Error('maxSameCoreIndustry must be at least 1')
  }
  const { eligible, excluded } = eligibleCandidates(
    current.candidates,
    strategy,
    config
  )
  const previousTop = previous?.top3 ?? []
  const previousTopByTicker = new Map(
    previousTop.map(candidate => [candidate.evaluation.ticker, candidate])
  )
  const previousEligible = new Set(
    (previous?.candidates ?? []).map(candidate => candidate.evaluation.ticker)
  )
  const selected = previous
    ? previousTop
        .map(candidate =>
          eligible.find(
            item => item.evaluation.ticker === candidate.evaluation.ticker
          )
        )
        .filter(
          (candidate): candidate is ScannerCandidate => candidate !== undefined
        )
    : selectTop3(eligible, config)
  const selectedTickers = new Set(
    selected.map(candidate => candidate.evaluation.ticker)
  )
  if (previous) {
    const replacements = eligible
      .filter(candidate => !selectedTickers.has(candidate.evaluation.ticker))
      .filter(candidate => twoWeekReplacement(candidate, previous, twoWeeksAgo))
      .sort(
        (left, right) =>
          right.evaluation.percentile - left.evaluation.percentile
      )
    for (const replacement of replacements) {
      if (selected.length < 3) break
      const weakestIndex = selected.reduce(
        (index, candidate, currentIndex, list) =>
          candidate.evaluation.percentile < list[index]!.evaluation.percentile
            ? currentIndex
            : index,
        0
      )
      const sameIndustryCount = selected.filter(
        (item, index) =>
          index !== weakestIndex &&
          item.coreIndustry === replacement.coreIndustry
      ).length
      if (
        sameIndustryCount < config.maxSameCoreIndustry &&
        replacement.evaluation.percentile >
          selected[weakestIndex]!.evaluation.percentile
      ) {
        selected[weakestIndex] = replacement
        selectedTickers.add(replacement.evaluation.ticker)
      }
    }
  }
  const top3 = selected
    .sort(
      (left, right) => right.evaluation.percentile - left.evaluation.percentile
    )
    .map((candidate, index): Top3Entry => {
      const ticker = candidate.evaluation.ticker
      const wasTop = previousTopByTicker.has(ticker)
      return {
        ticker,
        strategy,
        rank: index + 1,
        status: wasTop ? '유지' : previous ? '신규' : '신규',
        percentile: candidate.evaluation.percentile,
        reason: wasTop
          ? 'same strategy candidate retained'
          : 'qualified initial or approved replacement',
      }
    })
  const top3Set = new Set(top3.map(entry => entry.ticker))
  const challengers = eligible
    .filter(candidate => !top3Set.has(candidate.evaluation.ticker))
    .sort(
      (left, right) => right.evaluation.percentile - left.evaluation.percentile
    )
    .map(candidate => ({
      ticker: candidate.evaluation.ticker,
      percentile: candidate.evaluation.percentile,
      reason: previousEligible.has(candidate.evaluation.ticker)
        ? 'eligible but not in retained Top 3'
        : 'requires two consecutive weeks before replacement',
    }))
  const dropped = previousTop
    .filter(candidate => !top3Set.has(candidate.evaluation.ticker))
    .map((candidate, index) => ({
      ticker: candidate.evaluation.ticker,
      strategy,
      rank: index + 1,
      status: '제외' as const,
      percentile: candidate.evaluation.percentile,
      reason: 'no longer retained or failed current gates',
    }))
  return {
    week: current.week,
    strategy,
    top3,
    challengers,
    dropped,
    excluded,
    radar: radarEntries(current.candidates, previous?.candidates),
  }
}
