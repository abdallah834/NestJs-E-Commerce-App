import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

// KEYS[1] = storage key
// ARGV[1] = ttl (ms)
// ARGV[2] = limit
// ARGV[3] = blockDuration (ms)
// ARGV[4] = now (ms, passed in rather than using redis TIME for testability)
const INCREMENT_SCRIPT = `
local key = KEYS[1]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local blockKey = key .. '::Blocked'

-- Already blocked from a previous violation?
local blockExpiresAt = tonumber(redis.call('GET', blockKey))
if blockExpiresAt and blockExpiresAt > now then
  local totalHits = tonumber(redis.call('GET', key)) or limit + 1
  local pttl = redis.call('PTTL', key)
  return { totalHits, pttl, 1, blockExpiresAt - now }
end

-- Atomic increment; set expiry only on first hit in this window.
local totalHits = redis.call('INCR', key)
if totalHits == 1 then
  redis.call('PEXPIRE', key, ttl)
end

local pttl = redis.call('PTTL', key)
local isBlocked = 0
local timeToBlockExpire = 0

if totalHits > limit then
  isBlocked = 1
  if blockDuration > 0 then
    local newBlockExpiresAt = now + blockDuration
    redis.call('SET', blockKey, newBlockExpiresAt, 'PX', blockDuration)
    timeToBlockExpire = blockDuration
  end
end

return { totalHits, pttl, isBlocked, timeToBlockExpire }
`;

@Injectable()
export class IoredisThrottlerStorageService
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly redis: Redis;
  private readonly ownsConnection: boolean;

  constructor(redisClient?: Redis) {
    // Pass your existing ioredis client in explicitly (see wiring in
    // throttler.config.ts) to reuse its connection. If omitted, this opens
    // its own connection from REDIS_URL — only that self-opened connection
    // gets closed on shutdown, never a client you passed in.
    this.ownsConnection = !redisClient;
    this.redis =
      redisClient ??
      new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const storageKey = `Throttler::${throttlerName}::${key}`;
    const now = Date.now();

    const [totalHits, pttl, isBlocked, timeToBlockExpireMs] =
      (await this.redis.eval(
        INCREMENT_SCRIPT,
        1,
        storageKey,
        ttl,
        limit,
        blockDuration,
        now,
      )) as [number, number, number, number];

    return {
      totalHits,
      timeToExpire: Math.ceil(pttl / 1000),
      isBlocked: isBlocked === 1,
      timeToBlockExpire: Math.ceil(timeToBlockExpireMs / 1000),
    };
  }

  async onModuleDestroy() {
    // A shared/injected client's lifecycle belongs to whatever created it —
    // only close the connection here if this service opened it itself.
    if (this.ownsConnection) {
      await this.redis.quit();
    }
  }
}
