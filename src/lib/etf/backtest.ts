import type { StrategyName } from './strategy.ts'

export const BACKTEST_VERSION = 'backtest-v0.1'

export interface BacktestObservation {
  ticker: string
  market: 'KR' | 'US'
  industry: string
  period: string
  strategy: StrategyName
  strategyVersion: string
  signalAsOf: string
  evaluationEnd: string
  percentile: number
  passesFilter: boolean
  liquidityScore: number
  priceReturnLocal: number
  fxReturn: number
  dividendReturn: number
  benchmarkReturnKrw: number
}

export interface KrwReturnBreakdown {
  priceReturnLocal: number
  fxContribution: number
  dividendContribution: number
  totalReturnKrw: number
}

export interface BacktestConfig {
  percentileCutoff: number
  liquidityMinimum: number
}

export interface BacktestResult {
  backtestVersion: string
  strategy: StrategyName
  strategyVersion: string
  config: BacktestConfig
  observationCount: number
  eligibleCount: number
  selectedCount: number
  selectedTickers: string[]
  strategyReturnKrw: number
  benchmarkReturnKrw: number
  excessReturnKrw: number
  hitRate: number
  averageFxContribution: number
  averageDividendContribution: number
  industries: string[]
  periods: string[]
  overfitWarnings: string[]
}

export interface SensitivityResult {
  strategy: StrategyName
  percentileCutoff: number
  liquidityMinimum: number
  selectedCount: number
  excessReturnKrw: number
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length
}

function validateObservation(observation: BacktestObservation): void {
  const bounded = [observation.percentile, observation.liquidityScore]
  if (
    bounded.some(value => !Number.isFinite(value) || value < 0 || value > 100)
  ) {
    throw new Error(
      `Backtest ranking inputs must be between 0 and 100: ${observation.ticker}`
    )
  }
  if (observation.evaluationEnd <= observation.signalAsOf) {
    throw new Error(
      `Backtest outcome must be after signal date: ${observation.ticker}`
    )
  }
  if (observation.strategyVersion.trim().length === 0) {
    throw new Error(
      `Backtest strategy version is required: ${observation.ticker}`
    )
  }
}

export function calculateKrwReturn(
  observation: Pick<
    BacktestObservation,
    'priceReturnLocal' | 'fxReturn' | 'dividendReturn'
  >
): KrwReturnBreakdown {
  const priceReturnLocal = observation.priceReturnLocal
  const fxContribution =
    (1 + priceReturnLocal) * (1 + observation.fxReturn) - (1 + priceReturnLocal)
  const beforeDividend = (1 + priceReturnLocal) * (1 + observation.fxReturn)
  const dividendContribution = beforeDividend * observation.dividendReturn
  return {
    priceReturnLocal: round(priceReturnLocal),
    fxContribution: round(fxContribution),
    dividendContribution: round(dividendContribution),
    totalReturnKrw: round(
      beforeDividend * (1 + observation.dividendReturn) - 1
    ),
  }
}

function warnings(
  selected: BacktestObservation[],
  allEligible: BacktestObservation[],
  result: Pick<BacktestResult, 'strategyReturnKrw' | 'benchmarkReturnKrw'>
): string[] {
  const output: string[] = []
  const industryCounts = new Map<string, number>()
  selected.forEach(observation => {
    industryCounts.set(
      observation.industry,
      (industryCounts.get(observation.industry) ?? 0) + 1
    )
  })
  const dominantIndustry = [...industryCounts.entries()].sort(
    (left, right) => right[1] - left[1]
  )[0]
  if (
    selected.length >= 3 &&
    dominantIndustry &&
    dominantIndustry[1] / selected.length > 0.8
  ) {
    output.push(`industry concentration: ${dominantIndustry[0]}`)
  }
  const markets = new Set(selected.map(observation => observation.market))
  if (selected.length >= 3 && markets.size === 1) {
    output.push('market concentration: selected candidates cover one market')
  }
  if (
    allEligible.length > 0 &&
    selected.length >= 3 &&
    result.strategyReturnKrw > result.benchmarkReturnKrw &&
    selected.every(observation => observation.period === selected[0]?.period)
  ) {
    output.push('period concentration: outperformance comes from one period')
  }
  return output
}

export function runBacktest(
  observations: BacktestObservation[],
  strategy: StrategyName,
  config: BacktestConfig
): BacktestResult {
  if (
    config.percentileCutoff < 0 ||
    config.percentileCutoff > 100 ||
    config.liquidityMinimum < 0 ||
    config.liquidityMinimum > 100
  ) {
    throw new Error('Backtest cutoffs must be between 0 and 100')
  }
  observations.forEach(validateObservation)
  const scoped = observations.filter(
    observation => observation.strategy === strategy
  )
  const strategyVersions = new Set(
    scoped.map(observation => observation.strategyVersion)
  )
  if (strategyVersions.size > 1) {
    throw new Error(`Mixed strategy versions are not allowed: ${strategy}`)
  }
  const eligible = scoped.filter(
    observation =>
      observation.passesFilter &&
      observation.liquidityScore >= config.liquidityMinimum
  )
  const selected = eligible.filter(
    observation => observation.percentile >= config.percentileCutoff
  )
  const selectedReturns = selected.map(calculateKrwReturn)
  const strategyReturnKrw = average(
    selectedReturns.map(item => item.totalReturnKrw)
  )
  const benchmarkReturnKrw = average(
    eligible.map(observation => observation.benchmarkReturnKrw)
  )
  const hitRate =
    selected.length === 0
      ? 0
      : selectedReturns.filter(item => item.totalReturnKrw > 0).length /
        selected.length
  const strategyVersion = [...strategyVersions][0] ?? 'unknown'
  const result: BacktestResult = {
    backtestVersion: BACKTEST_VERSION,
    strategy,
    strategyVersion,
    config,
    observationCount: scoped.length,
    eligibleCount: eligible.length,
    selectedCount: selected.length,
    selectedTickers: selected.map(observation => observation.ticker),
    strategyReturnKrw: round(strategyReturnKrw),
    benchmarkReturnKrw: round(benchmarkReturnKrw),
    excessReturnKrw: round(strategyReturnKrw - benchmarkReturnKrw),
    hitRate: round(hitRate),
    averageFxContribution: round(
      average(selectedReturns.map(item => item.fxContribution))
    ),
    averageDividendContribution: round(
      average(selectedReturns.map(item => item.dividendContribution))
    ),
    industries: [
      ...new Set(selected.map(observation => observation.industry)),
    ].sort(),
    periods: [
      ...new Set(selected.map(observation => observation.period)),
    ].sort(),
    overfitWarnings: [],
  }
  result.overfitWarnings = warnings(selected, eligible, result)
  return result
}

export function runSensitivity(
  observations: BacktestObservation[],
  strategy: StrategyName,
  percentileCutoffs: number[],
  liquidityMinimums: number[]
): SensitivityResult[] {
  return percentileCutoffs.flatMap(percentileCutoff =>
    liquidityMinimums.map(liquidityMinimum => {
      const result = runBacktest(observations, strategy, {
        percentileCutoff,
        liquidityMinimum,
      })
      return {
        strategy,
        percentileCutoff,
        liquidityMinimum,
        selectedCount: result.selectedCount,
        excessReturnKrw: result.excessReturnKrw,
      }
    })
  )
}
