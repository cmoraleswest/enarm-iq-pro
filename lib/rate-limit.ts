import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const limiters: Record<string, Ratelimit> = {}

function getLimiter(prefix: string, maxRequests: number, windowSec: number): Ratelimit {
  const key = `${prefix}:${maxRequests}:${windowSec}`
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      prefix: `rl:${prefix}`,
    })
  }
  return limiters[key]
}

export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  try {
    const limiter = getLimiter(key.split(':')[0], maxRequests, Math.round(windowMs / 1000))
    const { success } = await limiter.limit(key)
    return success
  } catch {
    return true
  }
}
