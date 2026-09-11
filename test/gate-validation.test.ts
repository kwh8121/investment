import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DG2_SAMPLE_SELECTOR_VERSION,
  DG2_SAMPLE_SIZE,
  selectDg2SampleByTradeValue,
} from '../src/lib/etf/collection.ts'
import type {
  DailyQuoteRecord,
  UniverseFilterDecision,
} from '../src/lib/etf/collection.ts'
import {
  evaluateApprovalState,
  evaluateDg2,
  evaluateDg3,
} from '../src/lib/etf/gate-validation.ts'
import type {
  Dg2PriceVerification,
  Dg2SampleSelectionEvidence,
} from '../src/lib/etf/gate-validation.ts'

const tickers = ['069500', '102110', '229200', '360750', '133690']
const pilotSignalAsOf = '2026-08-03'
const completeVerifications = tickers.map(ticker => ({
  ticker,
  signalAsOf: pilotSignalAsOf,
  evaluationEnd: '2026-09-08',
  hasPriceData: true,
  priceReturnKrw: 0.1,
  benchmarkReturnKrw: 0.08,
  dividendVerified: true,
  strategyInputVerified: true,
  noFutureLeakage: true,
}))

function buildKiwoomEligibleSample(
  count: number,
  asOf: string = pilotSignalAsOf
): {
  decisions: UniverseFilterDecision[]
  quotes: DailyQuoteRecord[]
} {
  const decisions: UniverseFilterDecision[] = []
  const quotes: DailyQuoteRecord[] = []
  for (let index = 0; index < count; index += 1) {
    const ticker = `2${String(index).padStart(5, '0')}`
    decisions.push({
      instrumentId: `KR-${ticker}`,
      ticker,
      accepted: true,
      filterVersion: 'korean-etf-universe-v1',
      reason: 'accepted',
    })
    quotes.push({
      instrumentId: `KR-${ticker}`,
      ticker,
      asOf,
      close: 10_000,
      volume: 1_000,
      tradeValue: 1_000_000 - index * 1_000,
      fxRate: 1,
      dividend: null,
      source: 'kiwoom',
      fetchedAt: `${asOf}T01:00:00.000Z`,
    })
  }
  return { decisions, quotes }
}

function toSelectionEvidence(
  selection: ReturnType<typeof selectDg2SampleByTradeValue>,
  sourceSnapshotOverrides: Partial<
    Dg2SampleSelectionEvidence['sourceSnapshot']
  > = {}
): Dg2SampleSelectionEvidence {
  return {
    selectorVersion: selection.selectorVersion,
    source: selection.source,
    asOf: selection.asOf,
    sourceSnapshot: {
      sha256: 'a'.repeat(64),
      fetchedAt: `${selection.asOf}T01:05:00.000Z`,
      ...sourceSnapshotOverrides,
    },
    members: selection.members.map(member => ({
      ticker: member.ticker,
      tradeValue: member.tradeValue,
      rank: member.rank,
    })),
  }
}

function buildVerifications(
  approvedTickers: string[],
  signalAsOf: string
): Dg2PriceVerification[] {
  return approvedTickers.map(ticker => ({
    ticker,
    signalAsOf,
    evaluationEnd: '2026-09-08',
    hasPriceData: true,
    priceReturnKrw: 0.1,
    benchmarkReturnKrw: 0.08,
    dividendVerified: true,
    strategyInputVerified: true,
    noFutureLeakage: true,
  }))
}

// real selector output shared across tests to bind the gate to genuine provenance
const { decisions: kiwoomDecisions, quotes: kiwoomQuotes } =
  buildKiwoomEligibleSample(DG2_SAMPLE_SIZE)
const kiwoomSelection = selectDg2SampleByTradeValue(
  kiwoomDecisions,
  kiwoomQuotes,
  pilotSignalAsOf
)
const kiwoomApprovedTickers = kiwoomSelection.members.map(
  member => member.ticker
)
const kiwoomSelectionEvidence = toSelectionEvidence(kiwoomSelection)
const kiwoomVerifications = buildVerifications(
  kiwoomApprovedTickers,
  pilotSignalAsOf
)

const completeDg3 = {
  rollingWindowYears: 5,
  includesDownturn2022: true,
  dividendReinvestmentVerified: true,
  transactionCostsVerified: true,
  delistedUniverseAssessed: true,
  futureLeakageVerified: true,
  sensitivityReviewed: true,
  ownerApproved: true,
}

const completeDg4 = {
  implementationQaPassed: true,
  browserVerificationPassed: true,
  checkAllPassed: true,
  operationalBurdenReviewed: true,
  ownerApproved: true,
}

describe('DG2 and DG3 approval validator', () => {
  it('keeps the known incomplete real-data state conditional', () => {
    const report = evaluateDg2({
      approvedTickers: tickers,
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: completeVerifications.map(item => ({
        ...item,
        dividendVerified: false,
        strategyInputVerified: false,
      })),
      ownerApproved: true,
    })
    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.equal(report.conditionalReasons.length, 12)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SIZE:')
      )
    )
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SELECTION:')
      )
    )
  })

  it('returns No-Go for missing universe data or future leakage', () => {
    const report = evaluateDg2({
      approvedTickers: tickers,
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: completeVerifications.map(item =>
        item.ticker === '069500' ? { ...item, hasPriceData: false } : item
      ),
      ownerApproved: true,
    })
    assert.equal(report.decision, 'No-Go')
    assert.equal(report.blockingReasons.length, 1)
  })

  it('rejects duplicate or non-approved universe tickers', () => {
    const report = evaluateDg2({
      approvedTickers: ['069500', '069500', '102110', '229200', '360750'],
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: completeVerifications,
      ownerApproved: true,
    })

    assert.equal(report.decision, 'No-Go')
    assert.ok(
      report.blockingReasons.some(reason => reason.startsWith('DG2-UNIVERSE:'))
    )
  })

  it('rejects malformed dates and non-finite returns', () => {
    const report = evaluateDg2({
      approvedTickers: tickers,
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: completeVerifications.map((item, index) =>
        index === 0
          ? {
              ...item,
              signalAsOf: '2026-8-3',
              priceReturnKrw: Number.NaN,
            }
          : item
      ),
      ownerApproved: true,
    })

    assert.equal(report.decision, 'No-Go')
    assert.ok(
      report.blockingReasons.some(reason =>
        reason.startsWith('DG2-DATE-069500:')
      )
    )
    assert.ok(
      report.blockingReasons.some(reason =>
        reason.startsWith('DG2-PRICE-069500:')
      )
    )
  })

  it('requires real multi-year risk evidence before DG3 Go', () => {
    const report = evaluateDg3({
      ...completeDg3,
      rollingWindowYears: 1,
      includesDownturn2022: false,
    })
    assert.equal(report.decision, 'No-Go')
    assert.equal(report.blockingReasons.length, 2)
  })

  it('does not approve a complete five-ticker pilot as a DG2 sample', () => {
    const state = evaluateApprovalState(
      {
        approvedTickers: tickers,
        signalAsOf: pilotSignalAsOf,
        selection: null,
        verifications: completeVerifications,
        ownerApproved: true,
      },
      completeDg3,
      completeDg4
    )
    assert.equal(state.dg2.decision, 'Conditional Go')
    assert.equal(state.canStartForwardValidation, false)
  })

  it('accepts a real Kiwoom top-30 selection as DG2 Go when all other evidence passes', () => {
    const report = evaluateDg2({
      approvedTickers: kiwoomApprovedTickers,
      signalAsOf: pilotSignalAsOf,
      selection: kiwoomSelectionEvidence,
      verifications: kiwoomVerifications,
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Go')
  })

  it('allows forward validation only when both gates are fully approved', () => {
    const state = evaluateApprovalState(
      {
        approvedTickers: kiwoomApprovedTickers,
        signalAsOf: pilotSignalAsOf,
        selection: kiwoomSelectionEvidence,
        verifications: kiwoomVerifications,
        ownerApproved: true,
      },
      completeDg3,
      completeDg4
    )
    assert.equal(state.dg2.decision, 'Go')
    assert.equal(state.dg3.decision, 'Go')
    assert.equal(state.dg4.decision, 'Go')
    assert.equal(state.canStartForwardValidation, true)
  })

  it('blocks forward validation when DG4 is not approved', () => {
    const state = evaluateApprovalState(
      {
        approvedTickers: kiwoomApprovedTickers,
        signalAsOf: pilotSignalAsOf,
        selection: kiwoomSelectionEvidence,
        verifications: kiwoomVerifications,
        ownerApproved: true,
      },
      completeDg3,
      { ...completeDg4, ownerApproved: false }
    )

    assert.equal(state.dg2.decision, 'Go')
    assert.equal(state.dg3.decision, 'Go')
    assert.equal(state.dg4.decision, 'No-Go')
    assert.equal(state.canStartForwardValidation, false)
  })

  it('does not approve a 29-ETF sample as DG2 Go through a non-blocking sample-size check', () => {
    const shortTickers = kiwoomApprovedTickers.slice(0, 29)
    const shortVerifications = kiwoomVerifications.slice(0, 29)
    const report = evaluateDg2({
      approvedTickers: shortTickers,
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: shortVerifications,
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SIZE:')
      )
    )
  })

  it('blocks a sample of more than 30 ETFs as an invalid universe', () => {
    const longTickers = [...kiwoomApprovedTickers, 'ETF-26']
    const longVerifications = [
      ...kiwoomVerifications,
      { ...kiwoomVerifications[0]!, ticker: 'ETF-26' },
    ]
    const report = evaluateDg2({
      approvedTickers: longTickers,
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: longVerifications,
      ownerApproved: true,
    })

    assert.equal(report.decision, 'No-Go')
    assert.ok(
      report.blockingReasons.some(reason => reason.startsWith('DG2-UNIVERSE:'))
    )
  })

  it('does not approve an arbitrary 30-ticker sample as DG2 Go without a source-backed selection', () => {
    const nonPilotTickers = Array.from(
      { length: 30 },
      (_, index) => `NON-PILOT-${index}`
    )
    const nonPilotVerifications = buildVerifications(
      nonPilotTickers,
      pilotSignalAsOf
    )
    const report = evaluateDg2({
      approvedTickers: nonPilotTickers,
      signalAsOf: pilotSignalAsOf,
      selection: null,
      verifications: nonPilotVerifications,
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SELECTION:')
      )
    )
  })

  it('does not approve a sample whose selection members differ from the approved tickers', () => {
    const approvedTickers = [...kiwoomApprovedTickers]
    approvedTickers[0] = 'SUBSTITUTED-TICKER'
    const report = evaluateDg2({
      approvedTickers,
      signalAsOf: pilotSignalAsOf,
      selection: kiwoomSelectionEvidence,
      verifications: buildVerifications(approvedTickers, pilotSignalAsOf),
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SELECTION:')
      )
    )
  })

  it('does not approve a sample whose verifications mix more than one signal date', () => {
    const verifications = kiwoomVerifications.map((item, index) =>
      index === 0
        ? { ...item, signalAsOf: '2026-09-14', evaluationEnd: '2026-10-01' }
        : item
    )
    const report = evaluateDg2({
      approvedTickers: kiwoomApprovedTickers,
      signalAsOf: pilotSignalAsOf,
      selection: kiwoomSelectionEvidence,
      verifications,
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SELECTION:')
      )
    )
  })

  it('does not approve a genuine selection computed for an earlier, mismatched asOf', () => {
    const { decisions: earlyDecisions, quotes: earlyQuotes } =
      buildKiwoomEligibleSample(DG2_SAMPLE_SIZE, '2026-03-02')
    const earlySelection = selectDg2SampleByTradeValue(
      earlyDecisions,
      earlyQuotes,
      '2026-03-02'
    )
    const approvedTickers = earlySelection.members.map(member => member.ticker)
    const report = evaluateDg2({
      approvedTickers,
      signalAsOf: pilotSignalAsOf,
      selection: toSelectionEvidence(earlySelection),
      verifications: buildVerifications(approvedTickers, pilotSignalAsOf),
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SELECTION:')
      )
    )
  })

  it('does not approve a self-consistent but forged selection with non-six-digit tickers and a pre-signal fetch time', () => {
    const forgedTickers = Array.from(
      { length: DG2_SAMPLE_SIZE },
      (_, index) => `FAKE-TICKER-${index}`
    )
    const forgedSelection: Dg2SampleSelectionEvidence = {
      selectorVersion: DG2_SAMPLE_SELECTOR_VERSION,
      source: 'kiwoom',
      asOf: pilotSignalAsOf,
      sourceSnapshot: {
        sha256: 'a'.repeat(64),
        fetchedAt: '1999-01-01T00:00:00.000Z',
      },
      members: forgedTickers.map((ticker, index) => ({
        ticker,
        tradeValue: DG2_SAMPLE_SIZE - index,
        rank: index + 1,
      })),
    }
    const report = evaluateDg2({
      approvedTickers: forgedTickers,
      signalAsOf: pilotSignalAsOf,
      selection: forgedSelection,
      verifications: buildVerifications(forgedTickers, pilotSignalAsOf),
      ownerApproved: true,
    })

    assert.equal(report.decision, 'Conditional Go')
    assert.equal(report.blockingReasons.length, 0)
    assert.ok(
      report.conditionalReasons.some(reason =>
        reason.startsWith('DG2-SAMPLE-SELECTION:')
      )
    )
  })
})
