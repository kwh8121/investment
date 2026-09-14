import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Vercel and Supabase runbook is the only planned production deployment path', () => {
  const runbook = read('docs/manual/vercel-supabase-deployment.md')
  const harness = read('docs/guides/one-fact-one-home.md')
  assert.match(runbook, /Vercel/)
  assert.match(runbook, /Supabase/)
  assert.match(runbook, /GitHub.*Preview/)
  assert.match(runbook, /Vercel Cron/)
  assert.match(runbook, /0 10 \* \* 1-5/)
  assert.match(harness, /Vercel/)
  assert.match(harness, /Supabase/)
})

test('repository keeps quality CI but has no container or self-hosted deployment workflow', () => {
  assert.match(read('.github/workflows/quality.yml'), /name:/)
  assert.throws(() => read('Dockerfile'), /ENOENT/)
  assert.throws(() => read('compose.production.yaml'), /ENOENT/)
  assert.throws(() => read('.github/workflows/publish-image.yml'), /ENOENT/)
  assert.throws(() => read('.github/workflows/deploy-production.yml'), /ENOENT/)
})
