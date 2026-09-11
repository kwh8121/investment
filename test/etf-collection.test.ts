import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  collectDailyQuotes,
  DG2_SAMPLE_SIZE,
  filterUniverse,
  InMemoryCollectionRepository,
  qualityFlags,
  selectDg2SampleByTradeValue,
} from '../src/lib/etf/collection.ts'
import type {
  DailyQuoteRecord,
  UniverseFilterDecision,
} from '../src/lib/etf/collection.ts'

const config = {
  version: 'korean-etf-universe-v1',
  asOf: '2026-09-08',
  minimumListingAgeDays: 365,
  minimumAverageDailyTradingValue: 1_000_000,
}

const candidates = [
  {
    instrumentId: 'KR-069500',
    ticker: '069500',
    name: 'KODEX 200',
    market: 'KR' as const,
    instrumentType: 'ETF' as const,
    isLeveragedOrInverse: false,
    listedAt: '2010-01-01',
    averageDailyTradingValue: 10_000_000,
  },
  {
    instrumentId: 'KR-123456',
    ticker: '123456',
    name: 'Example ETN',
    market: 'KR' as const,
    instrumentType: 'ETN' as const,
    isLeveragedOrInverse: false,
    listedAt: '2010-01-01',
    averageDailyTradingValue: 10_000_000,
  },
]

describe('ETF master and daily collection', () => {
  it('records filter decisions and excludes ETNs', () => {
    const decisions = filterUniverse(candidates, config)
    assert.equal(decisions[0]?.accepted, true)
    assert.equal(decisions[1]?.accepted, false)
    assert.equal(decisions[1]?.reason, 'ETN is excluded')
    assert.equal(decisions[0]?.filterVersion, config.version)
  })

  it('flags a 30 percent price jump and three missing business days', () => {
    const jumpFlags = qualityFlags(
      {
        ticker: '069500',
        asOf: '2026-09-08',
        close: 140,
        volume: 100,
        tradeValue: 1000,
        fxRate: 1,
        dividend: null,
      },
      [
        {
          ticker: '069500',
          asOf: '2026-09-07',
          close: 100,
          volume: 100,
          tradeValue: 1000,
          fxRate: 1,
          dividend: null,
        },
      ]
    )
    const missingFlags = qualityFlags(
      {
        ticker: '069500',
        asOf: '2026-09-08',
        close: null,
        volume: null,
        tradeValue: null,
        fxRate: 1,
        dividend: null,
      },
      [
        {
          ticker: '069500',
          asOf: '2026-09-04',
          close: null,
          volume: null,
          tradeValue: null,
          fxRate: 1,
          dividend: null,
        },
        {
          ticker: '069500',
          asOf: '2026-09-07',
          close: null,
          volume: null,
          tradeValue: null,
          fxRate: 1,
          dividend: null,
        },
      ]
    )
    assert.equal(
      jumpFlags.some(flag => flag.ruleId === 'PRICE_JUMP_30_PERCENT'),
      true
    )
    assert.equal(
      missingFlags.some(flag => flag.ruleId === 'MISSING_THREE_BUSINESS_DAYS'),
      true
    )
  })

  it('retries failed collection and exposes a quality dashboard', async () => {
    const repository = new InMemoryCollectionRepository()
    let calls = 0
    const result = await collectDailyQuotes(
      candidates,
      config,
      async () => {
        calls += 1
        if (calls === 1) throw new Error('temporary source outage')
        return {
          ticker: '069500',
          asOf: '2026-09-08',
          close: 105720,
          volume: 20_998_563,
          tradeValue: 2_220_000_000,
          fxRate: 1,
          dividend: null,
        }
      },
      repository,
      { maxAttempts: 2, now: () => new Date('2026-09-08T01:00:00.000Z') }
    )
    assert.equal(calls, 2)
    assert.equal(result.run.status, 'succeeded')
    assert.equal(result.dashboard.acceptedCandidates, 1)
    assert.equal(result.dashboard.excludedCandidates, 1)
    assert.equal(result.dashboard.quoteSuccesses, 1)
    assert.equal(result.run.attempts[0]?.status, 'failed')
    assert.equal(result.run.attempts[1]?.status, 'succeeded')
  })

  it('marks a permanently failing quote as a failed run', async () => {
    const repository = new InMemoryCollectionRepository()
    const result = await collectDailyQuotes(
      [candidates[0]!],
      config,
      async () => {
        throw new Error('permanent source outage')
      },
      repository,
      { maxAttempts: 2, now: () => new Date('2026-09-08T01:00:00.000Z') }
    )
    assert.equal(result.run.status, 'failed')
    assert.equal(result.dashboard.quoteFailures, 1)
    assert.equal(result.dashboard.flagCounts.COLLECTION_FAILED, 1)
  })
})

const dg2AsOf = '2026-08-03'

function eligibleDecision(ticker: string): UniverseFilterDecision {
  return {
    instrumentId: `KR-${ticker}`,
    ticker,
    accepted: true,
    filterVersion: 'korean-etf-universe-v1',
    reason: 'accepted',
  }
}

function kiwoomQuote(
  ticker: string,
  tradeValue: number | null,
  overrides: Partial<DailyQuoteRecord> = {}
): DailyQuoteRecord {
  return {
    instrumentId: `KR-${ticker}`,
    ticker,
    asOf: dg2AsOf,
    close: 10_000,
    volume: 1_000,
    tradeValue,
    fxRate: 1,
    dividend: null,
    source: 'kiwoom',
    fetchedAt: '2026-08-03T01:00:00.000Z',
    ...overrides,
  }
}

function buildEligibleSample(count: number) {
  const decisions: UniverseFilterDecision[] = []
  const quotes: DailyQuoteRecord[] = []
  for (let index = 0; index < count; index += 1) {
    const ticker = `1${String(index).padStart(5, '0')}`
    decisions.push(eligibleDecision(ticker))
    quotes.push(kiwoomQuote(ticker, 1_000_000 - index * 1_000))
  }
  return { decisions, quotes }
}

describe('DG2 sample selector', () => {
  it('selects exactly 30 eligible Kiwoom quotes ranked by trade value with ticker tie-break', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE)
    const tieLowTicker = quotes[10]!.ticker
    const tieHighTicker = quotes[11]!.ticker
    // decisions listed ticker-descending so a missing tie-break would fail
    const swapped = decisions[10]!
    decisions[10] = decisions[11]!
    decisions[11] = swapped
    quotes[10] = kiwoomQuote(tieLowTicker, 500_000)
    quotes[11] = kiwoomQuote(tieHighTicker, 500_000)

    const noiseDecisions: UniverseFilterDecision[] = [
      {
        ...eligibleDecision('900001'),
        accepted: false,
        reason: 'ETN is excluded',
      },
    ]
    const noiseQuotes: DailyQuoteRecord[] = [
      kiwoomQuote('900001', 999_999_999),
      kiwoomQuote('900002', 999_999_999),
    ]

    const selection = selectDg2SampleByTradeValue(
      [...decisions, ...noiseDecisions],
      [...quotes, ...noiseQuotes],
      dg2AsOf
    )

    assert.equal(selection.sampleSize, DG2_SAMPLE_SIZE)
    assert.equal(selection.members.length, DG2_SAMPLE_SIZE)
    assert.equal(selection.asOf, dg2AsOf)
    assert.deepEqual(
      new Set(selection.members.map(member => member.ticker)).size,
      DG2_SAMPLE_SIZE
    )
    for (const noise of noiseQuotes) {
      assert.equal(
        selection.members.some(member => member.ticker === noise.ticker),
        false
      )
    }
    for (let index = 1; index < selection.members.length; index += 1) {
      const previous = selection.members[index - 1]!
      const current = selection.members[index]!
      assert.ok(
        previous.tradeValue > current.tradeValue ||
          (previous.tradeValue === current.tradeValue &&
            previous.ticker < current.ticker)
      )
    }
    selection.members.forEach((member, index) => {
      assert.equal(member.rank, index + 1)
    })
  })

  it('rejects a batch containing a duplicate ticker', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE)
    quotes.push(kiwoomQuote(quotes[0]!.ticker, 1))

    assert.throws(() => selectDg2SampleByTradeValue(decisions, quotes, dg2AsOf))
  })

  it('rejects fewer than 30 eligible Kiwoom quotes', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE - 1)

    assert.throws(() => selectDg2SampleByTradeValue(decisions, quotes, dg2AsOf))
  })

  it('rejects an accepted ETF whose quote comes from a non-Kiwoom source', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE)
    quotes[0] = kiwoomQuote(quotes[0]!.ticker, quotes[0]!.tradeValue, {
      source: 'krx',
    })

    assert.throws(
      () => selectDg2SampleByTradeValue(decisions, quotes, dg2AsOf),
      /non-Kiwoom/
    )
  })

  it('rejects an accepted ETF whose quote date does not match the declared asOf', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE)
    quotes[0] = kiwoomQuote(quotes[0]!.ticker, quotes[0]!.tradeValue, {
      asOf: '2026-08-04',
    })

    assert.throws(
      () => selectDg2SampleByTradeValue(decisions, quotes, dg2AsOf),
      /asOf/
    )
  })

  it('rejects an accepted ETF whose quote has a missing trade value', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE)
    quotes[0] = kiwoomQuote(quotes[0]!.ticker, null)

    assert.throws(
      () => selectDg2SampleByTradeValue(decisions, quotes, dg2AsOf),
      /trade value/
    )
  })

  it('rejects an accepted decision that has no corresponding quote', () => {
    const { decisions, quotes } = buildEligibleSample(DG2_SAMPLE_SIZE)
    decisions.push(eligibleDecision('900099'))

    assert.throws(
      () => selectDg2SampleByTradeValue(decisions, quotes, dg2AsOf),
      /missing.*quote/
    )
  })
})
