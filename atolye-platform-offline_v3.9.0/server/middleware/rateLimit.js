/**
 * Rate Limiting Middleware
 * Yerel çalışma ortamı için devre dışı bırakıldı.
 */

// Tüm limiter'ları bypass eden basit middleware
const bypassLimiter = (req, res, next) => next();

// Genel API rate limiter
export const apiLimiter = bypassLimiter;

// Login endpoint'leri için rate limiter
export const loginLimiter = bypassLimiter;

// Dosya yükleme için rate limiter
export const uploadLimiter = bypassLimiter;

