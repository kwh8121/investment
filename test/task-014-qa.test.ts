import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  runBacktest,
  type BacktestObservation,
} from '../src/lib/etf/backtest.ts'
import { classifyLossStage } from '../src/lib/etf/risk.ts'
import {
  InMemoryGuideRepository,
  publishGuide,
} from '../src/lib/research/guide.ts'

const observation: BacktestObservation = {
  ticker: '069500',
  market: 'KR',
  industry: 'index',
  period: '2025',
  strategy: 'momentum',
  strategyVersion: 'strategy-v0.2',
  signalAsOf: '2025-01-01',
  evaluationEnd: '2025-12-31',
  percentile: 99,
  passesFilter: true,
  liquidityScore: 90,
  priceReturnLocal: 0.1,
  fxReturn: 0,
  dividendReturn: 0.01,
  benchmarkReturnKrw: 0.03,
}

const guideInput = {
  ticker: '069500',
  strategy: 'momentum' as const,
  strategyVersion: 'strategy-v0.2',
  universeFilterVersion: 'korean-etf-universe-v1',
  asOf: '2026-09-08',
  approvedAt: '2026-09-08T01:00:00.000Z',
  snapshotId: 'snapshot-1',
  qualityStatus: 'passed' as const,
  gates: [
    { gate: 'G0' as const, passed: true, reason: 'passed' },
    { gate: 'G1' as const, passed: true, reason: 'passed' },
    { gate: 'G2' as const, passed: true, reason: 'passed' },
    { gate: 'G3' as const, passed: true, reason: 'passed' },
    { gate: 'G4' as const, passed: true, reason: 'passed' },
  ],
  thesis: 'Trend remains supported.',
  triggers: ['Add only when risk-reward improves.'],
  invalidation: 'Invalidate on structural damage.',
  risk: { risks: ['Reversal'], maxLossPct: 8, rewardRiskRatio: 1.5 },
}

describe('Task 014 QA smoke checks', () => {
  it('reproduces the same backtest result from identical inputs', () => {
    const first = runBacktest([observation], 'momentum', {
      percentileCutoff: 95,
      liquidityMinimum: 70,
    })
    const second = runBacktest([observation], 'momentum', {
      percentileCutoff: 95,
      liquidityMinimum: 70,
    })
    assert.deepEqual(second, first)
  })

  it('keeps the original guide immutable across correction', () => {
    const repository = new InMemoryGuideRepository()
    const first = publishGuide(guideInput, repository)
    const second = publishGuide(
      { ...guideInput, snapshotId: 'snapshot-2', correctionOf: first.id },
      repository
    )
    assert.equal(first.version, 1)
    assert.equal(second.version, 2)
    assert.equal(first.snapshotId, 'snapshot-1')
    assert.equal(second.supersedesId, first.id)
  })

  it('exposes the hard-stop boundary for QA and operations', () => {
    assert.equal(classifyLossStage(8).stage, 'risk-alert')
    assert.equal(classifyLossStage(10).stage, 'reduce-risk')
    assert.equal(classifyLossStage(15).stage, 'hard-stop')
    assert.equal(classifyLossStage(20).stage, 'hard-stop')
  })
})
