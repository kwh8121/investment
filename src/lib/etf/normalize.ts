import { z } from 'zod'

import type { KoreanEtfPayload, QualityStatus, RawSnapshot } from './types.ts'

const koreanEtfSchema = z.object({
  instrumentId: z.string().min(1),
  ticker: z.string().regex(/^\d{6}$/),
  name: z.string().min(1),
  market: z.literal('KR'),
  currency: z.literal('KRW').default('KRW'),
  asOf: z.string().date(),
  close: z.number().finite().nonnegative().nullable(),
  volume: z.number().finite().nonnegative().nullable(),
  nav: z.number().finite().nonnegative().nullable(),
  isEtf: z.boolean(),
  isLeveragedOrInverse: z.boolean(),
})

const secretKey =
  /(authorization|api[-_]?key|secret|token|cookie|account|credential)/i

export function sanitizeSecrets(value: unknown, key?: string): unknown {
  if (key && secretKey.test(key)) return '[REDACTED]'
  if (Array.isArray(value)) return value.map(item => sanitizeSecrets(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeSecrets(entryValue, entryKey),
      ])
    )
  }
  return value
}

export function normalizeKoreanEtf(snapshot: RawSnapshot): KoreanEtfPayload {
  const parsed = koreanEtfSchema.safeParse(snapshot.payload)
  if (!parsed.success) {
    throw new Error(`Invalid Korean ETF payload: ${parsed.error.message}`)
  }
  if (parsed.data.asOf !== snapshot.asOf) {
    throw new Error('Payload as_of does not match snapshot as_of')
  }
  return parsed.data
}

export function qualityStatusFor(payload: KoreanEtfPayload): {
  status: QualityStatus
  reasons: string[]
} {
  const reasons: string[] = []
  if (!payload.isEtf) reasons.push('instrument is not an ETF')
  if (payload.isLeveragedOrInverse)
    reasons.push('leveraged or inverse ETF is excluded')
  if (payload.close === null) reasons.push('close is missing')
  if (payload.volume === null) reasons.push('volume is missing')
  if (payload.nav === null) reasons.push('NAV is missing')
  return {
    status: reasons.length > 0 ? 'blocked' : 'passed',
    reasons,
  }
}
