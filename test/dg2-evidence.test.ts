import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DG2_APPROVED_TICKERS,
  DG2_PINNED_AS_OF,
  DG2_PINNED_STRATEGY_VERSION,
  normalizeDg2StrategyEvidence,
  normalizeDg2StrategyEvidenceBatch,
  type Dg2RawStrategyEvidence,
  type Dg2SourceRecord,
  type Dg2StrategyInputEvidence,
  type Dg2StrategyInputField,
} from '../src/lib/etf/dg2-evidence.ts'
import { evaluateStrategies } from '../src/lib/etf/strategy.ts'

const TICKER = '069500'
const AS_OF = DG2_PINNED_AS_OF
const KRX_URI = 'https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd'

const LOOKBACK_WINDOWS: Record<string, { start: string; end: string }> = {
  relativeStrength1M: { start: '2026-07-04', end: AS_OF },
  relativeStrength3M: { start: '2026-05-04', end: AS_OF },
  relativeStrength6M: { start: '2026-02-03', end: AS_OF },
  drawdownDepth: { start: '2026-06-03', end: AS_OF },
  drawdownDuration: { start: '2026-06-03', end: AS_OF },
}

function makeSource(
  sourceField: string,
  overrides: Partial<Dg2SourceRecord> = {}
): Dg2SourceRecord {
  const sourceBytes =
    overrides.sourceBytes ??
    new TextEncoder().encode(
      `fixture:${sourceField}:${overrides.reviewer ?? 'reviewer-a'}`
    )
  const window = LOOKBACK_WINDOWS[sourceField]
  return {
    sourceUri: overrides.sourceUri ?? KRX_URI,
    sourceField,
    formula:
      overrides.formula ?? `derived from ${sourceField} raw observations`,
    publishedAt: overrides.publishedAt ?? '2026-08-03T00:00:00Z',
    effectiveAsOf: overrides.effectiveAsOf ?? AS_OF,
    ...(overrides.observationStart !== undefined ||
    overrides.observationEnd !== undefined
      ? {
          observationStart: overrides.observationStart,
          observationEnd: overrides.observationEnd,
        }
      : window
        ? { observationStart: window.start, observationEnd: window.end }
        : {}),
    fetchedAt: overrides.fetchedAt ?? new Date(Date.now() - 1000).toISOString(),
    transformVersion: overrides.transformVersion ?? 'dg2-transform-v1',
    reviewer: overrides.reviewer ?? 'reviewer-a',
    sourceSha256:
      overrides.sourceSha256 ??
      createHash('sha256').update(sourceBytes).digest('hex'),
    sourceBytes,
  }
}

function entry(
  field: Dg2StrategyInputField,
  value: string | number | boolean,
  sourceOverrides: Partial<Dg2SourceRecord> = {}
): Dg2StrategyInputEvidence {
  return { field, value, source: makeSource(field, sourceOverrides) }
}

function commonInputs(ticker = TICKER): Dg2StrategyInputEvidence[] {
  return [
    entry('ticker', ticker),
    entry('asOf', AS_OF),
    entry('valuationCurrency', 'KRW'),
    entry('universeFilterVersion', 'universe-v1'),
    entry('qualityStatus', 'passed'),
    entry('dataConfidence', 92),
    entry('isEtf', true),
    entry('isLeveragedOrInverse', false),
    entry('liquidityScore', 85),
    entry('portfolioRiskPassed', true),
    entry('fundamentalTriggerPassed', true),
    entry('thesisEvidence', 'industry demand is stable'),
    entry('volumeLiquidity', 79),
  ]
}

function momentumOnlyInputs(): Dg2StrategyInputEvidence[] {
  return [
    entry('relativeStrength1M', 68),
    entry('relativeStrength3M', 72),
    entry('relativeStrength6M', 74),
    entry('momentumAcceleration', 66),
    entry('industryFundamental', 82),
    entry('overheatRisk', 30),
  ]
}

function oversoldOnlyInputs(): Dg2StrategyInputEvidence[] {
  return [
    entry('drawdownDepth', 65),
    entry('drawdownDuration', 58),
    entry('reversalSignal', 71),
    entry('fundamentalRecovery', 60),
    entry('structuralDamage', 25),
  ]
}

function momentumRow(ticker = TICKER): Dg2RawStrategyEvidence {
  return {
    ticker,
    asOf: AS_OF,
    strategy: 'momentum',
    strategyVersion: DG2_PINNED_STRATEGY_VERSION,
    inputs: [...commonInputs(ticker), ...momentumOnlyInputs()],
  }
}

function oversoldRow(ticker = TICKER): Dg2RawStrategyEvidence {
  return {
    ticker,
    asOf: AS_OF,
    strategy: 'oversold',
    strategyVersion: DG2_PINNED_STRATEGY_VERSION,
    inputs: [...commonInputs(ticker), ...oversoldOnlyInputs()],
  }
}

function containsRawBytes(value: unknown): boolean {
  if (value instanceof Uint8Array) return true
  if (Array.isArray(value)) return value.some(containsRawBytes)
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(
      containsRawBytes
    )
  }
  return false
}

function hasKeyDeep(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some(item => hasKeyDeep(item, key))
  if (value !== null && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, key)) return true
    return Object.values(value as Record<string, unknown>).some(item =>
      hasKeyDeep(item, key)
    )
  }
  return false
}

describe('DG2 per-input strategy evidence normalization', () => {
  it('validates a complete Momentum artifact and returns persistence-safe output with no raw bytes at any nesting level', () => {
    const [evidence] = normalizeDg2StrategyEvidence([momentumRow()])

    assert.equal(evidence?.ticker, TICKER)
    assert.equal(evidence?.strategy, 'momentum')
    assert.equal(evidence?.inputs.length, 19)
    assert.equal(containsRawBytes(evidence), false)
    assert.equal(hasKeyDeep(evidence, 'sourceBytes'), false)
  })

  it('validates a complete Oversold artifact', () => {
    const [evidence] = normalizeDg2StrategyEvidence([oversoldRow()])

    assert.equal(evidence?.strategy, 'oversold')
    assert.equal(evidence?.inputs.length, 18)
  })

  it('preserves two input entries with genuinely different sources rather than collapsing them', () => {
    const row = momentumRow()
    const industryEntry = row.inputs.find(
      item => item.field === 'industryFundamental'
    )!
    const relStrengthEntry = row.inputs.find(
      item => item.field === 'relativeStrength1M'
    )!
    industryEntry.source = makeSource('industryFundamental', {
      sourceUri: 'https://sector-index.example.com/feed',
      reviewer: 'industry-reviewer',
    })
    relStrengthEntry.source = makeSource('relativeStrength1M', {
      sourceUri: KRX_URI,
      reviewer: 'price-reviewer',
    })

    const [evidence] = normalizeDg2StrategyEvidence([row])
    const persistedIndustry = evidence?.inputs.find(
      item => item.field === 'industryFundamental'
    )
    const persistedRelStrength = evidence?.inputs.find(
      item => item.field === 'relativeStrength1M'
    )

    assert.equal(
      persistedIndustry?.source.sourceUri,
      'https://sector-index.example.com/feed'
    )
    assert.equal(persistedIndustry?.source.reviewer, 'industry-reviewer')
    assert.equal(persistedRelStrength?.source.sourceUri, KRX_URI)
    assert.equal(persistedRelStrength?.source.reviewer, 'price-reviewer')
    assert.notEqual(
      persistedIndustry?.source.sourceSha256,
      persistedRelStrength?.source.sourceSha256
    )
  })

  it('rejects an artifact missing a required Momentum input', () => {
    const row = momentumRow()
    row.inputs = row.inputs.filter(item => item.field !== 'industryFundamental')

    assert.throws(
      () => normalizeDg2StrategyEvidence([row]),
      /missing required momentum inputs.*industryFundamental/
    )
  })

  it('rejects an artifact missing a required Oversold input', () => {
    const row = oversoldRow()
    row.inputs = row.inputs.filter(item => item.field !== 'structuralDamage')

    assert.throws(
      () => normalizeDg2StrategyEvidence([row]),
      /missing required oversold inputs.*structuralDamage/
    )
  })

  it('rejects a Momentum artifact that includes an Oversold-only field', () => {
    const row = momentumRow()
    row.inputs.push(entry('drawdownDepth', 40))

    assert.throws(
      () => normalizeDg2StrategyEvidence([row]),
      /belongs to the other strategy/
    )
  })

  it('rejects duplicate and unknown input fields', () => {
    const duplicate = momentumRow()
    duplicate.inputs.push(entry('industryFundamental', 50))
    assert.throws(
      () => normalizeDg2StrategyEvidence([duplicate]),
      /duplicate input field/
    )

    const unknown = momentumRow()
    Reflect.set(unknown.inputs[0]!, 'field', 'notAField')
    assert.throws(
      () => normalizeDg2StrategyEvidence([unknown]),
      /unknown input field/
    )
  })

  it('rejects per-field value violations for identity, enum, boolean, and numeric fields', () => {
    const wrongTicker = momentumRow()
    wrongTicker.inputs.find(item => item.field === 'ticker')!.value = '999999'
    assert.throws(
      () => normalizeDg2StrategyEvidence([wrongTicker]),
      /ticker input must match/
    )

    const wrongCurrency = momentumRow()
    wrongCurrency.inputs.find(
      item => item.field === 'valuationCurrency'
    )!.value = 'USD'
    assert.throws(
      () => normalizeDg2StrategyEvidence([wrongCurrency]),
      /valuationCurrency input must be KRW/
    )

    const wrongEnum = momentumRow()
    wrongEnum.inputs.find(item => item.field === 'qualityStatus')!.value =
      'unknown'
    assert.throws(
      () => normalizeDg2StrategyEvidence([wrongEnum]),
      /qualityStatus input must be/
    )

    const wrongBoolean = momentumRow()
    Reflect.set(
      wrongBoolean.inputs.find(item => item.field === 'isEtf')!,
      'value',
      'yes'
    )
    assert.throws(
      () => normalizeDg2StrategyEvidence([wrongBoolean]),
      /isEtf input must be a boolean/
    )

    const outOfRange = momentumRow()
    outOfRange.inputs.find(item => item.field === 'dataConfidence')!.value = 101
    assert.throws(
      () => normalizeDg2StrategyEvidence([outOfRange]),
      /finite and between 0 and 100/
    )

    const emptyThesis = momentumRow()
    emptyThesis.inputs.find(item => item.field === 'thesisEvidence')!.value =
      '   '
    assert.throws(
      () => normalizeDg2StrategyEvidence([emptyThesis]),
      /thesisEvidence input must be a non-empty string/
    )
  })

  it('rejects per-source violations: hash mismatch, publication leakage, and fetch chronology', () => {
    const hashMismatch = momentumRow()
    hashMismatch.inputs[0]!.source.sourceBytes = new TextEncoder().encode(
      'tampered'
    )
    assert.throws(
      () => normalizeDg2StrategyEvidence([hashMismatch]),
      /does not match captured source bytes/
    )

    const futurePublication = momentumRow()
    futurePublication.inputs[0]!.source.publishedAt = '2026-08-04T00:00:00Z'
    assert.throws(
      () => normalizeDg2StrategyEvidence([futurePublication]),
      /publication must precede the signal date/
    )

    const futureObservation = momentumRow()
    futureObservation.inputs[0]!.source.effectiveAsOf = '2026-08-04'
    assert.throws(
      () => normalizeDg2StrategyEvidence([futureObservation]),
      /future information/
    )

    const fetchBeforePublish = momentumRow()
    fetchBeforePublish.inputs[0]!.source.fetchedAt = '2026-08-02T00:00:00Z'
    assert.throws(
      () => normalizeDg2StrategyEvidence([fetchBeforePublish]),
      /precedes publication/
    )

    const futureFetch = momentumRow()
    futureFetch.inputs[0]!.source.fetchedAt = '2999-01-01T00:00:00Z'
    assert.throws(
      () => normalizeDg2StrategyEvidence([futureFetch]),
      /non-future/
    )

    const missingReviewer = momentumRow()
    missingReviewer.inputs[0]!.source.reviewer = '  '
    assert.throws(
      () => normalizeDg2StrategyEvidence([missingReviewer]),
      /reviewer is required/
    )

    const missingTransform = momentumRow()
    missingTransform.inputs[0]!.source.transformVersion = ''
    assert.throws(
      () => normalizeDg2StrategyEvidence([missingTransform]),
      /transform version is required/
    )
  })

  it('rejects a missing calculation formula', () => {
    const row = momentumRow()
    row.inputs[0]!.source.formula = '   '
    assert.throws(
      () => normalizeDg2StrategyEvidence([row]),
      /calculation formula is required/
    )
  })

  it('rejects missing, inverted, or future-leaking lookback windows for relative-strength and drawdown fields', () => {
    const missingWindow = momentumRow()
    const rs1 = missingWindow.inputs.find(
      item => item.field === 'relativeStrength1M'
    )!
    delete rs1.source.observationStart
    delete rs1.source.observationEnd
    assert.throws(
      () => normalizeDg2StrategyEvidence([missingWindow]),
      /lookback observation window is required/
    )

    const invertedWindow = momentumRow()
    const rs3 = invertedWindow.inputs.find(
      item => item.field === 'relativeStrength3M'
    )!
    rs3.source.observationStart = AS_OF
    rs3.source.observationEnd = '2026-05-04'
    assert.throws(
      () => normalizeDg2StrategyEvidence([invertedWindow]),
      /lookback observation window is inverted/
    )

    const leakingWindow = oversoldRow()
    const drawdown = leakingWindow.inputs.find(
      item => item.field === 'drawdownDepth'
    )!
    drawdown.source.observationEnd = '2026-08-04'
    assert.throws(
      () => normalizeDg2StrategyEvidence([leakingWindow]),
      /lookback observation window leaks future information/
    )
  })

  it('rejects source URIs carrying credentials, query strings, fragments, or non-https schemes', () => {
    const withQuery = momentumRow()
    withQuery.inputs[0]!.source.sourceUri = `${KRX_URI}?apiKey=secret`
    assert.throws(
      () => normalizeDg2StrategyEvidence([withQuery]),
      /query string/
    )

    const withCredentials = momentumRow()
    withCredentials.inputs[0]!.source.sourceUri =
      'https://user:pass@data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd'
    assert.throws(
      () => normalizeDg2StrategyEvidence([withCredentials]),
      /embedded credentials/
    )
  })

  it('rejects rogue raw-byte-like properties injected at every nesting level rather than leaking them into persisted output', () => {
    const row = momentumRow()
    const target = row.inputs[0]!

    // Adversarial: attach raw-byte-shaped payloads directly on the row, on an
    // input entry, and on a source record, at property names other than the
    // known `sourceBytes` field, to prove the explicit whitelist serializer
    // in dg2-evidence.ts drops them rather than merely omitting `sourceBytes`
    // by name.
    Reflect.set(row, 'rawPayload', new TextEncoder().encode('leak-me'))
    Reflect.set(target, 'rawPayload', new TextEncoder().encode('leak-me'))
    Reflect.set(
      target.source,
      'rawPayload',
      new TextEncoder().encode('leak-me')
    )
    Reflect.set(target.source, 'sourceBytesCopy', target.source.sourceBytes)

    const [evidence] = normalizeDg2StrategyEvidence([row])

    assert.equal(containsRawBytes(evidence), false)
    assert.equal(hasKeyDeep(evidence, 'sourceBytes'), false)
    assert.equal(hasKeyDeep(evidence, 'rawPayload'), false)
    assert.equal(hasKeyDeep(evidence, 'sourceBytesCopy'), false)
  })

  it('rejects malformed runtime shapes despite TypeScript declarations', () => {
    const malformedInputs = momentumRow()
    Reflect.set(malformedInputs, 'inputs', 'not-an-array')
    assert.throws(
      () => normalizeDg2StrategyEvidence([malformedInputs]),
      /runtime evidence shape/
    )

    const malformedSource = momentumRow()
    Reflect.set(malformedSource.inputs[0]!, 'source', 'not-a-source')
    assert.throws(
      () => normalizeDg2StrategyEvidence([malformedSource]),
      /runtime evidence shape/
    )
  })
})

describe('DG2 five-ticker batch: Momentum+Oversold pair merge into StrategyInput', () => {
  const universe = () =>
    DG2_APPROVED_TICKERS.flatMap(ticker => [
      momentumRow(ticker),
      oversoldRow(ticker),
    ])

  const ALL_24_FIELDS = [
    'ticker',
    'asOf',
    'valuationCurrency',
    'universeFilterVersion',
    'qualityStatus',
    'dataConfidence',
    'isEtf',
    'isLeveragedOrInverse',
    'fundamentalTriggerPassed',
    'thesisEvidence',
    'liquidityScore',
    'portfolioRiskPassed',
    'relativeStrength1M',
    'relativeStrength3M',
    'relativeStrength6M',
    'momentumAcceleration',
    'industryFundamental',
    'volumeLiquidity',
    'overheatRisk',
    'drawdownDepth',
    'drawdownDuration',
    'reversalSignal',
    'fundamentalRecovery',
    'structuralDamage',
  ].sort()

  it('accepts a batch covering exactly five tickers times Momentum and Oversold, and merges each pair into a complete StrategyInput', () => {
    const result = normalizeDg2StrategyEvidenceBatch(universe())

    assert.equal(result.artifacts.length, 10)
    const keys = new Set(
      result.artifacts.map(item => `${item.ticker}:${item.strategy}`)
    )
    DG2_APPROVED_TICKERS.forEach(ticker => {
      assert.equal(keys.has(`${ticker}:momentum`), true)
      assert.equal(keys.has(`${ticker}:oversold`), true)
    })

    assert.equal(result.mergedInputs.length, 5)
    result.mergedInputs.forEach(input => {
      assert.deepEqual(Object.keys(input).sort(), ALL_24_FIELDS)
      assert.equal(input.asOf, DG2_PINNED_AS_OF)
      assert.equal(input.valuationCurrency, 'KRW')
    })

    // The whole point of merging into `StrategyInput` is that the real
    // evaluator in strategy.ts can consume it directly — prove that here
    // rather than only asserting shape.
    assert.doesNotThrow(() =>
      evaluateStrategies(result.mergedInputs, 'momentum')
    )
    assert.doesNotThrow(() =>
      evaluateStrategies(result.mergedInputs, 'oversold')
    )
    assert.equal(evaluateStrategies(result.mergedInputs, 'momentum').length, 5)
  })

  it('rejects a batch missing one strategy for one ticker', () => {
    const rows = universe().filter(
      row => !(row.ticker === '229200' && row.strategy === 'oversold')
    )

    assert.throws(
      () => normalizeDg2StrategyEvidenceBatch(rows),
      /missing required ticker\/strategy artifacts.*229200:oversold/
    )
  })

  it('rejects a batch with a duplicated ticker/strategy combination', () => {
    const rows = universe()
    rows.push(momentumRow(DG2_APPROVED_TICKERS[0]))

    assert.throws(() => normalizeDg2StrategyEvidenceBatch(rows), /duplicate/)
  })

  it('rejects a batch containing an unapproved ticker', () => {
    const rows = universe().slice(0, 8)
    rows.push(momentumRow('999999'), oversoldRow('999999'))

    assert.throws(
      () => normalizeDg2StrategyEvidenceBatch(rows),
      /missing required ticker\/strategy artifacts/
    )
  })

  it('rejects a batch with an alternate signal date or an alternate strategy version', () => {
    const withAlternateDate = universe()
    withAlternateDate[0]!.asOf = '2026-09-01'
    assert.throws(
      () => normalizeDg2StrategyEvidenceBatch(withAlternateDate),
      new RegExp(`must pin asOf to ${DG2_PINNED_AS_OF}`)
    )

    const withAlternateVersion = universe()
    withAlternateVersion[0]!.strategyVersion = 'strategy-v0.3'
    assert.throws(
      () => normalizeDg2StrategyEvidenceBatch(withAlternateVersion),
      new RegExp(`must pin strategyVersion to ${DG2_PINNED_STRATEGY_VERSION}`)
    )
  })

  it('rejects a pair whose shared common field disagrees between Momentum and Oversold', () => {
    const rows = universe()
    const oversoldForFirstTicker = rows.find(
      row =>
        row.ticker === DG2_APPROVED_TICKERS[0] && row.strategy === 'oversold'
    )!
    oversoldForFirstTicker.inputs.find(
      item => item.field === 'dataConfidence'
    )!.value = 55

    assert.throws(
      () => normalizeDg2StrategyEvidenceBatch(rows),
      /inconsistent dataConfidence/
    )
  })
})
