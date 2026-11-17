/**
 * Lightweight, zero-dependency in-memory rate limiter middleware.
 * Protects sensitive endpoints (e.g., OTP generation) from abuse and flooding.
 */

const createRateLimiter = ({
  windowMs = 5 * 60 * 1000, // 5 minutes window
  maxRequests = 5,           // 5 requests per window
  message = "Too many requests. Please wait a few minutes before trying again.",
} = {}) => {
  const requestHistory = new Map();

  // Periodic cleanup of stale tracking entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestHistory.entries()) {
      if (now - record.startTime > windowMs) {
        requestHistory.delete(key);
      }
    }
  }, windowMs).unref(); // unref prevents timer from blocking node process exit

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || "global";
    const identifier = req.body?.mobile ? `${ip}_${req.body.mobile}` : ip;

    const now = Date.now();
    const clientRecord = requestHistory.get(identifier);

    if (!clientRecord) {
      requestHistory.set(identifier, {
        count: 1,
        startTime: now,
      });
      return next();
    }

    if (now - clientRecord.startTime < windowMs) {
      if (clientRecord.count >= maxRequests) {
        const remainingSeconds = Math.ceil(
          (windowMs - (now - clientRecord.startTime)) / 1000
        );
        return res.status(429).json({
          success: false,
          message: `${message} (Try again in ${remainingSeconds}s)`,
          retryAfterSeconds: remainingSeconds,
        });
      }
      clientRecord.count += 1;
      return next();
    }

    // Reset window
    requestHistory.set(identifier, {
      count: 1,
      startTime: now,
    });
    return next();
  };
};

const otpLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 5,
  message: "Too many OTP verification attempts. Please wait a few minutes before requesting a new code.",
});

module.exports = {
  createRateLimiter,
  otpLimiter,
};
