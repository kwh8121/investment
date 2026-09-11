import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  evaluateStrategies,
  STRATEGY_PERCENTILE_CUTOFF,
  STRATEGY_VERSION,
  type StrategyInput,
} from '../src/lib/etf/strategy.ts'

function input(
  ticker: string,
  overrides: Partial<StrategyInput> = {}
): StrategyInput {
  return {
    ticker,
    asOf: '2026-09-08',
    valuationCurrency: 'KRW',
    universeFilterVersion: 'korean-etf-universe-v1',
    qualityStatus: 'passed',
    dataConfidence: 90,
    isEtf: true,
    isLeveragedOrInverse: false,
    fundamentalTriggerPassed: true,
    thesisEvidence: 'industry demand is stable',
    liquidityScore: 90,
    portfolioRiskPassed: true,
    relativeStrength1M: 80,
    relativeStrength3M: 75,
    relativeStrength6M: 70,
    momentumAcceleration: 70,
    industryFundamental: 75,
    volumeLiquidity: 80,
    overheatRisk: 10,
    drawdownDepth: 40,
    drawdownDuration: 45,
    reversalSignal: 50,
    fundamentalRecovery: 45,
    structuralDamage: 10,
    ...overrides,
  }
}

describe('ETF strategy scorecards', () => {
  it('calculates deterministic, independently versioned scorecards', () => {
    const inputs = [
      input('069500'),
      input('102110', { relativeStrength1M: 60, momentumAcceleration: 45 }),
      input('229200', { relativeStrength1M: 40, momentumAcceleration: 25 }),
    ]
    const first = evaluateStrategies(inputs, 'momentum')
    const second = evaluateStrategies(inputs, 'momentum')

    assert.deepEqual(second, first)
    assert.equal(first[0]?.strategyVersion, STRATEGY_VERSION)
    assert.equal(first[0]?.strategy, 'momentum')
    assert.equal(first[0]?.topFivePercent, true)
    assert.equal(first[0]?.percentile >= STRATEGY_PERCENTILE_CUTOFF, true)
  })

  it('does not mix Momentum and Oversold scores', () => {
    const candidate = input('069500', {
      drawdownDepth: 90,
      drawdownDuration: 85,
      reversalSignal: 90,
      fundamentalRecovery: 90,
    })
    const momentum = evaluateStrategies([candidate], 'momentum')[0]!
    const oversold = evaluateStrategies([candidate], 'oversold')[0]!

    assert.equal(momentum.strategy, 'momentum')
    assert.equal(oversold.strategy, 'oversold')
    assert.notEqual(momentum.score, oversold.score)
    assert.equal(momentum.components.relativeStrength !== undefined, true)
    assert.equal(oversold.components.drawdown !== undefined, true)
  })

  it('applies G0-G4 in order and excludes failed candidates', () => {
    const result = evaluateStrategies(
      [
        input('069500', { qualityStatus: 'blocked' }),
        input('102110', { isLeveragedOrInverse: true }),
      ],
      'momentum'
    )

    assert.equal(result[0]?.gates.map(gate => gate.gate).join(''), 'G0G1G2G3G4')
    assert.equal(result[0]?.accepted, false)
    assert.equal(
      result[0]?.exclusionReasons.some(reason => reason.startsWith('G0:')),
      true
    )
    assert.equal(result[1]?.accepted, false)
    assert.equal(
      result[1]?.exclusionReasons.some(reason => reason.startsWith('G3:')),
      true
    )
  })
})
