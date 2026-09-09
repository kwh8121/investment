import {
  runBacktest,
  type BacktestConfig,
  type BacktestObservation,
  type BacktestResult,
} from './backtest.ts'
import {
  normalizeDg3Observations,
  type Dg3RawObservation,
} from './dg3-evidence.ts'
import type { StrategyName } from './strategy.ts'

export const RISK_VERSION = 'risk-v0.1'

export interface RollingWindow {
  start: string
  end: string
}

export interface RollingBacktestConfig extends BacktestConfig {
  windows: RollingWindow[]
  transactionCostBps: number
  includeDelisted: boolean
}

export interface RollingBacktestResult {
  riskVersion: string
  strategy: StrategyName
  config: RollingBacktestConfig
  windows: Array<RollingWindow & { result: BacktestResult }>
  costBeforeReturnKrw: number
  costAfterReturnKrw: number
  survivorshipBiasNote: string
}

export interface PortfolioPoint {
  asOf: string
  returnKrw: number
  benchmarkReturnKrw: number
  turnover: number
  fxContribution: number
  dividendContribution: number
  market: 'KR' | 'US'
  industry: string
}

export interface RiskMetrics {
  maxDrawdown: number
  recoveryDays: number | null
  turnover: number
  benchmarkExcess: number
  fxDependence: number
  dividendContribution: number
  marketConcentration: number
  industryConcentration: number
}

export interface RiskPosition {
  ticker: string
  market: 'KR' | 'US'
  industry: string
  weight: number
  amountKrw: number
  individualRiskPct: number
}

export interface RiskLimits {
  capitalKrw: number
  maxPositionWeight: number
  maxPositionAmountKrw: number
  maxPositions: number
  maxInvestedWeight: number
  maxUsWeight: number
  maxIndividualRiskPct: number
}

export interface RiskLimitResult {
  passed: boolean
  violations: string[]
  investedWeight: number
  usWeight: number
}

export type LossStage = 'normal' | 'risk-alert' | 'reduce-risk' | 'hard-stop'

export interface LossStageResult {
  lossPct: number
  stage: LossStage
  action: string
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

function ensureDateRange(range: RollingWindow): void {
  if (range.end <= range.start) {
    throw new Error('Rolling window end must be after start')
  }
}

function ensureCostBps(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Transaction cost must be a non-negative finite number')
  }
}

export function runRollingBacktest(
  observations: BacktestObservation[],
  strategy: StrategyName,
  config: RollingBacktestConfig
): RollingBacktestResult {
  ensureCostBps(config.transactionCostBps)
  if (config.windows.length === 0)
    throw new Error('At least one window is required')
  config.windows.forEach(ensureDateRange)
  const windows = config.windows.map(window => {
    const scoped = observations.filter(
      observation =>
        observation.strategy === strategy &&
        observation.signalAsOf >= window.start &&
        observation.evaluationEnd <= window.end
    )
    return { ...window, result: runBacktest(scoped, strategy, config) }
  })
  const costRate = config.transactionCostBps / 10_000
  const costBeforeReturnKrw =
    windows.reduce((sum, window) => sum + window.result.strategyReturnKrw, 0) /
    windows.length
  return {
    riskVersion: RISK_VERSION,
    strategy,
    config,
    windows,
    costBeforeReturnKrw: round(costBeforeReturnKrw),
    costAfterReturnKrw: round(costBeforeReturnKrw - costRate),
    survivorshipBiasNote: config.includeDelisted
      ? 'Delisted instruments are included in the supplied observation set.'
      : 'Delisted instruments are not included; results may contain survivorship bias.',
  }
}

export function runRollingBacktestFromDg3Evidence(
  rows: Dg3RawObservation[],
  strategy: StrategyName,
  config: RollingBacktestConfig
): RollingBacktestResult {
  return runRollingBacktest(normalizeDg3Observations(rows), strategy, config)
}

function maxDrawdown(returns: number[]): { value: number; trough: number } {
  let wealth = 1
  let peak = 1
  let drawdown = 0
  let trough = 0
  returns.forEach((value, index) => {
    wealth *= 1 + value
    if (wealth > peak) peak = wealth
    const current = wealth / peak - 1
    if (current < drawdown) {
      drawdown = current
      trough = index
    }
  })
  return { value: round(drawdown), trough }
}

export function calculateRiskMetrics(points: PortfolioPoint[]): RiskMetrics {
  if (points.length === 0)
    throw new Error('At least one portfolio point is required')
  for (let index = 1; index < points.length; index += 1) {
    if (points[index]!.asOf <= points[index - 1]!.asOf) {
      throw new Error('Portfolio points must be strictly ordered by asOf')
    }
  }
  const drawdown = maxDrawdown(points.map(point => point.returnKrw))
  let wealth = 1
  let peak = 1
  let peakIndex = 0
  let recoveryDays: number | null = null
  points.forEach((point, index) => {
    wealth *= 1 + point.returnKrw
    if (wealth >= peak) {
      if (index > drawdown.trough && recoveryDays === null) {
        recoveryDays = Math.round(
          (Date.parse(point.asOf) - Date.parse(points[peakIndex]!.asOf)) /
            86_400_000
        )
      }
      peak = wealth
      peakIndex = index
    }
  })
  const totalAbsReturn = points.reduce(
    (sum, point) => sum + Math.abs(point.returnKrw),
    0
  )
  const marketWeights = new Map<string, number>()
  const industryWeights = new Map<string, number>()
  points.forEach(point => {
    marketWeights.set(point.market, (marketWeights.get(point.market) ?? 0) + 1)
    industryWeights.set(
      point.industry,
      (industryWeights.get(point.industry) ?? 0) + 1
    )
  })
  const maxShare = (values: Map<string, number>): number =>
    Math.max(...values.values()) / points.length
  return {
    maxDrawdown: drawdown.value,
    recoveryDays,
    turnover: round(points.reduce((sum, point) => sum + point.turnover, 0)),
    benchmarkExcess: round(
      points.reduce(
        (sum, point) => sum + point.returnKrw - point.benchmarkReturnKrw,
        0
      )
    ),
    fxDependence: round(
      points.reduce((sum, point) => sum + Math.abs(point.fxContribution), 0) /
        Math.max(totalAbsReturn, 0.0001)
    ),
    dividendContribution: round(
      points.reduce((sum, point) => sum + point.dividendContribution, 0)
    ),
    marketConcentration: round(maxShare(marketWeights)),
    industryConcentration: round(maxShare(industryWeights)),
  }
}

export function validateRiskLimits(
  positions: RiskPosition[],
  limits: RiskLimits
): RiskLimitResult {
  const violations: string[] = []
  if (limits.capitalKrw <= 0) violations.push('capital must be positive')
  if (positions.length > limits.maxPositions) {
    violations.push(`position count exceeds ${limits.maxPositions}`)
  }
  const investedWeight = positions.reduce(
    (sum, position) => sum + position.weight,
    0
  )
  const usWeight = positions
    .filter(position => position.market === 'US')
    .reduce((sum, position) => sum + position.weight, 0)
  if (investedWeight > limits.maxInvestedWeight) {
    violations.push('invested weight exceeds limit')
  }
  if (usWeight > limits.maxUsWeight)
    violations.push('US ETF weight exceeds limit')
  positions.forEach(position => {
    if (position.weight > limits.maxPositionWeight) {
      violations.push(`${position.ticker} position weight exceeds limit`)
    }
    if (position.amountKrw > limits.maxPositionAmountKrw) {
      violations.push(`${position.ticker} position amount exceeds limit`)
    }
    if (position.individualRiskPct > limits.maxIndividualRiskPct) {
      violations.push(`${position.ticker} individual risk exceeds limit`)
    }
  })
  return {
    passed: violations.length === 0,
    violations,
    investedWeight: round(investedWeight),
    usWeight: round(usWeight),
  }
}

export function classifyLossStage(lossPct: number): LossStageResult {
  if (!Number.isFinite(lossPct) || lossPct < 0) {
    throw new Error('lossPct must be a non-negative finite percentage')
  }
  if (lossPct >= 20) {
    return {
      lossPct,
      stage: 'hard-stop',
      action: 'stop new entries and exit per policy',
    }
  }
  if (lossPct >= 15) {
    return {
      lossPct,
      stage: 'hard-stop',
      action: 'stop new entries and reduce risk',
    }
  }
  if (lossPct >= 10) {
    return {
      lossPct,
      stage: 'reduce-risk',
      action: 'reduce exposure and review thesis',
    }
  }
  if (lossPct >= 8) {
    return {
      lossPct,
      stage: 'risk-alert',
      action: 'freeze additions and review risk',
    }
  }
  return { lossPct, stage: 'normal', action: 'continue monitoring' }
}
