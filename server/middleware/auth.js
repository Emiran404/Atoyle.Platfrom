/**
 * JWT Authentication & Authorization Middleware
 * Teknofest 2026 - Pardus Hata ve Öneri
 * 
 * Tüm korumalı API endpoint'lerinde kullanılır.
 * Login sonrası döndürülen JWT token'ı Authorization header'ında gönderilmelidir.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT Secret Key - .env'den al veya güvenli rastgele üret
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRY = '24h'; // Token süresi

/**
 * JWT Token üretir
 * @param {Object} payload - Token içeriği (userId, userType, vb.)
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * JWT Token doğrulama middleware'i
 * Authorization: Bearer <token> header'ı beklenir
 * Başarılıysa req.user'a decode edilmiş token verisini ekler
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Yetkilendirme gerekli. Lütfen giriş yapın.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, userType, fullName, ... }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      error: 'Geçersiz yetkilendirme token\'ı.' 
    });
  }
}

/**
 * Rol bazlı yetkilendirme middleware factory'si
 * @param  {...string} roles - İzin verilen roller ('teacher', 'student')
 * @returns {Function} Express middleware
 * 
 * Kullanım: authorizeRole('teacher')
 * Kullanım: authorizeRole('teacher', 'student')
 */
export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Yetkilendirme gerekli.' 
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Bu işlem için yetkiniz yok.' 
      });
    }

    next();
  };
}

/**
 * Opsiyonel auth middleware - Token varsa doğrular, yoksa devam eder
 * Public + Authenticated kullanıcılar için farklı davranış gereken endpoint'lerde kullanılır
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Token geçersiz ama zorunlu değil, devam et
      req.user = null;
    }
  }

  next();
}
