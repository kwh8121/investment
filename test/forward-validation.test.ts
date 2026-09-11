import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  InMemoryGuideRepository,
  publishGuide,
} from '../src/lib/research/guide.ts'
import {
  createForwardValidationSnapshot,
  evaluateForwardValidation,
  InMemoryForwardValidationRepository,
} from '../src/lib/etf/forward-validation.ts'

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

describe('forward validation ledger', () => {
  it('freezes a guide snapshot before recording future outcomes', () => {
    const guides = new InMemoryGuideRepository()
    const guide = publishGuide(guideInput, guides)
    const snapshot = createForwardValidationSnapshot(guide, 100, 'KOSPI200')

    assert.equal(snapshot.snapshotId, 'snapshot-1')
    assert.equal(snapshot.strategyVersion, 'strategy-v0.2')
    assert.throws(() => {
      snapshot.thesis = 'changed after signal'
    }, TypeError)
  })

  it('records return, excess, MFE, MAE, and an explicit error code', () => {
    const guides = new InMemoryGuideRepository()
    const guide = publishGuide(guideInput, guides)
    const snapshot = createForwardValidationSnapshot(guide, 100, 'KOSPI200')
    const evaluation = evaluateForwardValidation(
      snapshot,
      {
        horizon: 2,
        asOf: '2026-09-22',
        price: 108,
        benchmarkReturn: 0.05,
        highSinceEntry: 112,
        lowSinceEntry: 96,
      },
      'EXTERNAL'
    )

    assert.equal(evaluation.returnPct, 0.08)
    assert.equal(evaluation.excessReturnPct, 0.03)
    assert.equal(evaluation.maximumFavorableExcursionPct, 0.12)
    assert.equal(evaluation.maximumAdverseExcursionPct, -0.04)
    assert.equal(evaluation.errorCode, 'EXTERNAL')
  })

  it('keeps horizon records append-only and blocks future-information leakage', () => {
    const guides = new InMemoryGuideRepository()
    const guide = publishGuide(guideInput, guides)
    const snapshot = createForwardValidationSnapshot(guide, 100, 'KOSPI200')
    const repository = new InMemoryForwardValidationRepository()
    const evaluation = evaluateForwardValidation(snapshot, {
      horizon: 1,
      asOf: '2026-09-15',
      price: 101,
      benchmarkReturn: 0.01,
      highSinceEntry: 103,
      lowSinceEntry: 99,
    })
    repository.saveSnapshot(snapshot)
    repository.saveEvaluation(evaluation)
    assert.equal(repository.findEvaluation(snapshot.id, 1)?.id, evaluation.id)
    assert.throws(() => repository.saveEvaluation(evaluation))
    assert.throws(() =>
      evaluateForwardValidation(snapshot, {
        horizon: 4,
        asOf: '2026-09-07',
        price: 101,
        benchmarkReturn: 0,
        highSinceEntry: 101,
        lowSinceEntry: 100,
      })
    )
  })
})
