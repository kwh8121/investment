import type { GateResult, StrategyName } from '../etf/strategy.ts'

export interface GuideRisk {
  risks: string[]
  maxLossPct: number
  rewardRiskRatio: number
}

export interface GuidePublicationInput {
  ticker: string
  strategy: StrategyName
  strategyVersion: string
  universeFilterVersion: string
  asOf: string
  approvedAt: string
  snapshotId: string
  qualityStatus: 'passed' | 'warning' | 'blocked'
  gates: GateResult[]
  thesis: string
  triggers: string[]
  invalidation: string
  risk: GuideRisk
  additionalBuy?: {
    thesisMaintained: boolean
    riskRewardImproved: boolean
  }
  correctionOf?: string
}

export interface GuidePublication {
  id: string
  version: number
  ticker: string
  strategy: StrategyName
  strategyVersion: string
  universeFilterVersion: string
  asOf: string
  approvedAt: string
  snapshotId: string
  qualityStatus: 'passed' | 'warning' | 'blocked'
  gates: GateResult[]
  thesis: string
  triggers: string[]
  invalidation: string
  risk: GuideRisk
  additionalBuy: GuidePublicationInput['additionalBuy']
  supersedesId: string | null
  createdAt: string
}

export interface GuideRepository {
  findById(id: string): GuidePublication | undefined
  findLatest(
    ticker: string,
    strategy: StrategyName
  ): GuidePublication | undefined
  save(publication: GuidePublication): GuidePublication
}

export class InMemoryGuideRepository implements GuideRepository {
  private readonly publications = new Map<string, GuidePublication>()

  findById(id: string): GuidePublication | undefined {
    return this.publications.get(id)
  }

  findLatest(
    ticker: string,
    strategy: StrategyName
  ): GuidePublication | undefined {
    return [...this.publications.values()]
      .filter(
        publication =>
          publication.ticker === ticker && publication.strategy === strategy
      )
      .sort((left, right) => right.version - left.version)[0]
  }

  save(publication: GuidePublication): GuidePublication {
    if (this.publications.has(publication.id)) {
      throw new Error(`Guide publication already exists: ${publication.id}`)
    }
    this.publications.set(publication.id, publication)
    return publication
  }
}

function requireText(value: string, field: string): void {
  if (value.trim().length === 0) throw new Error(`${field} is required`)
}

function validateRisk(risk: GuideRisk): void {
  if (
    risk.risks.length === 0 ||
    risk.risks.some(item => item.trim().length === 0)
  ) {
    throw new Error('risk.risks is required')
  }
  if (!Number.isFinite(risk.maxLossPct) || risk.maxLossPct <= 0) {
    throw new Error('risk.maxLossPct must be positive')
  }
  if (!Number.isFinite(risk.rewardRiskRatio) || risk.rewardRiskRatio <= 0) {
    throw new Error('risk.rewardRiskRatio must be positive')
  }
}

function validatePublication(input: GuidePublicationInput): void {
  const requiredText: Array<[string, string]> = [
    [input.ticker, 'ticker'],
    [input.strategyVersion, 'strategyVersion'],
    [input.universeFilterVersion, 'universeFilterVersion'],
    [input.asOf, 'asOf'],
    [input.approvedAt, 'approvedAt'],
    [input.snapshotId, 'snapshotId'],
    [input.thesis, 'thesis'],
    [input.invalidation, 'invalidation'],
  ]
  requiredText.forEach(([value, field]) => requireText(value, field))
  if (
    input.triggers.length === 0 ||
    input.triggers.some(item => item.trim() === '')
  ) {
    throw new Error('triggers are required')
  }
  validateRisk(input.risk)
  if (input.qualityStatus !== 'passed') {
    throw new Error('Guide publication requires passed data quality')
  }
  const failedGate = input.gates.find(gate => !gate.passed)
  if (failedGate) {
    throw new Error(
      `Guide publication blocked by ${failedGate.gate}: ${failedGate.reason}`
    )
  }
  if (input.additionalBuy) {
    if (!input.additionalBuy.thesisMaintained) {
      throw new Error('Additional buy requires thesis maintenance')
    }
    if (!input.additionalBuy.riskRewardImproved) {
      throw new Error('Additional buy requires improved risk-reward')
    }
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(item => deepFreeze(item))
  }
  return value
}

export function publishGuide(
  input: GuidePublicationInput,
  repository: GuideRepository,
  now = new Date('2026-09-08T00:00:00.000Z')
): GuidePublication {
  validatePublication(input)
  const previous = input.correctionOf
    ? repository.findById(input.correctionOf)
    : repository.findLatest(input.ticker, input.strategy)
  if (input.correctionOf && !previous) {
    throw new Error(`Guide to correct was not found: ${input.correctionOf}`)
  }
  const version = previous ? previous.version + 1 : 1
  const id = `guide-${input.ticker}-${input.strategy}-v${version}`
  const publication: GuidePublication = {
    ...input,
    id,
    version,
    additionalBuy: input.additionalBuy,
    supersedesId: previous?.id ?? null,
    createdAt: now.toISOString(),
  }
  return repository.save(deepFreeze(publication))
}
