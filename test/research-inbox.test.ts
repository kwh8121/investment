import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  InMemoryResearchInboxRepository,
  registerResearchDocument,
} from '../src/lib/research/inbox.ts'

const baseInput = {
  fileName: 'rates.pdf',
  contentType: 'application/pdf',
  bytes: new TextEncoder().encode(`Title: Rate outlook
Source: central bank`),
  extractedText: `Title: Rate outlook
Source: central bank
Published: 2026-09-01`,
  asOf: '2026-09-08',
}

describe('research inbox', () => {
  it('registers metadata and preserves original-to-extraction linkage', () => {
    const repository = new InMemoryResearchInboxRepository()
    const result = registerResearchDocument(baseInput, repository)

    assert.equal(result.deduplicated, false)
    assert.equal(result.document.metadata.title, 'Rate outlook')
    assert.equal(result.document.metadata.source, 'central bank')
    assert.equal(result.document.metadata.classification, 'macro')
    assert.equal(
      result.document.extraction.sourceDocumentId,
      result.document.id
    )
    assert.equal(result.document.extraction.sourceHash, result.document.sha256)
    assert.equal(result.document.useAllowed, true)
  })

  it('deduplicates the same file by SHA-256', () => {
    const repository = new InMemoryResearchInboxRepository()
    const first = registerResearchDocument(baseInput, repository)
    const second = registerResearchDocument(baseInput, repository)

    assert.equal(second.deduplicated, true)
    assert.equal(second.document.id, first.document.id)
  })

  it('places ambiguous classifications into manual review', () => {
    const repository = new InMemoryResearchInboxRepository()
    const result = registerResearchDocument(
      {
        ...baseInput,
        fileName: 'notes.csv',
        contentType: 'text/csv',
        bytes: new TextEncoder().encode('unclassified notes'),
        extractedText: 'unclassified notes',
      },
      repository
    )

    assert.equal(result.document.metadata.classification, 'unknown')
    assert.equal(result.document.reviewStatus, 'manual-review')
    assert.equal(result.document.useAllowed, false)
  })

  it('blocks documents published after the historical as_of date', () => {
    const repository = new InMemoryResearchInboxRepository()
    const result = registerResearchDocument(
      {
        ...baseInput,
        publishedAt: '2026-09-09',
      },
      repository
    )

    assert.equal(result.document.reviewStatus, 'blocked')
    assert.equal(result.document.useAllowed, false)
    assert.match(result.document.blockedReason ?? '', /later than asOf/)
  })

  it('rejects unsupported or mismatched files', () => {
    const repository = new InMemoryResearchInboxRepository()
    assert.throws(() =>
      registerResearchDocument(
        { ...baseInput, fileName: 'notes.txt', contentType: 'text/plain' },
        repository
      )
    )
    assert.throws(() =>
      registerResearchDocument(
        { ...baseInput, contentType: 'text/csv' },
        repository
      )
    )
  })
})
