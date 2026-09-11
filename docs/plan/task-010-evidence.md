# Task 010 — Research Inbox Evidence

## Scope

Task 010 registers PDF, Excel, and CSV research files while preserving the original bytes and a deterministic extraction record.

Implemented in `src/lib/research/inbox.ts`:

- PDF, Excel, and CSV extension/content-type validation.
- SHA-256 duplicate detection.
- Title, source, publication date, industry, link, and `asOf` metadata extraction from supplied metadata or simple text front matter.
- Deterministic classification into macro, industry, company, market, or unknown.
- Manual-review state for ambiguous classification.
- Original document and extraction linkage through document ID and content hash.
- Historical-use blocking when `publishedAt` is later than `asOf`.

## Verification

```text
npm run test:task-010
npm run test:task-005
npm run test:task-006
npm run test:task-007
npm run test:task-008
npm run test:task-009
npm run typecheck
npm run lint
```

All commands passed after formatting the two new Task 010 files. The repository-wide `format:check` still reports pre-existing formatting issues in `_workspace/harness/review/report.md`, `_workspace/harness/state.json`, and `opencode.json`; those unrelated files were not modified.

## Acceptance examples

- Same bytes produce the same SHA-256 and return the existing document as deduplicated.
- Missing classification is stored as `unknown`, `manual-review`, and `useAllowed=false`.
- A document published after its historical `asOf` is `blocked` and cannot be used.
- Extraction retains `sourceDocumentId` and `sourceHash` for traceability.
