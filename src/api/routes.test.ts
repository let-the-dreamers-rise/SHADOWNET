/**
 * API Routes Unit Tests
 * Tests REST endpoints using Supertest
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';
import { createRoutes } from './routes.js';
import { AgentManager } from '../services/AgentManager.js';
import { EconomyEngine } from '../services/EconomyEngine.js';
import { Ledger } from '../services/Ledger.js';
import cors from 'cors';

describe('API Routes', () => {
  let app: Express;
  let agentManager: AgentManager;
  let economyEngine: EconomyEngine;
  let ledger: Ledger;

  beforeEach(async () => {
    // Initialize services
    agentManager = new AgentManager();
    agentManager.initializeAgents(5, 1000);
    economyEngine = new EconomyEngine(agentManager);
    ledger = new Ledger();

    // Create some test transactions
    const agents = agentManager.getAllAgents();
    for (let i = 0; i < 10; i++) {
      const from = agents[i % agents.length];
      const to = agents[(i + 1) % agents.length];
      await economyEngine.processTransaction(from.id, to.id, 50, 'trade_resources');
    }

    // Finalize a block
    const transactions = economyEngine.getRecentTransactions(10);
    transactions.forEach(tx => ledger.addTransaction(tx));
    ledger.finalizeBlock();

    // Create Express app with routes
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', createRoutes({ agentManager, economyEngine, ledger }));
  });

  describe('GET /api/agents', () => {
    it('should return all agents', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBe(5);
    });

    it('should return agents with correct structure', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      const agent = response.body.data[0];
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.personality).toBeDefined();
      expect(agent.role).toBeDefined();
      expect(typeof agent.wallet).toBe('number');
      expect(typeof agent.reputation).toBe('number');
      expect(Array.isArray(agent.memory)).toBe(true);
      expect(Array.isArray(agent.alliances)).toBe(true);
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('GET /api/activity', () => {
    it('should return recent transactions', async () => {
      const response = await request(app)
        .get('/api/activity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/activity?limit=3')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should return transactions in chronological order (most recent first)', async () => {
      const response = await request(app)
        .get('/api/activity')
        .expect(200);

      const transactions = response.body.data;
      for (let i = 1; i < transactions.length; i++) {
        expect(transactions[i - 1].timestamp).toBeGreaterThanOrEqual(transactions[i].timestamp);
      }
    });

    it('should cap limit at 100', async () => {
      const response = await request(app)
        .get('/api/activity?limit=200')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(100);
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/activity')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('GET /api/leaderboards', () => {
    it('should return all three leaderboards', async () => {
      const response = await request(app)
        .get('/api/leaderboards')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.richest).toBeDefined();
      expect(response.body.data.mostTrusted).toBeDefined();
      expect(response.body.data.mostActive).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/leaderboards?limit=3')
        .expect(200);

      expect(response.body.data.richest.length).toBeLessThanOrEqual(3);
      expect(response.body.data.mostTrusted.length).toBeLessThanOrEqual(3);
      expect(response.body.data.mostActive.length).toBeLessThanOrEqual(3);
    });

    it('should return agents sorted by wallet in richest leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboards')
        .expect(200);

      const richest = response.body.data.richest;
      for (let i = 1; i < richest.length; i++) {
        expect(richest[i - 1].wallet).toBeGreaterThanOrEqual(richest[i].wallet);
      }
    });

    it('should return agents sorted by reputation in mostTrusted leaderboard', async () => {
      const response = await request(app)
        .get('/api/leaderboards')
        .expect(200);

      const mostTrusted = response.body.data.mostTrusted;
      for (let i = 1; i < mostTrusted.length; i++) {
        expect(mostTrusted[i - 1].reputation).toBeGreaterThanOrEqual(mostTrusted[i].reputation);
      }
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/leaderboards')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('GET /api/ledger', () => {
    it('should return recent blocks', async () => {
      const response = await request(app)
        .get('/api/ledger')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/ledger?limit=1')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    it('should cap limit at 50', async () => {
      const response = await request(app)
        .get('/api/ledger?limit=100')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(50);
    });

    it('should return blocks with correct structure', async () => {
      const response = await request(app)
        .get('/api/ledger')
        .expect(200);

      const block = response.body.data[0];
      expect(typeof block.blockNumber).toBe('number');
      expect(typeof block.timestamp).toBe('number');
      expect(Array.isArray(block.transactions)).toBe(true);
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/ledger')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    it('should return aggregate statistics', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(typeof response.body.data.totalAgents).toBe('number');
      expect(typeof response.body.data.totalCredits).toBe('number');
      expect(typeof response.body.data.averageReputation).toBe('number');
      expect(typeof response.body.data.totalTransactions).toBe('number');
      expect(typeof response.body.data.successfulTransactions).toBe('number');
      expect(typeof response.body.data.failedTransactions).toBe('number');
      expect(typeof response.body.data.totalAlliances).toBe('number');
      expect(typeof response.body.data.totalBetrayals).toBe('number');
    });

    it('should have correct total agents count', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.data.totalAgents).toBe(5);
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(typeof response.body.timestamp).toBe('number');
    });

    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
