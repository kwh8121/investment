import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { InMemoryPipelineRepository } from '../src/lib/etf/repository.ts'
import {
  runKoreanSingleEtfFromSource,
  runKoreanSingleEtfPipeline,
} from '../src/lib/etf/pipeline.ts'

const input = {
  source: 'csv' as const,
  endpoint: 'task-005-fixture',
  asOf: '2026-09-08',
  fetchedAt: '2026-09-08T00:00:00.000Z',
  payload: {
    instrumentId: 'KR-069500',
    ticker: '069500',
    name: 'KODEX 200',
    market: 'KR' as const,
    asOf: '2026-09-08',
    close: 105720,
    volume: 20998563,
    nav: 105733.6,
    isEtf: true,
    isLeveragedOrInverse: false,
    authorization: 'Bearer secret',
  },
}

describe('Korean single ETF pipeline', () => {
  it('traces raw to read model and removes secrets', async () => {
    const result = await runKoreanSingleEtfPipeline(
      input,
      new InMemoryPipelineRepository(),
      {
        now: () => new Date('2026-09-08T01:00:00.000Z'),
      }
    )

    assert.ok(
      result.rawSnapshot.payload &&
        typeof result.rawSnapshot.payload === 'object'
    )
    assert.ok('authorization' in result.rawSnapshot.payload)
    assert.equal(result.readModel.recommendationAllowed, true)
    assert.equal(result.readModel.strategyVersion, 'korean-single-etf-v1')
    assert.equal(result.rawSnapshot.payload.authorization, '[REDACTED]')
    assert.deepEqual(
      result.trace.map(entry => entry.stage),
      ['raw_snapshot', 'normalization', 'quality', 'calculation', 'read_model']
    )
  })

  it('blocks incomplete data without converting missing values to zero', async () => {
    const incomplete = {
      ...input,
      payload: { ...input.payload, nav: null },
    }
    const result = await runKoreanSingleEtfPipeline(
      incomplete,
      new InMemoryPipelineRepository(),
      { now: () => new Date('2026-09-08T01:00:00.000Z') }
    )

    assert.equal(result.dailyQuote?.nav, null)
    assert.equal(result.readModel.recommendationAllowed, false)
    assert.equal(result.readModel.score, null)
    assert.equal(result.qualityEvents[0]?.ruleId, 'G0-MISSING-FIELD')
  })

  it('keeps a failed run and reuses the raw snapshot on recovery', async () => {
    const repository = new InMemoryPipelineRepository()
    await assert.rejects(
      runKoreanSingleEtfPipeline(input, repository, {
        now: () => new Date('2026-09-08T01:00:00.000Z'),
        afterStage: stage => {
          if (stage === 'raw_snapshot')
            throw new Error('simulated normalization outage')
        },
      }),
      /normalization: simulated normalization outage/
    )

    const recovered = await runKoreanSingleEtfPipeline(input, repository, {
      now: () => new Date('2026-09-08T01:05:00.000Z'),
    })
    assert.equal(recovered.ingestionRun.attempt, 2)
    assert.equal(recovered.ingestionRun.status, 'succeeded')
    assert.equal(recovered.trace[0]?.status, 'reused')
  })

  it('produces the same read model when a successful input is rerun', async () => {
    const repository = new InMemoryPipelineRepository()
    const first = await runKoreanSingleEtfPipeline(input, repository, {
      now: () => new Date('2026-09-08T01:00:00.000Z'),
    })
    const second = await runKoreanSingleEtfPipeline(input, repository, {
      now: () => new Date('2026-09-08T01:05:00.000Z'),
    })

    assert.deepEqual(second.readModel, first.readModel)
    assert.equal(second.rawSnapshot.id, first.rawSnapshot.id)
    assert.equal(second.trace[0]?.status, 'reused')
  })

  it('connects a source fetch to the same end-to-end pipeline', async () => {
    const result = await runKoreanSingleEtfFromSource(
      { ticker: '069500', asOf: input.asOf },
      {
        fetch: async request => {
          assert.deepEqual(request, { ticker: '069500', asOf: input.asOf })
          return input
        },
      },
      new InMemoryPipelineRepository(),
      { now: () => new Date('2026-09-08T01:00:00.000Z') }
    )

    assert.equal(result.readModel.ticker, '069500')
    assert.equal(result.readModel.recommendationAllowed, true)
  })
})
