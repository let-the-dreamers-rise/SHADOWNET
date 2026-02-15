/**
 * Property-Based Tests for API Routes
 * Feature: shadownet
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import express, { Express } from 'express';
import request from 'supertest';
import { createRoutes } from './routes.js';
import { AgentManager } from '../services/AgentManager.js';
import { EconomyEngine } from '../services/EconomyEngine.js';
import { Ledger } from '../services/Ledger.js';
import cors from 'cors';

describe('API Routes Property Tests', () => {
  /**
   * Property 20: Activity Feed Chronological Order
   * **Validates: Requirements 8.2**
   * 
   * For any activity feed query, the returned transactions must be sorted in
   * reverse chronological order (most recent first).
   */
  it('Property 20: Activity Feed Chronological Order', async () => {
    const transactionCountArb = fc.integer({ min: 5, max: 30 });

    await fc.assert(
      fc.asyncProperty(
        transactionCountArb,
        async (transactionCount) => {
          // Initialize services
          const agentManager = new AgentManager();
          agentManager.initializeAgents(5, 5000);
          const economyEngine = new EconomyEngine(agentManager);
          const ledger = new Ledger();

          const agents = agentManager.getAllAgents();

          // Create transactions with varying timestamps
          for (let i = 0; i < transactionCount; i++) {
            const fromIndex = Math.floor(Math.random() * agents.length);
            let toIndex = Math.floor(Math.random() * agents.length);
            while (toIndex === fromIndex) {
              toIndex = Math.floor(Math.random() * agents.length);
            }

            const from = agentManager.getAgent(agents[fromIndex].id)!;
            const to = agentManager.getAgent(agents[toIndex].id)!;
            const amount = Math.min(100, Math.floor(from.wallet * 0.1));

            if (amount > 0) {
              await economyEngine.processTransaction(
                from.id,
                to.id,
                amount,
                'trade_resources'
              );
            }
          }

          // Create Express app with routes
          const app: Express = express();
          app.use(cors());
          app.use(express.json());
          app.use('/api', createRoutes({ agentManager, economyEngine, ledger }));

          // Query activity feed
          const response = await request(app)
            .get('/api/activity')
            .expect(200);

          const transactions = response.body.data;

          // Property: Transactions must be sorted in reverse chronological order
          for (let i = 1; i < transactions.length; i++) {
            expect(transactions[i - 1].timestamp).toBeGreaterThanOrEqual(transactions[i].timestamp);
          }

          // Property: All transactions must have valid timestamps
          transactions.forEach((tx: any) => {
            expect(typeof tx.timestamp).toBe('number');
            expect(tx.timestamp).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000); // Increase timeout to 30 seconds for property-based test
});
