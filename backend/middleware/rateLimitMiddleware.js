/**
 * In-memory sliding window rate limiter
 * Protects sensitive endpoints (e.g. forgot password, reset password) against brute-force and abuse.
 */

const hitMap = new Map();

// Periodic cleanup every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of hitMap.entries()) {
    if (now - record.startTime > record.windowMs) {
      hitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 5,                    // 5 attempts per window
  message = 'Too many attempts. Please try again after 15 minutes.'
} = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const identifier = `${ip}:${req.originalUrl || req.path}`;
    const now = Date.now();

    let record = hitMap.get(identifier);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now, windowMs };
      hitMap.set(identifier, record);
      return next();
    }

    record.count++;

    if (record.count > max) {
      const remainingSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);
      res.setHeader('Retry-After', remainingSeconds);
      return res.status(429).json({
        message,
        retryAfter: remainingSeconds
      });
    }

    next();
  };
};

export const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: 'Too many password reset requests from this network. Please try again in 15 minutes.'
});

export const resetPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts. Please try again later.'
});

