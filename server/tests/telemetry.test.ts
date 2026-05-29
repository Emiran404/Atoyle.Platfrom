// @ts-nocheck
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import * as storage from '../utils/storage.js';

describe('Telemetry Endpoints', () => {
  beforeAll(() => {
    storage.setData('telemetry', []);
  });

  describe('POST /api/telemetry', () => {
    it('should save a valid system_stats event', async () => {
      const res = await request(app)
        .post('/api/telemetry')
        .send({
          events: [{
            type: 'system_stats',
            platform: 'darwin',
            version: '1.0.0'
          }]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const telemetry = storage.getData('telemetry');
      expect(telemetry.length).toBeGreaterThan(0);
      expect(telemetry[0].type).toBe('system_stats');
    });

    it('should ignore app_start events', async () => {
      const currentLength = storage.getData('telemetry').length;
      
      const res = await request(app)
        .post('/api/telemetry')
        .send({
          events: [{
            type: 'app_start',
            platform: 'darwin'
          }]
        });

      // App start events trigger a system_stats generation
      expect(res.status).toBe(200);
      
      const telemetry = storage.getData('telemetry');
      expect(telemetry.length).toBe(currentLength + 1);
      expect(telemetry[telemetry.length - 1].type).toBe('system_stats');
    });
  });
});
