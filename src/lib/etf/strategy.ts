export const STRATEGY_VERSION = 'strategy-v0.2'
export const STRATEGY_PERCENTILE_CUTOFF = 95

export type StrategyName = 'momentum' | 'oversold'
export type GateName = 'G0' | 'G1' | 'G2' | 'G3' | 'G4'

export interface StrategyInput {
  ticker: string
  asOf: string
  valuationCurrency: 'KRW'
  universeFilterVersion: string
  qualityStatus: 'passed' | 'warning' | 'blocked'
  dataConfidence: number
  isEtf: boolean
  isLeveragedOrInverse: boolean
  fundamentalTriggerPassed: boolean
  thesisEvidence: string
  liquidityScore: number
  portfolioRiskPassed: boolean
  relativeStrength1M: number
  relativeStrength3M: number
  relativeStrength6M: number
  momentumAcceleration: number
  industryFundamental: number
  volumeLiquidity: number
  overheatRisk: number
  drawdownDepth: number
  drawdownDuration: number
  reversalSignal: number
  fundamentalRecovery: number
  structuralDamage: number
}

export interface ScoreComponents {
  relativeStrength?: number
  acceleration?: number
  industryFundamental?: number
  volumeLiquidity: number
  dataConfidence: number
  drawdown?: number
  reversal?: number
  fundamentalRecovery?: number
  riskPenalty: number
}

export interface GateResult {
  gate: GateName
  passed: boolean
  reason: string
}

export interface StrategyEvaluation {
  ticker: string
  asOf: string
  valuationCurrency: 'KRW'
  strategy: StrategyName
  strategyVersion: string
  universeFilterVersion: string
  components: ScoreComponents
  score: number
  percentile: number
  topFivePercent: boolean
  gates: GateResult[]
  accepted: boolean
  exclusionReasons: string[]
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function weightedAverage(parts: Array<[number, number]>): number {
  return parts.reduce(
    (total, [value, weight]) => total + clamp(value) * weight,
    0
  )
}

function validateInput(input: StrategyInput): void {
  if (input.valuationCurrency !== 'KRW') {
    throw new Error(`Strategy inputs must use KRW valuation: ${input.ticker}`)
  }
  const bounded = [
    input.dataConfidence,
    input.liquidityScore,
    input.relativeStrength1M,
    input.relativeStrength3M,
    input.relativeStrength6M,
    input.momentumAcceleration,
    input.industryFundamental,
    input.volumeLiquidity,
    input.overheatRisk,
    input.drawdownDepth,
    input.drawdownDuration,
    input.reversalSignal,
    input.fundamentalRecovery,
    input.structuralDamage,
  ]
  if (
    bounded.some(value => !Number.isFinite(value) || value < 0 || value > 100)
  ) {
    throw new Error(
      `Strategy inputs must be between 0 and 100: ${input.ticker}`
    )
  }
  if (!input.thesisEvidence.trim()) {
    throw new Error(`Thesis evidence is required: ${input.ticker}`)
  }
}

function calculateMomentum(input: StrategyInput): {
  score: number
  components: ScoreComponents
} {
  const relativeStrength = weightedAverage([
    [input.relativeStrength1M, 0.2],
    [input.relativeStrength3M, 0.3],
    [input.relativeStrength6M, 0.5],
  ])
  const riskPenalty = Math.min(20, input.overheatRisk * 0.2)
  return {
    score: clamp(
      relativeStrength * 0.3 +
        input.momentumAcceleration * 0.2 +
        input.industryFundamental * 0.25 +
        input.volumeLiquidity * 0.15 +
        input.dataConfidence * 0.1 -
        riskPenalty
    ),
    components: {
      relativeStrength,
      acceleration: input.momentumAcceleration,
      industryFundamental: input.industryFundamental,
      volumeLiquidity: input.volumeLiquidity,
      dataConfidence: input.dataConfidence,
      riskPenalty,
    },
  }
}

function calculateOversold(input: StrategyInput): {
  score: number
  components: ScoreComponents
} {
  const drawdown = weightedAverage([
    [input.drawdownDepth, 0.6],
    [input.drawdownDuration, 0.4],
  ])
  const riskPenalty = Math.min(25, input.structuralDamage * 0.25)
  return {
    score: clamp(
      drawdown * 0.2 +
        input.reversalSignal * 0.25 +
        input.fundamentalRecovery * 0.3 +
        input.volumeLiquidity * 0.15 +
        input.dataConfidence * 0.1 -
        riskPenalty
    ),
    components: {
      drawdown,
      reversal: input.reversalSignal,
      fundamentalRecovery: input.fundamentalRecovery,
      volumeLiquidity: input.volumeLiquidity,
      dataConfidence: input.dataConfidence,
      riskPenalty,
    },
  }
}

function percentile(score: number, scores: number[]): number {
  if (scores.length <= 1) return 100
  const below = scores.filter(other => other < score).length
  const equal = scores.filter(other => other === score).length
  return (
    Math.round(((below + (equal - 1) / 2) / (scores.length - 1)) * 10000) / 100
  )
}

function gates(
  input: StrategyInput,
  score: number,
  percentileValue: number
): GateResult[] {
  return [
    {
      gate: 'G0',
      passed: input.qualityStatus === 'passed' && input.dataConfidence >= 70,
      reason:
        input.qualityStatus === 'passed' && input.dataConfidence >= 70
          ? 'data quality and confidence passed'
          : 'data quality or confidence failed',
    },
    {
      gate: 'G1',
      passed:
        input.fundamentalTriggerPassed &&
        input.thesisEvidence.trim().length > 0,
      reason:
        input.fundamentalTriggerPassed && input.thesisEvidence.trim().length > 0
          ? 'fundamental trigger and thesis evidence passed'
          : 'fundamental trigger or thesis evidence missing',
    },
    {
      gate: 'G2',
      passed: percentileValue >= STRATEGY_PERCENTILE_CUTOFF && score >= 0,
      reason:
        percentileValue >= STRATEGY_PERCENTILE_CUTOFF
          ? 'strategy percentile is within the top five percent'
          : 'strategy percentile is below the top five percent',
    },
    {
      gate: 'G3',
      passed:
        input.isEtf &&
        !input.isLeveragedOrInverse &&
        input.liquidityScore >= 70,
      reason:
        input.isEtf && !input.isLeveragedOrInverse && input.liquidityScore >= 70
          ? 'ETF structure and liquidity passed'
          : 'ETF structure or liquidity failed',
    },
    {
      gate: 'G4',
      passed: input.portfolioRiskPassed,
      reason: input.portfolioRiskPassed
        ? 'portfolio risk constraints passed'
        : 'portfolio risk constraints failed',
    },
  ]
}

export function evaluateStrategies(
  inputs: StrategyInput[],
  strategy: StrategyName
): StrategyEvaluation[] {
  inputs.forEach(validateInput)
  const scored = inputs.map(input => {
    const result =
      strategy === 'momentum'
        ? calculateMomentum(input)
        : calculateOversold(input)
    return { input, ...result }
  })
  const scores = scored.map(item => item.score)
  return scored.map(({ input, score, components }) => {
    const percentileValue = percentile(score, scores)
    const gateResults = gates(input, score, percentileValue)
    const exclusionReasons = gateResults
      .filter(gate => !gate.passed)
      .map(gate => `${gate.gate}: ${gate.reason}`)
    return {
      ticker: input.ticker,
      asOf: input.asOf,
      valuationCurrency: input.valuationCurrency,
      strategy,
      strategyVersion: STRATEGY_VERSION,
      universeFilterVersion: input.universeFilterVersion,
      components,
      score: Math.round(score * 100) / 100,
      percentile: percentileValue,
      topFivePercent: percentileValue >= STRATEGY_PERCENTILE_CUTOFF,
      gates: gateResults,
      accepted: exclusionReasons.length === 0,
      exclusionReasons,
    }
  })
}
