import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  chooseKiwoomDailyCaptureBatch,
  createKiwoomDailyCaptureCheckpoint,
  createKiwoomDailyCaptureRunDefinition,
  createKiwoomDailyCaptureRunLayout,
  validateKiwoomCaptureId,
  validateKiwoomDailyCaptureCheckpoint,
  validateKiwoomDailyCaptureRunDefinition,
} from '../src/lib/etf/kiwoom-etf-historical-daily-run.ts'

const requestedDate = '20260803'
const captureId = '20260803-initial'
const sourceCommands = {
  list: 'kiwoomcli domestic etfs list --format json',
  daily:
    'kiwoomcli domestic etfs daily --code <six-digit-ticker> --pages 1 --format json',
}
const sanitizedList = JSON.stringify({
  etfall_mrpr: [
    { stk_cd: '069500', stk_nm: 'KODEX 200' },
    { stk_cd: '114100', stk_nm: 'KODEX 국고채3년' },
    { stk_cd: '0000D0', stk_nm: 'unsupported' },
  ],
})

function definition() {
  return createKiwoomDailyCaptureRunDefinition({
    requestedDate,
    captureId,
    sanitizedList,
    sourceCommands,
    createdAt: '2026-08-03T00:00:00.000Z',
  })
}

describe('Kiwoom daily capture run helpers', () => {
  it('creates a capture-ID-scoped external run layout and rejects unsafe IDs/dates', () => {
    const layout = createKiwoomDailyCaptureRunLayout({
      requestedDate,
      captureId,
      rawRoot: '/tmp/evidence-bundle/raw',
    })

    assert.equal(
      layout.runDirectory,
      '/tmp/evidence-bundle/raw/kiwoom-etf-historical-daily/20260803/20260803-initial'
    )
    assert.equal(layout.entriesDirectory, `${layout.runDirectory}/entries`)
    assert.throws(() => validateKiwoomCaptureId('../escape'), /letters, digits/)
    assert.throws(
      () =>
        createKiwoomDailyCaptureRunLayout({
          requestedDate: '20260230',
          captureId,
        }),
      /calendar date/
    )
  })

  it('freezes and validates the sanitized list and both identifier sets on resume', () => {
    const runDefinition = definition()
    validateKiwoomDailyCaptureRunDefinition({
      definition: runDefinition,
      requestedDate,
      captureId,
      sanitizedList,
    })

    assert.throws(
      () =>
        validateKiwoomDailyCaptureRunDefinition({
          definition: runDefinition,
          requestedDate: '20260804',
          captureId,
          sanitizedList,
        }),
      /requested date mismatch/
    )
    assert.throws(
      () =>
        validateKiwoomDailyCaptureRunDefinition({
          definition: runDefinition,
          requestedDate,
          captureId,
          sanitizedList: sanitizedList.replace('KODEX 200', 'other name'),
        }),
      /list hash mismatch/
    )
  })

  it('rejects checkpoint mixing and returns a finite sequential next batch', () => {
    const runDefinition = definition()
    const checkpoint = createKiwoomDailyCaptureCheckpoint({
      definition: runDefinition,
      completedTickers: ['069500'],
      updatedAt: '2026-08-03T00:01:00.000Z',
    })
    validateKiwoomDailyCaptureCheckpoint({
      definition: runDefinition,
      checkpoint,
    })
    assert.deepEqual(
      chooseKiwoomDailyCaptureBatch({
        candidates: runDefinition.numericCandidates,
        completedTickers: checkpoint.completedTickers,
        batchLimit: 1,
      }),
      [{ ticker: '114100', productName: 'KODEX 국고채3년' }]
    )
    assert.throws(
      () =>
        validateKiwoomDailyCaptureCheckpoint({
          definition: runDefinition,
          checkpoint: { ...checkpoint, listSha256: '0'.repeat(64) },
        }),
      /immutable run fields mismatch/
    )
    assert.throws(
      () =>
        chooseKiwoomDailyCaptureBatch({
          candidates: runDefinition.numericCandidates,
          completedTickers: [],
          batchLimit: 101,
        }),
      /between 1 and 100/
    )
  })
})
