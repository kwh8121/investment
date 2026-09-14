import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('root layout has no build-time Google Fonts dependency', () => {
  const layout = read('src/app/layout.tsx')

  assert.doesNotMatch(layout, /next\/font\/google/)
  assert.doesNotMatch(layout, /\bGeist(?:_Mono)?\s*\(/)
})

test('global theme provides network-independent sans and monospace stacks', () => {
  const css = read('src/app/globals.css')

  assert.match(css, /--font-sans: ui-sans-serif, system-ui, sans-serif;/)
  assert.match(css, /--font-mono: ui-monospace, SFMono-Regular, Menlo,/)
})
