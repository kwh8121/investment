import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { SELECTION_SOURCE } from '../src/lib/etf/selection-source.ts'

const V17_SOURCE_ROOTS = ['src/lib/etf', 'src/app', 'src/components', 'scripts']
const LEGACY_SELECTION_MARKERS = [
  'DG2_SAMPLE_SELECTOR_VERSION',
  'selectDg2SampleByTradeValue',
  'Dg2SampleSelection',
  'kiwoom-trade-value',
]
const LEGACY_IMPORT = /from\s+['"][^'"]*\/legacy\//

const read = (filePath: string) => fs.readFileSync(filePath, 'utf8')

function listSourceFiles(root: string): string[] {
  return fs
    .readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter(entry => /\.tsx?$/.test(entry))
    .map(entry => path.join(root, entry))
}

const v17SourceFiles = V17_SOURCE_ROOTS.flatMap(listSourceFiles)

describe('v1.7 selection source contract (PRD §11 DG0, §15)', () => {
  it('declares KRX as the only v1.7 selection source', () => {
    assert.equal(SELECTION_SOURCE, 'krx')
  })

  it('keeps the legacy Kiwoom selection contract out of v1.7 source paths', () => {
    const offenders = v17SourceFiles.filter(file => {
      const content = read(file)
      return LEGACY_SELECTION_MARKERS.some(marker => content.includes(marker))
    })

    assert.deepEqual(offenders, [])
  })

  it('does not import legacy modules from v1.7 source paths', () => {
    const offenders = v17SourceFiles.filter(file =>
      LEGACY_IMPORT.test(read(file))
    )

    assert.deepEqual(offenders, [])
  })

  it('does not run legacy gate tests in CI or check-all', () => {
    const workflow = read('.github/workflows/quality.yml')
    const checkAll: string = JSON.parse(read('package.json')).scripts[
      'check-all'
    ]

    assert.doesNotMatch(workflow, /test:gate-validation|test:legacy/)
    assert.doesNotMatch(checkAll, /test:gate-validation|test:legacy/)
  })
})
