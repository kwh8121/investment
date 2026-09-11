import { createHash } from 'node:crypto'

export type ResearchFileType = 'pdf' | 'excel' | 'csv'
export type ResearchClassification =
  | 'macro'
  | 'industry'
  | 'company'
  | 'market'
  | 'unknown'
export type ResearchReviewStatus = 'auto-approved' | 'manual-review' | 'blocked'

export interface ResearchDocumentInput {
  fileName: string
  contentType: string
  bytes: Uint8Array
  extractedText?: string
  title?: string
  source?: string
  publishedAt?: string
  industry?: string
  link?: string
  asOf: string
  classification?: ResearchClassification
}

export interface ResearchMetadata {
  title: string
  source: string | null
  publishedAt: string | null
  industry: string | null
  link: string | null
  asOf: string
  classification: ResearchClassification
  classificationConfidence: 'high' | 'low'
}

export interface ResearchExtraction {
  id: string
  sourceDocumentId: string
  sourceHash: string
  metadata: ResearchMetadata
  createdAt: string
}

export interface ResearchDocument {
  id: string
  fileName: string
  fileType: ResearchFileType
  contentType: string
  sha256: string
  bytes: Uint8Array
  metadata: ResearchMetadata
  extraction: ResearchExtraction
  reviewStatus: ResearchReviewStatus
  useAllowed: boolean
  blockedReason: string | null
  createdAt: string
}

export interface ResearchInboxRepository {
  findByHash(sha256: string): ResearchDocument | undefined
  save(document: ResearchDocument): ResearchDocument
}

export class InMemoryResearchInboxRepository
  implements ResearchInboxRepository
{
  private readonly documents = new Map<string, ResearchDocument>()

  findByHash(sha256: string): ResearchDocument | undefined {
    return this.documents.get(sha256)
  }

  save(document: ResearchDocument): ResearchDocument {
    this.documents.set(document.sha256, document)
    return document
  }
}

const fileTypes: Record<string, ResearchFileType> = {
  '.pdf': 'pdf',
  '.csv': 'csv',
  '.xls': 'excel',
  '.xlsx': 'excel',
}

const contentTypes: Record<ResearchFileType, string[]> = {
  pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv'],
  excel: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}

const frontMatter = (text: string, key: string): string | undefined => {
  const match = text.match(new RegExp(`^${key}\\s*:\\s*(.+)$`, 'im'))
  return match?.[1]?.trim()
}

function parseDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be an ISO date`)
  }
  return value
}

function inferClassification(
  title: string,
  text: string,
  requested?: ResearchClassification
): { value: ResearchClassification; confidence: 'high' | 'low' } {
  if (requested) {
    return {
      value: requested,
      confidence: requested === 'unknown' ? 'low' : 'high',
    }
  }
  const haystack = `${title} ${text}`.toLowerCase()
  if (
    /(금리|rate|outlook|inflation|물가|환율|macro|fed|기준금리)/.test(haystack)
  ) {
    return { value: 'macro', confidence: 'high' }
  }
  if (/(산업|sector|반도체|바이오|에너지|industry)/.test(haystack)) {
    return { value: 'industry', confidence: 'high' }
  }
  if (/(기업|company|실적|매출|이익)/.test(haystack)) {
    return { value: 'company', confidence: 'high' }
  }
  if (/(시장|market|kospi|s&p|지수)/.test(haystack)) {
    return { value: 'market', confidence: 'high' }
  }
  return { value: 'unknown', confidence: 'low' }
}

function metadataFrom(input: ResearchDocumentInput): ResearchMetadata {
  const text = input.extractedText ?? ''
  const title = input.title ?? frontMatter(text, 'Title') ?? input.fileName
  const source = input.source ?? frontMatter(text, 'Source') ?? null
  const publishedAt =
    input.publishedAt ?? frontMatter(text, 'Published') ?? null
  const industry = input.industry ?? frontMatter(text, 'Industry') ?? null
  const link = input.link ?? frontMatter(text, 'Link') ?? null
  const asOf = parseDate(input.asOf, 'asOf')
  const parsedPublishedAt = publishedAt
    ? parseDate(publishedAt, 'publishedAt')
    : null
  const classification = inferClassification(title, text, input.classification)
  return {
    title,
    source,
    publishedAt: parsedPublishedAt,
    industry,
    link,
    asOf,
    classification: classification.value,
    classificationConfidence: classification.confidence,
  }
}

function fileTypeFor(fileName: string, contentType: string): ResearchFileType {
  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()
  const fileType = fileTypes[extension]
  if (!fileType) throw new Error(`Unsupported research file: ${fileName}`)
  if (!contentTypes[fileType].includes(contentType)) {
    throw new Error(`Content type does not match file extension: ${fileName}`)
  }
  return fileType
}

export function registerResearchDocument(
  input: ResearchDocumentInput,
  repository: ResearchInboxRepository,
  now = new Date('2026-09-08T00:00:00.000Z')
): { document: ResearchDocument; deduplicated: boolean } {
  const fileType = fileTypeFor(input.fileName, input.contentType)
  const metadata = metadataFrom(input)
  const sha256 = createHash('sha256').update(input.bytes).digest('hex')
  const existing = repository.findByHash(sha256)
  if (existing) return { document: existing, deduplicated: true }

  const id = `research-${sha256.slice(0, 16)}`
  const extractionId = `${id}-extraction`
  const createdAt = now.toISOString()
  const isFuture =
    metadata.publishedAt !== null && metadata.publishedAt > metadata.asOf
  const needsReview = metadata.classification === 'unknown'
  const blockedReason = isFuture
    ? 'publishedAt is later than asOf and cannot be used for historical analysis'
    : null
  const document: ResearchDocument = {
    id,
    fileName: input.fileName,
    fileType,
    contentType: input.contentType,
    sha256,
    bytes: new Uint8Array(input.bytes),
    metadata,
    extraction: {
      id: extractionId,
      sourceDocumentId: id,
      sourceHash: sha256,
      metadata,
      createdAt,
    },
    reviewStatus: blockedReason
      ? 'blocked'
      : needsReview
        ? 'manual-review'
        : 'auto-approved',
    useAllowed: !blockedReason && !needsReview,
    blockedReason,
    createdAt,
  }
  return { document: repository.save(document), deduplicated: false }
}
