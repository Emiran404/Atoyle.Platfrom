/**
 * Rate Limiting Middleware
 * Brute force saldırılarına karşı koruma
 */

import rateLimit from 'express-rate-limit';

// Genel API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 500, // 15 dakikada en fazla 500 istek
  message: {
    success: false,
    error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login endpoint'leri için sıkı rate limiter (brute force koruması)
export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 10, // Dakikada en fazla 10 login denemesi
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 1 dakika sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dosya yükleme için rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 50, // 5 dakikada en fazla 50 yükleme
  message: {
    success: false,
    error: 'Çok fazla dosya yükleme denemesi. Lütfen biraz bekleyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
