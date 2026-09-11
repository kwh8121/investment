import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  calculateKrwReturn,
  runBacktest,
  runSensitivity,
  type BacktestObservation,
} from '../src/lib/etf/backtest.ts'
import type { StrategyName } from '../src/lib/etf/strategy.ts'

function observations(): BacktestObservation[] {
  const strategies: StrategyName[] = ['momentum', 'oversold']
  const approvedTickers = ['069500', '102110', '229200', '360750', '133690']
  return strategies.flatMap(strategy =>
    approvedTickers.map((ticker, index) => {
      const market = 'KR' as const
      return {
        ticker,
        market,
        industry: index % 4 === 0 ? 'semiconductor' : `industry-${index % 3}`,
        period: index < 10 ? '2025-H1' : '2025-H2',
        strategy,
        strategyVersion: 'strategy-v0.2',
        signalAsOf: '2025-01-01',
        evaluationEnd: '2025-12-31',
        percentile:
          strategy === 'momentum'
            ? 50 + index * 11.25
            : 50 + (4 - index) * 11.25,
        passesFilter: true,
        liquidityScore: 75 + index * 5,
        priceReturnLocal: 0.02 + index / 500,
        fxReturn: 0,
        dividendReturn: 0.01,
        benchmarkReturnKrw: 0.03,
      } satisfies BacktestObservation
    })
  )
}

describe('ETF small-scope backtest', () => {
  it('separates KRW price, FX, and dividend contributions', () => {
    const result = calculateKrwReturn({
      priceReturnLocal: 0.1,
      fxReturn: 0.05,
      dividendReturn: 0.02,
    })

    assert.equal(result.priceReturnLocal, 0.1)
    assert.equal(result.fxContribution, 0.055)
    assert.equal(result.dividendContribution, 0.0231)
    assert.equal(result.totalReturnKrw, 0.1781)
  })

  it('measures strategy returns against the eligible benchmark', () => {
    const result = runBacktest(observations(), 'momentum', {
      percentileCutoff: 95,
      liquidityMinimum: 70,
    })

    assert.equal(result.observationCount, 5)
    assert.equal(result.selectedCount, 1)
    assert.equal(result.strategyVersion, 'strategy-v0.2')
    assert.equal(result.excessReturnKrw > 0, true)
    assert.equal(result.averageFxContribution, 0)
    assert.deepEqual(result.selectedTickers, ['133690'])
  })

  it('keeps Momentum and Oversold backtests independent', () => {
    const fixture = observations()
    const momentum = runBacktest(fixture, 'momentum', {
      percentileCutoff: 90,
      liquidityMinimum: 60,
    })
    const oversold = runBacktest(fixture, 'oversold', {
      percentileCutoff: 90,
      liquidityMinimum: 60,
    })

    assert.equal(momentum.strategy, 'momentum')
    assert.equal(oversold.strategy, 'oversold')
    assert.equal(momentum.observationCount, 5)
    assert.equal(oversold.observationCount, 5)
    assert.notDeepEqual(momentum.selectedTickers, oversold.selectedTickers)
  })

  it('reports percentile and liquidity sensitivity without changing inputs', () => {
    const result = runSensitivity(
      observations(),
      'momentum',
      [90, 95, 97.5],
      [60, 80]
    )

    assert.equal(result.length, 6)
    assert.equal(
      result.filter(
        item => item.percentileCutoff === 97.5 && item.liquidityMinimum === 80
      )[0]?.selectedCount,
      0
    )
    assert.equal(
      result.every(item => item.strategy === 'momentum'),
      true
    )
  })

  it('flags concentrated selection as a possible overfit', () => {
    const concentrated = Array.from({ length: 4 }, (_, index) => ({
      ...observations()[index]!,
      ticker: `C${String(index).padStart(5, '0')}`,
      industry: 'semiconductor',
      percentile: 99,
      market: 'KR' as const,
      period: '2025-H1',
      passesFilter: true,
    }))
    const result = runBacktest(concentrated, 'momentum', {
      percentileCutoff: 95,
      liquidityMinimum: 60,
    })

    assert.equal(result.selectedCount, 4)
    assert.equal(result.overfitWarnings.length, 3)
  })
})
