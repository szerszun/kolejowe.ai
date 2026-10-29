import { describe, expect, it, vi } from 'vitest'
import { cachedValue } from './cachedValue'

describe('cachedValue', () => {
  it('builds once and serves the cached value after that', async () => {
    const build = vi.fn().mockResolvedValue('v1')
    const cache = cachedValue(build)

    expect(await cache.get()).toBe('v1')
    expect(await cache.get()).toBe('v1')
    expect(build).toHaveBeenCalledTimes(1)
  })

  it('shares one in-flight build between concurrent callers', async () => {
    let resolve!: (v: string) => void
    const build = vi.fn(() => new Promise<string>((r) => (resolve = r)))
    const cache = cachedValue(build)

    const both = Promise.all([cache.get(), cache.get()])
    resolve('v1')

    expect(await both).toEqual(['v1', 'v1'])
    expect(build).toHaveBeenCalledTimes(1)
  })

  it('rebuilds after invalidate()', async () => {
    const build = vi.fn().mockResolvedValueOnce('v1').mockResolvedValueOnce('v2')
    const cache = cachedValue(build)

    expect(await cache.get()).toBe('v1')
    cache.invalidate()
    expect(await cache.get()).toBe('v2')
  })

  it("doesn't cache a failed build", async () => {
    const build = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce('v1')
    const cache = cachedValue(build)

    await expect(cache.get()).rejects.toThrow('db down')
    expect(await cache.get()).toBe('v1')
  })

  it("doesn't keep a result whose build started before an invalidate()", async () => {
    let resolveFirst!: (v: string) => void
    const build = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((r) => (resolveFirst = r)))
      .mockResolvedValueOnce('v2')
    const cache = cachedValue(build)

    const first = cache.get()
    cache.invalidate()
    const second = cache.get()
    resolveFirst('v1-stale')

    expect(await first).toBe('v1-stale')
    expect(await second).toBe('v2')
    expect(await cache.get()).toBe('v2')
  })
})
