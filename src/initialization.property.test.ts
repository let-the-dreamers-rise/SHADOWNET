/**
 * Property-Based Tests for System Initialization
 * Feature: shadownet
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { AgentManager } from './services/AgentManager.js';

describe('System Initialization Property Tests', () => {
  /**
   * Property 22: Credit Supply Conservation at Initialization
   * **Validates: Requirements 10.6**
   * 
   * For any system initialization with n agents and initial balance b,
   * the total credit supply must equal n * b (within a small tolerance
   * for randomization).
   */
  it('Property 22: Credit Supply Conservation at Initialization', () => {
    const agentCountArb = fc.integer({ min: 12, max: 20 });
    const initialBalanceArb = fc.integer({ min: 500, max: 5000 });

    fc.assert(
      fc.property(
        agentCountArb,
        initialBalanceArb,
        (agentCount, initialBalance) => {
          // Initialize agent manager
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, initialBalance);

          // Get all agents
          const agents = agentManager.getAllAgents();

          // Calculate total credit supply
          const totalSupply = agents.reduce((sum, agent) => sum + agent.wallet, 0);

          // Expected supply (n * b)
          const expectedSupply = agentCount * initialBalance;

          // Property: Total supply must equal expected supply within tolerance
          // Tolerance accounts for randomization (±100 per agent)
          const tolerance = agentCount * 100;
          const lowerBound = expectedSupply - tolerance;
          const upperBound = expectedSupply + tolerance;

          expect(totalSupply).toBeGreaterThanOrEqual(lowerBound);
          expect(totalSupply).toBeLessThanOrEqual(upperBound);

          // Property: No credits should be created or destroyed
          // The total supply should be close to the expected value
          const deviation = Math.abs(totalSupply - expectedSupply);
          expect(deviation).toBeLessThanOrEqual(tolerance);

          // Property: All agents must have positive wallet balances
          agents.forEach(agent => {
            expect(agent.wallet).toBeGreaterThan(0);
          });

          // Property: Average wallet should be close to initial balance
          const averageWallet = totalSupply / agentCount;
          expect(averageWallet).toBeGreaterThanOrEqual(initialBalance - 100);
          expect(averageWallet).toBeLessThanOrEqual(initialBalance + 100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
