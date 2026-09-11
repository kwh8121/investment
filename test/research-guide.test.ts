import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  InMemoryGuideRepository,
  publishGuide,
} from '../src/lib/research/guide.ts'

const validInput = {
  ticker: '069500',
  strategy: 'momentum' as const,
  strategyVersion: 'strategy-v0.2',
  universeFilterVersion: 'korean-etf-universe-v1',
  asOf: '2026-09-08',
  approvedAt: '2026-09-08T01:00:00.000Z',
  snapshotId: 'snapshot-1',
  qualityStatus: 'passed' as const,
  gates: [
    { gate: 'G0' as const, passed: true, reason: 'scope passed' },
    { gate: 'G1' as const, passed: true, reason: 'thesis passed' },
    { gate: 'G2' as const, passed: true, reason: 'quality passed' },
    { gate: 'G3' as const, passed: true, reason: 'risk passed' },
    { gate: 'G4' as const, passed: true, reason: 'portfolio passed' },
  ],
  thesis: 'Trend is supported by relative strength.',
  triggers: ['Add if thesis remains valid and risk-reward improves.'],
  invalidation: 'Invalidate if structural damage appears.',
  risk: {
    risks: ['Momentum reversal', 'Liquidity deterioration'],
    maxLossPct: 8,
    rewardRiskRatio: 1.5,
  },
}

describe('immutable guide publication', () => {
  it('requires the full guide contract and stores an immutable snapshot', () => {
    const repository = new InMemoryGuideRepository()
    const guide = publishGuide(validInput, repository)

    assert.equal(guide.version, 1)
    assert.equal(guide.supersedesId, null)
    assert.equal(guide.snapshotId, 'snapshot-1')
    assert.throws(() => {
      guide.thesis = 'changed after publication'
    }, TypeError)
    assert.throws(() => {
      guide.risk.risks.push('new risk')
    }, TypeError)
  })

  it('publishes a new correction version without mutating the original', () => {
    const repository = new InMemoryGuideRepository()
    const first = publishGuide(validInput, repository)
    const correction = publishGuide(
      {
        ...validInput,
        snapshotId: 'snapshot-2',
        thesis: 'Corrected thesis with a newer approved snapshot.',
        correctionOf: first.id,
      },
      repository
    )

    assert.equal(correction.version, 2)
    assert.equal(correction.supersedesId, first.id)
    assert.equal(first.snapshotId, 'snapshot-1')
    assert.equal(repository.findLatest('069500', 'momentum')?.id, correction.id)
  })

  it('blocks missing risk fields, failed quality, and failed gates', () => {
    const repository = new InMemoryGuideRepository()
    assert.throws(() => publishGuide({ ...validInput, thesis: '' }, repository))
    assert.throws(() =>
      publishGuide({ ...validInput, qualityStatus: 'warning' }, repository)
    )
    assert.throws(() =>
      publishGuide(
        {
          ...validInput,
          gates: validInput.gates.map(gate =>
            gate.gate === 'G3' ? { ...gate, passed: false } : gate
          ),
        },
        repository
      )
    )
  })

  it('requires thesis maintenance and improved risk-reward for additional buys', () => {
    const repository = new InMemoryGuideRepository()
    assert.throws(() =>
      publishGuide(
        {
          ...validInput,
          additionalBuy: { thesisMaintained: true, riskRewardImproved: false },
        },
        repository
      )
    )
    const guide = publishGuide(
      {
        ...validInput,
        additionalBuy: { thesisMaintained: true, riskRewardImproved: true },
      },
      repository
    )
    assert.deepEqual(guide.additionalBuy, {
      thesisMaintained: true,
      riskRewardImproved: true,
    })
  })
})
