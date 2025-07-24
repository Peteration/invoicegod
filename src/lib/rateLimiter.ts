import LRU from 'lru-cache';

type Options = {
  maxRequests: number;
  windowMs: number;
};

export function createRateLimiter(options: Options) {
  const tokenCache = new LRU<string, number>({
    max: 1000, // Max 1000 unique tokens
    ttl: options.windowMs
  });

  return {
    check: (res: any, max: number, token: string) => {
      const currentCount = tokenCache.get(token) || 0;
      
      if (currentCount >= max) {
        res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
        throw new Error('Rate limit exceeded');
      }

      tokenCache.set(token, currentCount + 1);
      return Promise.resolve();
    }
  };
}