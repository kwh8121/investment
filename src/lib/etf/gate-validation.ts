import { DG2_SAMPLE_SELECTOR_VERSION, DG2_SAMPLE_SIZE } from './collection.ts'

export type GateDecision = 'Go' | 'Conditional Go' | 'No-Go'

export interface GateCheck {
  id: string
  passed: boolean
  blocking: boolean
  reason: string
}

export interface Dg2PriceVerification {
  ticker: string
  signalAsOf: string
  evaluationEnd: string
  hasPriceData: boolean
  priceReturnKrw: number | null
  benchmarkReturnKrw: number | null
  dividendVerified: boolean
  strategyInputVerified: boolean
  noFutureLeakage: boolean
}

export interface Dg2SampleSelectionMember {
  ticker: string
  tradeValue: number
  rank: number
}

export interface Dg2SampleSelectionEvidence {
  selectorVersion: string
  source: 'kiwoom'
  asOf: string
  sourceSnapshot: {
    sha256: string
    fetchedAt: string
  }
  members: Dg2SampleSelectionMember[]
}

export interface Dg2ApprovalInput {
  approvedTickers: string[]
  signalAsOf: string
  selection: Dg2SampleSelectionEvidence | null
  verifications: Dg2PriceVerification[]
  ownerApproved: boolean
}

export interface Dg3ApprovalInput {
  rollingWindowYears: number
  includesDownturn2022: boolean
  dividendReinvestmentVerified: boolean
  transactionCostsVerified: boolean
  delistedUniverseAssessed: boolean
  futureLeakageVerified: boolean
  sensitivityReviewed: boolean
  ownerApproved: boolean
}

export interface Dg4ApprovalInput {
  implementationQaPassed: boolean
  browserVerificationPassed: boolean
  checkAllPassed: boolean
  operationalBurdenReviewed: boolean
  ownerApproved: boolean
}

export interface GateReport {
  gate: 'DG2' | 'DG3' | 'DG4'
  decision: GateDecision
  checks: GateCheck[]
  blockingReasons: string[]
  conditionalReasons: string[]
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/i
const KOREAN_TICKER_PATTERN = /^\d{6}$/

function check(
  id: string,
  passed: boolean,
  blocking: boolean,
  reason: string
): GateCheck {
  return { id, passed, blocking, reason }
}

function decisionFor(checks: GateCheck[]): GateDecision {
  if (checks.some(item => !item.passed && item.blocking)) return 'No-Go'
  if (checks.some(item => !item.passed)) return 'Conditional Go'
  return 'Go'
}

function report(gate: GateReport['gate'], checks: GateCheck[]): GateReport {
  const decision = decisionFor(checks)
  return {
    gate,
    decision,
    checks,
    blockingReasons: checks
      .filter(item => !item.passed && item.blocking)
      .map(item => `${item.id}: ${item.reason}`),
    conditionalReasons: checks
      .filter(item => !item.passed && !item.blocking)
      .map(item => `${item.id}: ${item.reason}`),
  }
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  if (!Number.isFinite(date.getTime())) return false
  return date.toISOString().slice(0, 10) === value
}

function hasApprovedUniverse(tickers: string[]): boolean {
  return (
    tickers.length >= 1 &&
    tickers.length <= DG2_SAMPLE_SIZE &&
    new Set(tickers).size === tickers.length
  )
}

function hasDg2SampleSize(tickers: string[]): boolean {
  return tickers.length === DG2_SAMPLE_SIZE
}

function isValidSha256(value: unknown): boolean {
  return typeof value === 'string' && SHA256_HEX_PATTERN.test(value)
}

function isValidIsoDateValue(value: unknown): value is string {
  return typeof value === 'string' && isIsoDate(value)
}

function hasValidTickerFormat(value: unknown): boolean {
  return typeof value === 'string' && KOREAN_TICKER_PATTERN.test(value)
}

function isValidFetchTimestamp(value: unknown, notBefore: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false
  const fetchedAtMs = Date.parse(value)
  if (!Number.isFinite(fetchedAtMs)) return false
  const notBeforeMs = Date.parse(`${notBefore}T00:00:00Z`)
  if (!Number.isFinite(notBeforeMs)) return false
  return fetchedAtMs >= notBeforeMs
}

function hasValidSelectionOrder(members: Dg2SampleSelectionMember[]): boolean {
  const ranks = members.map(member => member.rank)
  const uniqueRanks = new Set(ranks)
  if (uniqueRanks.size !== members.length) return false
  for (let rank = 1; rank <= members.length; rank += 1) {
    if (!uniqueRanks.has(rank)) return false
  }
  const byRank = [...members].sort((a, b) => a.rank - b.rank)
  for (let index = 1; index < byRank.length; index += 1) {
    const previous = byRank[index - 1]!
    const current = byRank[index]!
    if (previous.tradeValue < current.tradeValue) return false
    if (
      previous.tradeValue === current.tradeValue &&
      previous.ticker > current.ticker
    )
      return false
  }
  return true
}

function hasValidDg2SampleSelection(input: Dg2ApprovalInput): boolean {
  const { selection, approvedTickers, signalAsOf, verifications } = input
  if (!isIsoDate(signalAsOf)) return false
  if (!verifications.every(item => item.signalAsOf === signalAsOf)) {
    return false
  }
  if (!approvedTickers.every(hasValidTickerFormat)) return false
  if (!selection) return false
  if (selection.selectorVersion !== DG2_SAMPLE_SELECTOR_VERSION) return false
  if (selection.source !== 'kiwoom') return false
  if (!isValidIsoDateValue(selection.asOf)) return false
  if (selection.asOf !== signalAsOf) return false
  if (!isValidSha256(selection.sourceSnapshot?.sha256)) return false
  if (
    !isValidFetchTimestamp(selection.sourceSnapshot?.fetchedAt, selection.asOf)
  ) {
    return false
  }
  if (!Array.isArray(selection.members)) return false
  if (selection.members.length !== DG2_SAMPLE_SIZE) return false
  if (!selection.members.every(member => hasValidTickerFormat(member.ticker))) {
    return false
  }
  const memberTickers = selection.members.map(member => member.ticker)
  if (new Set(memberTickers).size !== DG2_SAMPLE_SIZE) return false
  if (!hasValidSelectionOrder(selection.members)) return false
  const approvedSet = new Set(approvedTickers)
  const memberSet = new Set(memberTickers)
  if (approvedSet.size !== memberSet.size) return false
  if (![...approvedSet].every(ticker => memberSet.has(ticker))) return false
  return true
}

export function evaluateDg2(input: Dg2ApprovalInput): GateReport {
  const checks: GateCheck[] = [
    check(
      'DG2-UNIVERSE',
      hasApprovedUniverse(input.approvedTickers),
      true,
      'the DG2 universe must contain no duplicate tickers and no more than 30 ETFs'
    ),
    check(
      'DG2-SAMPLE-SIZE',
      hasDg2SampleSize(input.approvedTickers),
      false,
      'DG2 Go requires exactly 30 eligible Korean ETFs ranked by Kiwoom trade value; the five-ETF pilot is evidence-readiness history only'
    ),
    check(
      'DG2-SAMPLE-SELECTION',
      hasValidDg2SampleSelection(input),
      false,
      'the DG2 sample must be backed by a retained Kiwoom trade-value top-30 selection whose asOf equals the declared sample signalAsOf, whose source snapshot hash and fetch time (not before that asOf) are valid, whose members and approved tickers are six-digit Korean ticker codes with valid ranks, and whose tickers exactly match the approved sample, with every verification sharing the declared sample signalAsOf'
    ),
    check(
      'DG2-OWNER',
      input.ownerApproved,
      true,
      'Owner/Approver decision is required'
    ),
  ]
  const verificationCounts = new Map<string, number>()
  input.verifications.forEach(item => {
    verificationCounts.set(
      item.ticker,
      (verificationCounts.get(item.ticker) ?? 0) + 1
    )
  })
  checks.push(
    check(
      'DG2-VERIFICATIONS',
      input.verifications.length === input.approvedTickers.length &&
        input.approvedTickers.every(
          ticker => verificationCounts.get(ticker) === 1
        ),
      true,
      'exactly one verification record is required for every ETF in the DG2 sample'
    )
  )
  const byTicker = new Map(input.verifications.map(item => [item.ticker, item]))
  input.approvedTickers.forEach(ticker => {
    const verification = byTicker.get(ticker)
    checks.push(
      check(
        `DG2-PRICE-${ticker}`,
        Boolean(
          verification?.hasPriceData &&
            verification.priceReturnKrw !== null &&
            verification.benchmarkReturnKrw !== null &&
            Number.isFinite(verification.priceReturnKrw) &&
            Number.isFinite(verification.benchmarkReturnKrw)
        ),
        true,
        'actual price and benchmark observations are required'
      )
    )
    checks.push(
      check(
        `DG2-DATE-${ticker}`,
        Boolean(
          verification &&
            isIsoDate(verification.signalAsOf) &&
            isIsoDate(verification.evaluationEnd) &&
            verification.evaluationEnd > verification.signalAsOf
        ),
        true,
        'signalAsOf and evaluationEnd must be valid ISO dates with evaluation after signal'
      )
    )
    checks.push(
      check(
        `DG2-ORDER-${ticker}`,
        Boolean(verification && verification.noFutureLeakage),
        true,
        'evaluation must be after signalAsOf with no future leakage'
      )
    )
    checks.push(
      check(
        `DG2-DIVIDEND-${ticker}`,
        Boolean(verification?.dividendVerified),
        false,
        'distribution source and ex-date are not verified'
      )
    )
    checks.push(
      check(
        `DG2-INPUT-${ticker}`,
        Boolean(verification?.strategyInputVerified),
        false,
        'strategy-time fundamental and industry trigger inputs are not verified'
      )
    )
  })
  return report('DG2', checks)
}

export function evaluateDg3(input: Dg3ApprovalInput): GateReport {
  const checks: GateCheck[] = [
    check(
      'DG3-WINDOW',
      input.rollingWindowYears >= 3 && input.rollingWindowYears <= 5,
      true,
      'real rolling backtest must cover three to five years'
    ),
    check(
      'DG3-DOWNTURN',
      input.includesDownturn2022,
      true,
      'a 2022-style downturn must be included'
    ),
    check(
      'DG3-ORDER',
      input.futureLeakageVerified,
      true,
      'future-information leakage must be explicitly verified'
    ),
    check(
      'DG3-OWNER',
      input.ownerApproved,
      true,
      'Owner/Approver decision is required'
    ),
    check(
      'DG3-DIVIDEND',
      input.dividendReinvestmentVerified,
      false,
      'distribution reinvestment data is not connected'
    ),
    check(
      'DG3-COST',
      input.transactionCostsVerified,
      false,
      'transaction cost data is not connected'
    ),
    check(
      'DG3-DELISTED',
      input.delistedUniverseAssessed,
      false,
      'delisted instruments and survivorship bias are not assessed'
    ),
    check(
      'DG3-SENSITIVITY',
      input.sensitivityReviewed,
      false,
      'sensitivity report is not reviewed'
    ),
  ]
  return report('DG3', checks)
}

export function evaluateDg4(
  input: Dg4ApprovalInput,
  dg2: GateReport,
  dg3: GateReport
): GateReport {
  return report('DG4', [
    check('DG4-DG2', dg2.decision === 'Go', true, 'DG2 must be Go'),
    check('DG4-DG3', dg3.decision === 'Go', true, 'DG3 must be Go'),
    check(
      'DG4-QA',
      input.implementationQaPassed,
      true,
      'implementation QA must pass'
    ),
    check(
      'DG4-BROWSER',
      input.browserVerificationPassed,
      true,
      'browser responsive and accessibility verification must pass'
    ),
    check(
      'DG4-CHECKS',
      input.checkAllPassed,
      true,
      'the full repository check must pass'
    ),
    check(
      'DG4-OPERATIONS',
      input.operationalBurdenReviewed,
      false,
      'approved exceptions and operational burden must be reviewed'
    ),
    check(
      'DG4-OWNER',
      input.ownerApproved,
      true,
      'Owner/Approver decision is required'
    ),
  ])
}

export function evaluateProjectState(
  dg2Input: Dg2ApprovalInput,
  dg3Input: Dg3ApprovalInput,
  dg4Input: Dg4ApprovalInput
): {
  dg2: GateReport
  dg3: GateReport
  dg4: GateReport
  canStartForwardValidation: boolean
} {
  const dg2 = evaluateDg2(dg2Input)
  const dg3 = evaluateDg3(dg3Input)
  const dg4 = evaluateDg4(dg4Input, dg2, dg3)

  return {
    dg2,
    dg3,
    dg4,
    canStartForwardValidation: dg4.decision === 'Go',
  }
}

export function evaluateApprovalState(
  dg2: Dg2ApprovalInput,
  dg3: Dg3ApprovalInput,
  dg4: Dg4ApprovalInput
): ReturnType<typeof evaluateProjectState> {
  return evaluateProjectState(dg2, dg3, dg4)
}
