/**
 * Rate Limiter for Admin Operations
 * Prevents spam and accidental bulk actions
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // milliseconds
  message: string;
}

class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if action is allowed
   * Returns { allowed: boolean, message: string }
   */
  check(identifier: string): { allowed: boolean; message: string } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    // No record or window has expired
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return { allowed: true, message: '' };
    }

    // Increment attempt
    record.count++;

    // Check if exceeded
    if (record.count > this.config.maxAttempts) {
      const secondsLeft = Math.ceil((record.resetTime - now) / 1000);
      return {
        allowed: false,
        message: `${this.config.message} (${secondsLeft}s)`,
      };
    }

    return { allowed: true, message: '' };
  }

  /**
   * Reset limiter for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.attempts.clear();
  }
}

// Create rate limiters for different admin operations
export const createAdminRateLimiters = (userId: string) => ({
  // Max 10 plan changes per minute
  planChange: new RateLimiter({
    maxAttempts: 10,
    windowMs: 60 * 1000,
    message: 'Too many plan changes. Please wait',
  }),

  // Max 20 credit additions per minute
  addCredits: new RateLimiter({
    maxAttempts: 20,
    windowMs: 60 * 1000,
    message: 'Too many credit additions. Please wait',
  }),

  // Max 5 user deletions per 5 minutes
  deleteUser: new RateLimiter({
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    message: 'Too many deletions. Please wait',
  }),

  // Max 10 impersonations per minute
  impersonate: new RateLimiter({
    maxAttempts: 10,
    windowMs: 60 * 1000,
    message: 'Too many impersonation attempts. Please wait',
  }),
});

// Global rate limiters (not per-user)
export const globalRateLimiters = {
  // Max 100 API requests per second from admin IP
  adminAPI: new RateLimiter({
    maxAttempts: 100,
    windowMs: 1000,
    message: 'Rate limit exceeded',
  }),
};

/**
 * Middleware to check rate limit before admin action
 * Usage in components:
 * const limiter = createAdminRateLimiters(userId);
 * const check = limiter.planChange.check(`${userId}:planChange`);
 * if (!check.allowed) {
 *   toast.error(check.message);
 *   return;
 * }
 */
export type AdminRateLimiters = ReturnType<typeof createAdminRateLimiters>;
