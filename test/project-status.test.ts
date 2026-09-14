import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'

import dg2Input from '../docs/plan/gates/DG2-evidence-input.template.json' with { type: 'json' }
import dg3Input from '../docs/plan/gates/DG3-evidence-input.template.json' with { type: 'json' }
import dg4Input from '../docs/plan/gates/DG4-evidence-input.json' with { type: 'json' }
import { evaluateProjectState } from '../src/lib/etf/gate-validation.ts'

const read = (path: string) => fs.readFileSync(path, 'utf8')

describe('legacy gate-evidence contract', () => {
  it('derives the historical gate and operation state from legacy evidence inputs', () => {
    const state = evaluateProjectState(dg2Input, dg3Input, dg4Input)

    assert.equal(state.dg2.decision, 'Conditional Go')
    assert.equal(state.dg3.decision, 'No-Go')
    assert.equal(state.dg4.decision, 'No-Go')
    assert.equal(state.canStartForwardValidation, false)
  })

  it('keeps legacy evidence synchronized without promoting it to the v1.7 execution state', () => {
    const state = evaluateProjectState(dg2Input, dg3Input, dg4Input)
    const legacyRoadmap = read('docs/ROADMAP.md')
    const currentRoadmap = read('docs/ROADMAP-v1.7.md')
    const dg2 = read('docs/plan/gates/DG2-strategy-validation.md')
    const dg3 = read('docs/plan/gates/DG3-strategy-risk.md')
    const dg4 = read('docs/plan/gates/DG4-product-alpha.md')

    assert.match(
      legacyRoadmap,
      new RegExp(`Machine gate status: DG2 ${state.dg2.decision}`)
    )
    assert.match(legacyRoadmap, new RegExp(`DG3 ${state.dg3.decision}`))
    assert.match(legacyRoadmap, new RegExp(`DG4 ${state.dg4.decision}`))
    assert.match(legacyRoadmap, /Forward Validation Not Started/)
    assert.match(legacyRoadmap, /역사적 스냅샷/)
    assert.match(currentRoadmap, /DG0 증거 준비 중 — 사람의 Gate 판정 전/)
    assert.doesNotMatch(currentRoadmap, /DG2 Conditional Go/)
    assert.match(dg2, new RegExp(`Machine status: ${state.dg2.decision}`))
    assert.match(dg3, new RegExp(`Machine status: ${state.dg3.decision}`))
    assert.match(dg4, new RegExp(`Machine status: ${state.dg4.decision}`))
  })
})
