import type { GuidePublication } from '../research/guide.ts'

export const FORWARD_VALIDATION_VERSION = 'forward-validation-v0.1'
export const EVALUATION_HORIZONS = [1, 2, 4, 8] as const
export type EvaluationHorizon = (typeof EVALUATION_HORIZONS)[number]
export type ErrorCode = 'DATA' | 'SIGNAL' | 'THESIS' | 'EXECUTION' | 'EXTERNAL'

export interface ForwardValidationSnapshot {
  id: string
  guideId: string
  ticker: string
  strategy: GuidePublication['strategy']
  strategyVersion: string
  universeFilterVersion: string
  snapshotId: string
  signalAsOf: string
  approvedAt: string
  entryPrice: number
  benchmark: string
  thesis: string
  triggers: string[]
  risks: string[]
  invalidation: string
  createdAt: string
}

export interface ForwardObservation {
  horizon: EvaluationHorizon
  asOf: string
  price: number
  benchmarkReturn: number
  highSinceEntry: number
  lowSinceEntry: number
}

export interface ForwardValidationEvaluation {
  id: string
  snapshotId: string
  horizon: EvaluationHorizon
  asOf: string
  returnPct: number
  benchmarkReturnPct: number
  excessReturnPct: number
  maximumFavorableExcursionPct: number
  maximumAdverseExcursionPct: number
  errorCode: ErrorCode | null
  createdAt: string
}

export interface ForwardValidationRepository {
  saveSnapshot(snapshot: ForwardValidationSnapshot): ForwardValidationSnapshot
  findSnapshot(id: string): ForwardValidationSnapshot | undefined
  saveEvaluation(
    evaluation: ForwardValidationEvaluation
  ): ForwardValidationEvaluation
  findEvaluation(
    snapshotId: string,
    horizon: EvaluationHorizon
  ): ForwardValidationEvaluation | undefined
}

export class InMemoryForwardValidationRepository
  implements ForwardValidationRepository
{
  private readonly snapshots = new Map<string, ForwardValidationSnapshot>()
  private readonly evaluations = new Map<string, ForwardValidationEvaluation>()

  saveSnapshot(snapshot: ForwardValidationSnapshot): ForwardValidationSnapshot {
    if (this.snapshots.has(snapshot.id)) {
      throw new Error(`Forward snapshot already exists: ${snapshot.id}`)
    }
    this.snapshots.set(snapshot.id, snapshot)
    return snapshot
  }

  findSnapshot(id: string): ForwardValidationSnapshot | undefined {
    return this.snapshots.get(id)
  }

  saveEvaluation(
    evaluation: ForwardValidationEvaluation
  ): ForwardValidationEvaluation {
    const key = `${evaluation.snapshotId}:${evaluation.horizon}`
    if (this.evaluations.has(key)) {
      throw new Error(`Forward evaluation already exists: ${key}`)
    }
    this.evaluations.set(key, evaluation)
    return evaluation
  }

  findEvaluation(
    snapshotId: string,
    horizon: EvaluationHorizon
  ): ForwardValidationEvaluation | undefined {
    return this.evaluations.get(`${snapshotId}:${horizon}`)
  }
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000
}

function requirePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive`)
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(item => deepFreeze(item))
  }
  return value
}

export function createForwardValidationSnapshot(
  guide: GuidePublication,
  entryPrice: number,
  benchmark: string,
  now = new Date('2026-09-08T00:00:00.000Z')
): ForwardValidationSnapshot {
  requirePositive(entryPrice, 'entryPrice')
  if (benchmark.trim().length === 0) throw new Error('benchmark is required')
  const snapshot: ForwardValidationSnapshot = {
    id: `forward-${guide.id}`,
    guideId: guide.id,
    ticker: guide.ticker,
    strategy: guide.strategy,
    strategyVersion: guide.strategyVersion,
    universeFilterVersion: guide.universeFilterVersion,
    snapshotId: guide.snapshotId,
    signalAsOf: guide.asOf,
    approvedAt: guide.approvedAt,
    entryPrice,
    benchmark,
    thesis: guide.thesis,
    triggers: [...guide.triggers],
    risks: [...guide.risk.risks],
    invalidation: guide.invalidation,
    createdAt: now.toISOString(),
  }
  return deepFreeze(snapshot)
}

function validateObservation(
  snapshot: ForwardValidationSnapshot,
  observation: ForwardObservation
): void {
  if (!EVALUATION_HORIZONS.includes(observation.horizon)) {
    throw new Error(`Unsupported evaluation horizon: ${observation.horizon}`)
  }
  if (observation.asOf <= snapshot.signalAsOf) {
    throw new Error('Forward observation must be after signalAsOf')
  }
  requirePositive(observation.price, 'price')
  requirePositive(observation.highSinceEntry, 'highSinceEntry')
  requirePositive(observation.lowSinceEntry, 'lowSinceEntry')
  if (observation.highSinceEntry < observation.price) {
    throw new Error('highSinceEntry cannot be below price')
  }
  if (observation.lowSinceEntry > observation.price) {
    throw new Error('lowSinceEntry cannot be above price')
  }
}

export function evaluateForwardValidation(
  snapshot: ForwardValidationSnapshot,
  observation: ForwardObservation,
  errorCode: ErrorCode | null = null,
  now = new Date('2026-09-08T00:00:00.000Z')
): ForwardValidationEvaluation {
  validateObservation(snapshot, observation)
  const returnPct = observation.price / snapshot.entryPrice - 1
  const maximumFavorableExcursionPct =
    observation.highSinceEntry / snapshot.entryPrice - 1
  const maximumAdverseExcursionPct =
    observation.lowSinceEntry / snapshot.entryPrice - 1
  return deepFreeze({
    id: `${snapshot.id}-${observation.horizon}w`,
    snapshotId: snapshot.id,
    horizon: observation.horizon,
    asOf: observation.asOf,
    returnPct: round(returnPct),
    benchmarkReturnPct: round(observation.benchmarkReturn),
    excessReturnPct: round(returnPct - observation.benchmarkReturn),
    maximumFavorableExcursionPct: round(maximumFavorableExcursionPct),
    maximumAdverseExcursionPct: round(maximumAdverseExcursionPct),
    errorCode,
    createdAt: now.toISOString(),
  })
}
