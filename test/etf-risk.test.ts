import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { BacktestObservation } from '../src/lib/etf/backtest.ts'
import {
  calculateRiskMetrics,
  classifyLossStage,
  runRollingBacktest,
  runRollingBacktestFromDg3Evidence,
  validateRiskLimits,
} from '../src/lib/etf/risk.ts'
import { createHash } from 'node:crypto'
import type { Dg3RawObservation } from '../src/lib/etf/dg3-evidence.ts'

const observation = (
  signalAsOf: string,
  evaluationEnd: string
): BacktestObservation => ({
  ticker: '069500',
  market: 'KR',
  industry: 'index',
  period: signalAsOf,
  strategy: 'momentum',
  strategyVersion: 'strategy-v0.2',
  signalAsOf,
  evaluationEnd,
  percentile: 99,
  passesFilter: true,
  liquidityScore: 90,
  priceReturnLocal: 0.1,
  fxReturn: 0,
  dividendReturn: 0.01,
  benchmarkReturnKrw: 0.03,
})

const evidenceObservation = (): Dg3RawObservation => {
  const rawBytes = new TextEncoder().encode('risk-evidence')
  return {
    ...observation('2022-01-01', '2022-12-31'),
    provenance: {
      sourceUri: 'https://example.test/krx/069500/2022',
      sourceSha256: createHash('sha256').update(rawBytes).digest('hex'),
      sourceEffectiveAsOf: '2021-12-31',
      sourcePublishedAt: '2021-12-31T00:00:00Z',
      fetchedAt: new Date(Date.now() - 1000).toISOString(),
      observationDates: ['2021-12-31', '2022-01-01'],
    },
    rawBytes,
  }
}

describe('ETF backtest and risk management', () => {
  it('runs separate rolling windows and applies transaction cost after gross return', () => {
    const result = runRollingBacktest(
      [
        observation('2022-01-01', '2022-12-31'),
        observation('2023-01-01', '2023-12-31'),
        observation('2024-01-01', '2024-12-31'),
      ],
      'momentum',
      {
        percentileCutoff: 95,
        liquidityMinimum: 70,
        transactionCostBps: 25,
        includeDelisted: false,
        windows: [
          { start: '2022-01-01', end: '2022-12-31' },
          { start: '2023-01-01', end: '2023-12-31' },
        ],
      }
    )
    assert.equal(result.windows.length, 2)
    assert.equal(result.costAfterReturnKrw < result.costBeforeReturnKrw, true)
    assert.match(result.survivorshipBiasNote, /survivorship bias/)
  })

  it('normalizes DG3 evidence before running a rolling backtest', () => {
    const result = runRollingBacktestFromDg3Evidence(
      [evidenceObservation()],
      'momentum',
      {
        percentileCutoff: 95,
        liquidityMinimum: 70,
        transactionCostBps: 25,
        includeDelisted: false,
        windows: [{ start: '2022-01-01', end: '2022-12-31' }],
      }
    )

    assert.equal(result.windows.length, 1)
    assert.throws(() =>
      runRollingBacktestFromDg3Evidence(
        [
          {
            ...evidenceObservation(),
            rawBytes: new TextEncoder().encode('tampered'),
          },
        ],
        'momentum',
        {
          percentileCutoff: 95,
          liquidityMinimum: 70,
          transactionCostBps: 25,
          includeDelisted: false,
          windows: [{ start: '2022-01-01', end: '2022-12-31' }],
        }
      )
    )
  })

  it('calculates drawdown, recovery, turnover, and dependency metrics', () => {
    const result = calculateRiskMetrics([
      {
        asOf: '2024-01-01',
        returnKrw: 0.1,
        benchmarkReturnKrw: 0.02,
        turnover: 0.2,
        fxContribution: 0,
        dividendContribution: 0.01,
        market: 'KR',
        industry: 'index',
      },
      {
        asOf: '2024-01-02',
        returnKrw: -0.2,
        benchmarkReturnKrw: -0.03,
        turnover: 0.3,
        fxContribution: 0,
        dividendContribution: 0,
        market: 'KR',
        industry: 'index',
      },
      {
        asOf: '2024-01-04',
        returnKrw: 0.3,
        benchmarkReturnKrw: 0.01,
        turnover: 0.1,
        fxContribution: 0.01,
        dividendContribution: 0.02,
        market: 'KR',
        industry: 'index',
      },
    ])
    assert.equal(result.maxDrawdown, -0.2)
    assert.equal(result.recoveryDays, 3)
    assert.equal(result.turnover, 0.6)
    assert.equal(result.marketConcentration, 1)
    assert.equal(result.industryConcentration, 1)
  })

  it('enforces portfolio, market, position, and individual risk limits', () => {
    const result = validateRiskLimits(
      [
        {
          ticker: '069500',
          market: 'KR',
          industry: 'index',
          weight: 0.3,
          amountKrw: 3_000_000,
          individualRiskPct: 8,
        },
        {
          ticker: 'VOO',
          market: 'US',
          industry: 'index',
          weight: 0.7,
          amountKrw: 7_000_000,
          individualRiskPct: 9,
        },
      ],
      {
        capitalKrw: 10_000_000,
        maxPositionWeight: 0.3,
        maxPositionAmountKrw: 3_000_000,
        maxPositions: 3,
        maxInvestedWeight: 0.9,
        maxUsWeight: 0.6,
        maxIndividualRiskPct: 8,
      }
    )
    assert.equal(result.passed, false)
    assert.equal(result.investedWeight, 1)
    assert.equal(result.usWeight, 0.7)
    assert.equal(result.violations.length, 5)
  })

  it('maps the -8/-10/-15/-20 loss policy to explicit actions', () => {
    assert.equal(classifyLossStage(7.99).stage, 'normal')
    assert.equal(classifyLossStage(8).stage, 'risk-alert')
    assert.equal(classifyLossStage(10).stage, 'reduce-risk')
    assert.equal(classifyLossStage(15).stage, 'hard-stop')
    assert.equal(classifyLossStage(20).stage, 'hard-stop')
    assert.throws(() => classifyLossStage(-1))
  })
})
