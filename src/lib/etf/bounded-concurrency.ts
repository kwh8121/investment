export async function mapBoundedInOrder<T, R>(
  values: readonly T[],
  concurrency: number,
  map: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error('Concurrency must be a positive integer')
  }

  const results = new Array<R>(values.length)
  let nextIndex = 0
  let failed = false
  let failure: unknown

  async function worker(): Promise<void> {
    while (!failed) {
      const index = nextIndex++
      if (index >= values.length) return

      try {
        const result = await map(values[index]!, index)
        if (!failed) results[index] = result
      } catch (error) {
        failed = true
        failure = error
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker())
  )
  if (failed) throw failure
  return results
}
