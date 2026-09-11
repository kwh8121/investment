import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  scanStrategy,
  type ScannerCandidate,
  type ScannerWeek,
} from '../src/lib/etf/scanner.ts'
import type { StrategyEvaluation } from '../src/lib/etf/strategy.ts'

function candidate(
  ticker: string,
  percentile: number,
  overrides: Partial<ScannerCandidate> = {}
): ScannerCandidate {
  const evaluation: StrategyEvaluation = {
    ticker,
    asOf: '2026-09-08',
    valuationCurrency: 'KRW',
    strategy: 'momentum',
    strategyVersion: 'strategy-v0.2',
    universeFilterVersion: 'korean-etf-universe-v1',
    components: {
      relativeStrength: percentile,
      acceleration: percentile,
      industryFundamental: percentile,
      volumeLiquidity: percentile,
      dataConfidence: 90,
      riskPenalty: 0,
    },
    score: percentile,
    percentile,
    topFivePercent: percentile >= 95,
    gates: [
      { gate: 'G0', passed: true, reason: 'passed' },
      { gate: 'G1', passed: true, reason: 'passed' },
      { gate: 'G2', passed: percentile >= 95, reason: 'ranked' },
      { gate: 'G3', passed: true, reason: 'passed' },
      { gate: 'G4', passed: true, reason: 'passed' },
    ],
    accepted: percentile >= 95,
    exclusionReasons: percentile >= 95 ? [] : ['G2: below cutoff'],
  }
  return {
    evaluation,
    industry: 'industry-a',
    coreIndustry: 'core-a',
    thesisValid: true,
    overlapRatio: 0.1,
    portfolioCorrelation: 0.2,
    radarQualified: false,
    radarEvidence: '',
    ...overrides,
  }
}

function week(
  name: string,
  candidates: ScannerCandidate[],
  top3: ScannerCandidate[]
): ScannerWeek {
  return { week: name, candidates, top3 }
}

describe('ETF scanner and Top 3', () => {
  it('selects no more than three qualified candidates and does not force-fill', () => {
    const current = week(
      '2026-W36',
      [
        candidate('A', 99),
        candidate('B', 98, { coreIndustry: 'core-b' }),
        candidate('C', 97, { coreIndustry: 'core-c' }),
        candidate('D', 96, { coreIndustry: 'core-d' }),
      ],
      []
    )
    const report = scanStrategy(current, 'momentum')

    assert.deepEqual(
      report.top3.map(entry => entry.ticker),
      ['A', 'B', 'C']
    )
    assert.equal(report.challengers[0]?.ticker, 'D')
    assert.equal(
      report.top3.every(entry => entry.status === '신규'),
      true
    )
  })

  it('applies G4 overlap and correlation exclusions before ranking', () => {
    const current = week(
      '2026-W36',
      [
        candidate('A', 99, { overlapRatio: 0.7 }),
        candidate('B', 98, {
          portfolioCorrelation: 0.9,
          coreIndustry: 'core-b',
        }),
        candidate('C', 97, { coreIndustry: 'core-c' }),
      ],
      []
    )
    const report = scanStrategy(current, 'momentum')

    assert.deepEqual(
      report.top3.map(entry => entry.ticker),
      ['C']
    )
    assert.equal(report.excluded.length, 2)
    assert.equal(
      report.excluded[0]?.reasons.some(reason => reason.includes('overlap')),
      true
    )
  })

  it('requires two consecutive weeks before replacing the prior third place', () => {
    const oldThird = candidate('C', 97, { coreIndustry: 'core-c' })
    const previousThird = candidate('C', 97, { coreIndustry: 'core-c' })
    const oldChallenger = candidate('D', 98, { coreIndustry: 'core-d' })
    const previousChallenger = candidate('D', 98, { coreIndustry: 'core-d' })
    const currentChallenger = candidate('D', 99, { coreIndustry: 'core-d' })
    const previous = week(
      '2026-W35',
      [
        candidate('A', 100),
        candidate('B', 98, { coreIndustry: 'core-b' }),
        previousThird,
        previousChallenger,
      ],
      [
        candidate('A', 100),
        candidate('B', 98, { coreIndustry: 'core-b' }),
        previousThird,
      ]
    )
    const twoWeeksAgo = week(
      '2026-W34',
      [
        candidate('A', 99),
        candidate('B', 98, { coreIndustry: 'core-b' }),
        oldThird,
        oldChallenger,
      ],
      [
        candidate('A', 99),
        candidate('B', 98, { coreIndustry: 'core-b' }),
        oldThird,
      ]
    )
    const report = scanStrategy(
      week(
        '2026-W36',
        [
          candidate('A', 100),
          candidate('B', 98, { coreIndustry: 'core-b' }),
          candidate('C', 97, { coreIndustry: 'core-c' }),
          currentChallenger,
        ],
        []
      ),
      'momentum',
      previous,
      twoWeeksAgo
    )

    assert.deepEqual(
      report.top3.map(entry => entry.ticker),
      ['A', 'D', 'B']
    )
    assert.equal(
      report.top3.find(entry => entry.ticker === 'D')?.status,
      '신규'
    )
    assert.equal(
      report.dropped.some(entry => entry.ticker === 'C'),
      true
    )
  })

  it('separates Radar promotion and demotion evidence', () => {
    const previousRadar = candidate('R', 96, {
      radarQualified: true,
      radarEvidence: 'previous evidence',
    })
    const report = scanStrategy(
      week(
        '2026-W36',
        [
          candidate('R', 96, {
            radarQualified: true,
            radarEvidence: 'new evidence',
          }),
        ],
        []
      ),
      'momentum',
      week('2026-W35', [previousRadar], [])
    )

    assert.equal(report.radar[0]?.status, '유지')
    assert.equal(report.radar[0]?.evidence, 'new evidence')
  })

  it('rejects mixed strategies in one report', () => {
    const other = candidate('O', 99)
    other.evaluation = { ...other.evaluation, strategy: 'oversold' }
    assert.throws(
      () =>
        scanStrategy(
          week('2026-W36', [candidate('A', 99), other], []),
          'momentum'
        ),
      /Mixed strategies/
    )
  })
})
