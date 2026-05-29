// @ts-nocheck
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import * as storage from '../utils/storage.js';
import { hashPassword } from '../utils/crypto.js';

describe('Auth Endpoints', () => {
  beforeAll(() => {
    // Test verileri ekleyelim
    storage.setData('teachers', [{
      id: 'teacher123',
      username: 'test_teacher',
      password: hashPassword('test_password', 'test_teacher'),
      fullName: 'Test Öğretmen',
      role: 'teacher'
    }]);

    storage.setData('students', [{
      id: 'student123',
      studentNumber: '12345',
      fullName: 'Test Öğrenci',
      className: '10A',
      password: hashPassword('student_password', '12345'),
      role: 'student',
      ipHistory: []
    }]);
  });

  describe('POST /api/auth/login/teacher and student', () => {
    it('should login teacher with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/teacher')
        .send({
          type: 'teacher',
          username: 'test_teacher',
          password: 'test_password'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('teacher');
      expect(res.body.user.fullName).toBe('Test Öğretmen');
    });

    it('should fail with incorrect teacher password', async () => {
      const res = await request(app)
        .post('/api/auth/login/teacher')
        .send({
          type: 'teacher',
          username: 'test_teacher',
          password: 'wrong_password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should login student with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/student')
        .send({
          type: 'student',
          studentNumber: '12345',
          password: 'student_password'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('student');
    });

    it('should fail with unknown student number', async () => {
      const res = await request(app)
        .post('/api/auth/login/student')
        .send({
          type: 'student',
          studentNumber: '99999',
          password: 'student_password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
