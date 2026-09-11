import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'

import {
  DG2_APPROVED_TICKERS,
  DG2_PINNED_AS_OF,
  DG2_PINNED_STRATEGY_VERSION,
  type Dg2SourceRecord,
  type Dg2StrategyInputEvidence,
  type Dg2StrategyInputField,
} from '../src/lib/etf/dg2-evidence.ts'
import {
  normalizeKrxDg2Window,
  normalizeKrxDg2WindowBatch,
  type KrxDg2WindowInput,
} from '../src/lib/etf/krx-dg2-adapter.ts'
import {
  evaluateStrategies,
  type StrategyName,
} from '../src/lib/etf/strategy.ts'

const AS_OF = DG2_PINNED_AS_OF
const KRX_URI = 'https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd'

function makeSource(
  sourceField: string,
  overrides: Partial<Dg2SourceRecord> = {}
): Dg2SourceRecord {
  const sourceBytes =
    overrides.sourceBytes ?? new TextEncoder().encode(`fixture:${sourceField}`)
  return {
    sourceUri: overrides.sourceUri ?? 'https://quality-gate.example.com/dg2',
    sourceField,
    formula: overrides.formula ?? `direct read of ${sourceField}`,
    publishedAt: overrides.publishedAt ?? '2026-08-03T00:00:00Z',
    effectiveAsOf: overrides.effectiveAsOf ?? AS_OF,
    fetchedAt: overrides.fetchedAt ?? new Date(Date.now() - 1000).toISOString(),
    transformVersion: overrides.transformVersion ?? 'dg2-other-transform-v1',
    reviewer: overrides.reviewer ?? 'other-reviewer',
    sourceSha256:
      overrides.sourceSha256 ??
      createHash('sha256').update(sourceBytes).digest('hex'),
    sourceBytes,
  }
}

function otherEntry(
  field: Dg2StrategyInputField,
  value: string | number | boolean
): Dg2StrategyInputEvidence {
  return { field, value, source: makeSource(field) }
}

function otherInputsFor(strategy: StrategyName): Dg2StrategyInputEvidence[] {
  const common: Dg2StrategyInputEvidence[] = [
    otherEntry('valuationCurrency', 'KRW'),
    otherEntry('universeFilterVersion', 'universe-v1'),
    otherEntry('qualityStatus', 'passed'),
    otherEntry('dataConfidence', 92),
    otherEntry('isEtf', true),
    otherEntry('isLeveragedOrInverse', false),
    otherEntry('liquidityScore', 85),
    otherEntry('portfolioRiskPassed', true),
    otherEntry('fundamentalTriggerPassed', true),
    otherEntry('thesisEvidence', 'industry demand is stable'),
  ]
  return strategy === 'momentum'
    ? [
        ...common,
        otherEntry('momentumAcceleration', 66),
        otherEntry('industryFundamental', 82),
        otherEntry('overheatRisk', 30),
      ]
    : [
        ...common,
        otherEntry('drawdownDepth', 65),
        otherEntry('drawdownDuration', 58),
        otherEntry('reversalSignal', 71),
        otherEntry('fundamentalRecovery', 60),
        otherEntry('structuralDamage', 25),
      ]
}

function input(
  ticker = '069500',
  strategy: StrategyName = 'momentum'
): KrxDg2WindowInput {
  const sourceBytes = new TextEncoder().encode(
    JSON.stringify({ ISU_CD: ticker, TDD_CLSPRC: '99105', BAS_DD: '20260803' })
  )
  return {
    ticker,
    asOf: AS_OF,
    strategy,
    strategyVersion: DG2_PINNED_STRATEGY_VERSION,
    row: {
      BAS_DD: '20260803',
      ISU_CD: ticker,
      ISU_NM: 'KODEX 200',
      TDD_CLSPRC: '99,105',
      NAV: '99100',
      ACC_TRDVOL: '1000000',
    },
    krxDerivedInputs: [
      {
        field: 'ticker',
        value: ticker,
        sourceField: 'ISU_CD',
        formula: 'direct read of ISU_CD',
        effectiveAsOf: AS_OF,
      },
      {
        field: 'asOf',
        value: AS_OF,
        sourceField: 'BAS_DD',
        formula: 'direct read of BAS_DD',
        effectiveAsOf: AS_OF,
      },
      {
        field: 'volumeLiquidity',
        value: 79,
        sourceField: 'ACC_TRDVOL',
        formula: 'ACC_TRDVOL percentile',
        effectiveAsOf: AS_OF,
      },
      ...(strategy === 'momentum'
        ? [
            {
              field: 'relativeStrength1M' as const,
              value: 68,
              sourceField: 'TDD_CLSPRC[1M]',
              formula: '1M price change percentile',
              effectiveAsOf: AS_OF,
              observationStart: '2026-07-04',
              observationEnd: AS_OF,
            },
            {
              field: 'relativeStrength3M' as const,
              value: 72,
              sourceField: 'TDD_CLSPRC[3M]',
              formula: '3M price change percentile',
              effectiveAsOf: AS_OF,
              observationStart: '2026-05-04',
              observationEnd: AS_OF,
            },
            {
              field: 'relativeStrength6M' as const,
              value: 74,
              sourceField: 'TDD_CLSPRC[6M]',
              formula: '6M price change percentile',
              effectiveAsOf: AS_OF,
              observationStart: '2026-02-03',
              observationEnd: AS_OF,
            },
          ]
        : [
            {
              field: 'drawdownDepth' as const,
              value: 65,
              sourceField: 'TDD_CLSPRC[drawdown]',
              formula: 'peak-to-trough drawdown percentile',
              effectiveAsOf: AS_OF,
              observationStart: '2026-06-03',
              observationEnd: AS_OF,
            },
            {
              field: 'drawdownDuration' as const,
              value: 58,
              sourceField: 'BAS_DD[drawdown]',
              formula: 'drawdown duration percentile',
              effectiveAsOf: AS_OF,
              observationStart: '2026-06-03',
              observationEnd: AS_OF,
            },
          ]),
    ],
    capturedSource: {
      sourceUri: KRX_URI,
      sourceBytes,
      publishedAt: '2026-08-03T00:00:00Z',
      fetchedAt: new Date(Date.now() - 1000).toISOString(),
      transformVersion: 'dg2-krx-transform-v1',
      reviewer: 'krx-reviewer',
    },
    otherInputs:
      strategy === 'momentum'
        ? otherInputsFor(strategy)
        : otherInputsFor(strategy).filter(
            item =>
              item.field !== 'drawdownDepth' &&
              item.field !== 'drawdownDuration'
          ),
  }
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

describe('KRX DG2 adapter', () => {
  it('normalizes a KRX-derived Momentum artifact with shared and independent per-input provenance', () => {
    const evidence = normalizeKrxDg2Window(input())

    assert.equal(evidence.ticker, '069500')
    assert.equal(evidence.strategy, 'momentum')
    assert.equal(evidence.inputs.length, 19)
    const volumeEntry = evidence.inputs.find(
      item => item.field === 'volumeLiquidity'
    )
    const industryEntry = evidence.inputs.find(
      item => item.field === 'industryFundamental'
    )
    assert.equal(volumeEntry?.source.sourceUri, KRX_URI)
    assert.equal(
      industryEntry?.source.sourceUri,
      'https://quality-gate.example.com/dg2'
    )
    assert.notEqual(
      volumeEntry?.source.sourceUri,
      industryEntry?.source.sourceUri
    )
    assert.equal(hasKeyDeep(evidence, 'sourceBytes'), false)
  })

  it('normalizes a KRX-derived Oversold artifact', () => {
    const evidence = normalizeKrxDg2Window(input('069500', 'oversold'))

    assert.equal(evidence.strategy, 'oversold')
    assert.equal(evidence.inputs.length, 18)
  })

  it('requires the KRX row to match the declared ticker and signal date', () => {
    const mismatchedTicker = input()
    mismatchedTicker.row.ISU_CD = '102110'
    assert.throws(
      () => normalizeKrxDg2Window(mismatchedTicker),
      /does not match ticker/
    )

    const mismatchedDate = input()
    mismatchedDate.row.BAS_DD = '20260804'
    assert.throws(
      () => normalizeKrxDg2Window(mismatchedDate),
      /does not match the DG2 signal date/
    )
  })

  it('rejects an unapproved (non-KRX) captured source URI', () => {
    const candidate = input()
    candidate.capturedSource.sourceUri = 'https://example.invalid/krx'
    assert.throws(() => normalizeKrxDg2Window(candidate), /not approved/)
  })

  it('hashes the captured source bytes directly and shares that hash across every KRX-derived field', () => {
    const candidate = input()
    const expectedHash = createHash('sha256')
      .update(candidate.capturedSource.sourceBytes)
      .digest('hex')

    const evidence = normalizeKrxDg2Window(candidate)
    const krxFields = ['ticker', 'asOf', 'volumeLiquidity'] as const
    krxFields.forEach(field => {
      const found = evidence.inputs.find(item => item.field === field)
      assert.equal(found?.source.sourceSha256, expectedHash)
    })
  })

  it('carries a lookback observation window on relative-strength and drawdown fields', () => {
    const momentumEvidence = normalizeKrxDg2Window(input())
    const rs1 = momentumEvidence.inputs.find(
      item => item.field === 'relativeStrength1M'
    )
    assert.equal(rs1?.source.observationStart, '2026-07-04')
    assert.equal(rs1?.source.observationEnd, AS_OF)

    const oversoldEvidence = normalizeKrxDg2Window(input('069500', 'oversold'))
    const drawdown = oversoldEvidence.inputs.find(
      item => item.field === 'drawdownDepth'
    )
    assert.equal(drawdown?.source.observationStart, '2026-06-03')
    assert.equal(drawdown?.source.observationEnd, AS_OF)
  })

  it('rejects a batch missing an Oversold artifact for one ticker', () => {
    assert.throws(() => {
      const rows = DG2_APPROVED_TICKERS.flatMap(ticker => {
        const rows = [input(ticker, 'momentum')]
        if (ticker !== '229200') rows.push(input(ticker, 'oversold'))
        return rows
      })
      normalizeKrxDg2WindowBatch(rows)
    }, /missing required ticker\/strategy artifacts.*229200:oversold/)
  })
})

describe('KRX DG2 adapter batch normalization', () => {
  const universe = () =>
    DG2_APPROVED_TICKERS.flatMap(ticker => [
      input(ticker, 'momentum'),
      input(ticker, 'oversold'),
    ])

  it('normalizes a batch covering exactly the five approved tickers times both strategies and merges each pair into a usable StrategyInput', () => {
    const result = normalizeKrxDg2WindowBatch(universe())

    assert.equal(result.artifacts.length, 10)
    const keys = new Set(
      result.artifacts.map(item => `${item.ticker}:${item.strategy}`)
    )
    DG2_APPROVED_TICKERS.forEach(ticker => {
      assert.equal(keys.has(`${ticker}:momentum`), true)
      assert.equal(keys.has(`${ticker}:oversold`), true)
    })

    assert.equal(result.mergedInputs.length, 5)
    assert.doesNotThrow(() =>
      evaluateStrategies(result.mergedInputs, 'momentum')
    )
    assert.doesNotThrow(() =>
      evaluateStrategies(result.mergedInputs, 'oversold')
    )
  })
})
