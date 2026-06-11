import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Re-use connection instance to prevent socket exhaustion
let redisInstance: Redis | null = null;

function getRedis() {
  if (!redisInstance) {
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
  }
  return redisInstance;
}

export type RateLimitType = 'login' | 'admin' | 'csvImportUser' | 'csvImportIp' | 'testEmail' | 'campaignLaunch' | 'signup';

let limiters: Record<RateLimitType, Ratelimit> | null = null;

function getLimiters(): Record<RateLimitType, Ratelimit> {
  if (!limiters) {
    const redis = getRedis();
    limiters = {
      login: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(5, "15 m", 5) }),
      admin: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(1, "1 h", 1) }),
      csvImportUser: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(5, "1 h", 5) }),
      csvImportIp: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(20, "1 h", 20) }),
      testEmail: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(20, "1 h", 20) }),
      campaignLaunch: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(3, "5 m", 3) }),
      signup: new Ratelimit({ redis, limiter: Ratelimit.tokenBucket(5, "1 h", 5) }),
    };
  }
  return limiters;
}

export class RateLimitExceededError extends Error {
  limit: number;
  remaining: number;
  reset: number;

  constructor(data: { limit: number; remaining: number; reset: number }) {
    super("Rate limit exceeded");
    this.name = "RateLimitExceededError";
    this.limit = data.limit;
    this.remaining = data.remaining;
    this.reset = data.reset;
  }
}

export async function enforceRateLimit(type: RateLimitType, key: string) {
  // Safe fallback if URL or TOKEN is missing in local/dev to avoid blocking developers
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn(`⚠️ Upstash Redis credentials not configured. Skipping rate limit checks for: ${type}:${key}`);
    return { success: true, limit: 0, remaining: 1, reset: 0 };
  }

  const limitersRecord = getLimiters();
  const result = await limitersRecord[type].limit(key);

  if (!result.success) {
    throw new RateLimitExceededError({
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    });
  }

  return result;
}

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

export function handleRateLimitError(error: unknown) {
  if (error instanceof RateLimitExceededError) {
    const retryAfter = Math.max(0, Math.ceil((error.reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(error.limit),
          "X-RateLimit-Remaining": "0"
        }
      }
    );
  }
  return null;
}
