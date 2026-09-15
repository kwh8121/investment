import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'

const ROADMAP_PATH = 'docs/ROADMAP-v1.7.md'
const DG0_GATE_PATH = 'docs/plan/gates/DG0-v17-contract-unification.md'
const HUMAN_GO_DECISION =
  /^> \*\*판정:\*\* Go \(\d{4}-\d{2}-\d{2}, Approver: [^)]+\)/m

const read = (path: string) => fs.readFileSync(path, 'utf8')

function baselineRow(roadmap: string, item: string): string[] {
  const row = roadmap
    .split('\n')
    .filter(line => line.startsWith('|'))
    .map(line => line.split('|').map(cell => cell.trim()))
    .find(cells => cells[1] === item)
  assert.ok(row, `${ROADMAP_PATH} 기준선 표에 ${item} 행이 없다`)
  return row
}

describe('v1.7 execution state', () => {
  const roadmap = read(ROADMAP_PATH)
  const dg0Approved = HUMAN_GO_DECISION.test(read(DG0_GATE_PATH))

  it('links the DG0 baseline row to the v1.7 gate record', () => {
    assert.ok(baselineRow(roadmap, 'DG0')[3].includes(DG0_GATE_PATH))
  })

  it('marks DG0 as passed only when the gate record holds a human Go decision', () => {
    assert.equal(baselineRow(roadmap, 'DG0')[2] === '통과', dg0Approved)
  })

  it('keeps DG1~DG4 not started until DG0 has a human Go decision', () => {
    if (!dg0Approved) {
      assert.equal(baselineRow(roadmap, 'DG1~DG4')[2], '미착수')
    }
  })

  it('does not promote legacy gate status into the v1.7 roadmap', () => {
    assert.doesNotMatch(roadmap, /DG2 Conditional Go/)
  })
})
