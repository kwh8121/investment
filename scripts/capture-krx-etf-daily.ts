import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { env } from '../src/lib/env.ts'
import {
  captureKrxEtfDailyMarketData,
  type KrxEtfDailyMarketDataCapture,
} from '../src/lib/etf/krx-etf-daily-market-data.ts'

const RAW_EVIDENCE_DIRECTORY =
  '/home/kwh8121/.local/share/stock-market/evidence-bundle/raw'

interface KrxCaptureMetadata {
  sourceUri: string
  basDd: string
  sourceSha256: string
  fetchedAt: string
  rowCount: number
  rawArtifactFilename: string
}

function requiredDateArgument(argv: string[]): string {
  const [basDd] = argv
  if (!basDd || argv.length !== 1) {
    throw new Error('Usage: npm run capture:krx-etf-daily -- YYYYMMDD')
  }
  return basDd
}

function artifactPaths(basDd: string): {
  rawPath: string
  metadataPath: string
} {
  const filename = `krx-etf-bydd-trd-${basDd}.json`
  return {
    rawPath: resolve(RAW_EVIDENCE_DIRECTORY, filename),
    metadataPath: resolve(RAW_EVIDENCE_DIRECTORY, `${filename}.metadata.json`),
  }
}

function metadataFor(
  capture: KrxEtfDailyMarketDataCapture,
  rawArtifactPath: string
): KrxCaptureMetadata {
  return {
    sourceUri: capture.sourceUri,
    basDd: capture.basDd,
    sourceSha256: capture.sourceSha256,
    fetchedAt: capture.fetchedAt,
    rowCount: capture.rows.length,
    rawArtifactFilename: rawArtifactPath.split('/').at(-1)!,
  }
}

async function main(): Promise<void> {
  const basDd = requiredDateArgument(process.argv.slice(2))
  if (!env.KRX_API_KEY) throw new Error('KRX_API_KEY is required')

  const capture = await captureKrxEtfDailyMarketData({
    apiKey: env.KRX_API_KEY,
    basDd,
    fetch: globalThis.fetch,
  })
  const { rawPath, metadataPath } = artifactPaths(basDd)
  const metadata = metadataFor(capture, rawPath)

  await mkdir(RAW_EVIDENCE_DIRECTORY, { recursive: true })
  await writeFile(rawPath, capture.sourceBytes, { flag: 'wx' })
  try {
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    })
  } catch (error) {
    await unlink(rawPath)
    throw error
  }

  console.log(
    JSON.stringify(
      {
        rawArtifactPath: rawPath,
        metadataPath,
        ...metadata,
      },
      null,
      2
    )
  )
}

void main().catch(error => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`KRX ETF capture failed: ${message}`)
  process.exitCode = 1
})
