/**
 * AgentManager Unit Tests
 * Tests for agent state management and leaderboard functionality
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgentManager } from './AgentManager.js';
import { ActionLog, Agent } from '../models/types.js';

describe('AgentManager', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  describe('initializeAgents', () => {
    it('should create the specified number of agents', () => {
      agentManager.initializeAgents(15, 1000);
      const agents = agentManager.getAllAgents();
      expect(agents).toHaveLength(15);
    });

    it('should initialize agents with correct initial balance range', () => {
      const initialBalance = 1000;
      agentManager.initializeAgents(12, initialBalance);
      const agents = agentManager.getAllAgents();

      agents.forEach(agent => {
        // Balance should be within initialBalance ± 100
        expect(agent.wallet).toBeGreaterThanOrEqual(initialBalance - 100);
        expect(agent.wallet).toBeLessThanOrEqual(initialBalance + 100);
      });
    });

    it('should initialize agents with reputation between 40 and 60', () => {
      agentManager.initializeAgents(15, 1000);
      const agents = agentManager.getAllAgents();

      agents.forEach(agent => {
        expect(agent.reputation).toBeGreaterThanOrEqual(40);
        expect(agent.reputation).toBeLessThanOrEqual(60);
      });
    });

    it('should initialize agents with empty memory logs', () => {
      agentManager.initializeAgents(12, 1000);
      const agents = agentManager.getAllAgents();

      agents.forEach(agent => {
        expect(agent.memory).toEqual([]);
      });
    });

    it('should initialize agents with zero stats', () => {
      agentManager.initializeAgents(12, 1000);
      const agents = agentManager.getAllAgents();

      agents.forEach(agent => {
        expect(agent.stats.transactionCount).toBe(0);
        expect(agent.stats.successfulDeals).toBe(0);
        expect(agent.stats.failedDeals).toBe(0);
        expect(agent.stats.betrayals).toBe(0);
      });
    });
  });

  describe('getAgent', () => {
    it('should return agent by ID', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const firstAgent = agents[0];

      const retrieved = agentManager.getAgent(firstAgent.id);
      expect(retrieved).toEqual(firstAgent);
    });

    it('should return undefined for non-existent agent ID', () => {
      agentManager.initializeAgents(5, 1000);
      const retrieved = agentManager.getAgent('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for empty string ID', () => {
      agentManager.initializeAgents(5, 1000);
      const retrieved = agentManager.getAgent('');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined when no agents initialized', () => {
      const retrieved = agentManager.getAgent('any-id');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for null-like IDs', () => {
      agentManager.initializeAgents(5, 1000);
      expect(agentManager.getAgent('null')).toBeUndefined();
      expect(agentManager.getAgent('undefined')).toBeUndefined();
    });
  });

  describe('getAllAgents', () => {
    it('should return empty array when no agents initialized', () => {
      const agents = agentManager.getAllAgents();
      expect(agents).toEqual([]);
    });

    it('should return all initialized agents', () => {
      agentManager.initializeAgents(10, 1000);
      const agents = agentManager.getAllAgents();
      expect(agents).toHaveLength(10);
    });
  });

  describe('updateAgent', () => {
    it('should update agent wallet balance', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      agentManager.updateAgent(agent.id, { wallet: 2000 });
      const updated = agentManager.getAgent(agent.id);
      expect(updated?.wallet).toBe(2000);
    });

    it('should update agent reputation', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      agentManager.updateAgent(agent.id, { reputation: 75 });
      const updated = agentManager.getAgent(agent.id);
      expect(updated?.reputation).toBe(75);
    });

    it('should update agent stats', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      const newStats = {
        transactionCount: 10,
        successfulDeals: 7,
        failedDeals: 3,
        betrayals: 1
      };

      agentManager.updateAgent(agent.id, { stats: newStats });
      const updated = agentManager.getAgent(agent.id);
      expect(updated?.stats).toEqual(newStats);
    });

    it('should not throw when updating non-existent agent', () => {
      agentManager.initializeAgents(5, 1000);
      expect(() => {
        agentManager.updateAgent('non-existent-id', { wallet: 5000 });
      }).not.toThrow();
    });

    it('should not throw when updating with empty string ID', () => {
      agentManager.initializeAgents(5, 1000);
      expect(() => {
        agentManager.updateAgent('', { wallet: 5000 });
      }).not.toThrow();
    });

    it('should not throw when no agents initialized', () => {
      expect(() => {
        agentManager.updateAgent('any-id', { wallet: 5000 });
      }).not.toThrow();
    });

    it('should preserve other fields when updating specific field', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];
      const originalName = agent.name;
      const originalReputation = agent.reputation;

      agentManager.updateAgent(agent.id, { wallet: 3000 });
      const updated = agentManager.getAgent(agent.id);
      
      expect(updated?.wallet).toBe(3000);
      expect(updated?.name).toBe(originalName);
      expect(updated?.reputation).toBe(originalReputation);
    });

    it('should handle updating multiple fields at once', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      agentManager.updateAgent(agent.id, { 
        wallet: 5000, 
        reputation: 90,
        stats: {
          transactionCount: 20,
          successfulDeals: 15,
          failedDeals: 5,
          betrayals: 0
        }
      });
      
      const updated = agentManager.getAgent(agent.id);
      expect(updated?.wallet).toBe(5000);
      expect(updated?.reputation).toBe(90);
      expect(updated?.stats.transactionCount).toBe(20);
    });
  });

  describe('logAction', () => {
    it('should append action to agent memory', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      const action: ActionLog = {
        timestamp: Date.now(),
        action: 'trade_resources',
        details: { target: 'agent-2', amount: 100 },
        outcome: 'success'
      };

      agentManager.logAction(agent.id, action);
      const updated = agentManager.getAgent(agent.id);
      
      expect(updated?.memory).toHaveLength(1);
      expect(updated?.memory[0]).toEqual(action);
    });

    it('should append multiple actions in order', () => {
      agentManager.initializeAgents(5, 1000);
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      const action1: ActionLog = {
        timestamp: Date.now(),
        action: 'save',
        details: {},
        outcome: 'success'
      };

      const action2: ActionLog = {
        timestamp: Date.now() + 1000,
        action: 'invest',
        details: { amount: 200 },
        outcome: 'success'
      };

      agentManager.logAction(agent.id, action1);
      agentManager.logAction(agent.id, action2);
      
      const updated = agentManager.getAgent(agent.id);
      expect(updated?.memory).toHaveLength(2);
      expect(updated?.memory[0]).toEqual(action1);
      expect(updated?.memory[1]).toEqual(action2);
    });

    it('should not throw when logging action for non-existent agent', () => {
      agentManager.initializeAgents(5, 1000);
      
      const action: ActionLog = {
        timestamp: Date.now(),
        action: 'save',
        details: {},
        outcome: 'success'
      };

      expect(() => {
        agentManager.logAction('non-existent-id', action);
      }).not.toThrow();
    });
  });

  describe('getLeaderboard', () => {
    beforeEach(() => {
      // Initialize agents and set up test data
      agentManager.initializeAgents(10, 1000);
      const agents = agentManager.getAllAgents();

      // Set specific values for testing
      agentManager.updateAgent(agents[0].id, { wallet: 5000 });
      agentManager.updateAgent(agents[1].id, { wallet: 3000 });
      agentManager.updateAgent(agents[2].id, { wallet: 4000 });

      agentManager.updateAgent(agents[3].id, { reputation: 90 });
      agentManager.updateAgent(agents[4].id, { reputation: 85 });
      agentManager.updateAgent(agents[5].id, { reputation: 95 });

      agentManager.updateAgent(agents[6].id, { 
        stats: { transactionCount: 50, successfulDeals: 40, failedDeals: 10, betrayals: 0 }
      });
      agentManager.updateAgent(agents[7].id, { 
        stats: { transactionCount: 30, successfulDeals: 25, failedDeals: 5, betrayals: 0 }
      });
      agentManager.updateAgent(agents[8].id, { 
        stats: { transactionCount: 60, successfulDeals: 50, failedDeals: 10, betrayals: 0 }
      });
    });

    describe('wallet leaderboard', () => {
      it('should return agents sorted by wallet balance descending', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', 10);
        
        // Check that first agent has highest wallet
        expect(leaderboard[0].wallet).toBe(5000);
        expect(leaderboard[1].wallet).toBe(4000);
        expect(leaderboard[2].wallet).toBe(3000);
      });

      it('should respect the limit parameter', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', 3);
        expect(leaderboard).toHaveLength(3);
      });

      it('should return all agents if limit exceeds agent count', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', 100);
        expect(leaderboard).toHaveLength(10);
      });
    });

    describe('reputation leaderboard', () => {
      it('should return agents sorted by reputation descending', () => {
        const leaderboard = agentManager.getLeaderboard('reputation', 10);
        
        // Check that first agent has highest reputation
        expect(leaderboard[0].reputation).toBe(95);
        expect(leaderboard[1].reputation).toBe(90);
        expect(leaderboard[2].reputation).toBe(85);
      });

      it('should respect the limit parameter', () => {
        const leaderboard = agentManager.getLeaderboard('reputation', 5);
        expect(leaderboard).toHaveLength(5);
      });
    });

    describe('activity leaderboard', () => {
      it('should return agents sorted by transaction count descending', () => {
        const leaderboard = agentManager.getLeaderboard('activity', 10);
        
        // Check that first agent has highest transaction count
        expect(leaderboard[0].stats.transactionCount).toBe(60);
        expect(leaderboard[1].stats.transactionCount).toBe(50);
        expect(leaderboard[2].stats.transactionCount).toBe(30);
      });

      it('should respect the limit parameter', () => {
        const leaderboard = agentManager.getLeaderboard('activity', 2);
        expect(leaderboard).toHaveLength(2);
      });
    });

    describe('edge cases', () => {
      it('should return empty array when no agents exist', () => {
        const emptyManager = new AgentManager();
        const leaderboard = emptyManager.getLeaderboard('wallet', 10);
        expect(leaderboard).toEqual([]);
      });

      it('should return empty array for all criteria when no agents exist', () => {
        const emptyManager = new AgentManager();
        expect(emptyManager.getLeaderboard('wallet', 10)).toEqual([]);
        expect(emptyManager.getLeaderboard('reputation', 10)).toEqual([]);
        expect(emptyManager.getLeaderboard('activity', 10)).toEqual([]);
      });

      it('should handle limit of 0', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', 0);
        expect(leaderboard).toEqual([]);
      });

      it('should handle negative limit by returning empty array', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', -5);
        expect(leaderboard).toEqual([]);
      });

      it('should handle very large limit values', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', Number.MAX_SAFE_INTEGER);
        expect(leaderboard.length).toBe(10); // Should return all 10 agents
      });

      it('should handle limit of 1 correctly', () => {
        const leaderboard = agentManager.getLeaderboard('wallet', 1);
        expect(leaderboard).toHaveLength(1);
        // Should be the richest agent
        const allAgents = agentManager.getAllAgents();
        const richest = allAgents.reduce((max, agent) => 
          agent.wallet > max.wallet ? agent : max
        );
        expect(leaderboard[0].id).toBe(richest.id);
      });

      it('should return consistent results for multiple calls with same parameters', () => {
        const leaderboard1 = agentManager.getLeaderboard('wallet', 5);
        const leaderboard2 = agentManager.getLeaderboard('wallet', 5);
        expect(leaderboard1).toEqual(leaderboard2);
      });
    });
  });
});

/**
 * Property-Based Tests for AgentManager
 * Feature: shadownet
 */

import * as fc from 'fast-check';

describe('AgentManager Property Tests', () => {
  /**
   * Property 2: Action Logging Consistency
   * **Validates: Requirements 1.4**
   * 
   * For any action performed by an agent, the action must appear in the agent's
   * memory log with a timestamp, and the timestamp must be greater than or equal
   * to the agent's creation timestamp.
   */
  it('Property 2: Action Logging Consistency', () => {
    // Arbitraries for generating test data
    const agentCountArb = fc.integer({ min: 1, max: 20 });
    const initialBalanceArb = fc.integer({ min: 0, max: 10000 });
    const actionTypeArb = fc.constantFrom(
      'hire_agent',
      'trade_resources',
      'form_alliance',
      'risky_deal',
      'invest',
      'save',
      'betray_alliance',
      'build_reputation'
    );
    const outcomeArb = fc.constantFrom('success', 'failure');
    const actionCountArb = fc.integer({ min: 1, max: 50 });

    fc.assert(
      fc.property(
        agentCountArb,
        initialBalanceArb,
        actionCountArb,
        (agentCount, initialBalance, actionCount) => {
          // Create a fresh AgentManager for this test iteration
          const manager = new AgentManager();
          manager.initializeAgents(agentCount, initialBalance);
          const agents = manager.getAllAgents();

          // Pick a random agent to test
          const testAgent = agents[Math.floor(Math.random() * agents.length)];
          const agentCreationTime = testAgent.createdAt;

          // Generate and log multiple actions for this agent
          // Track the last timestamp to ensure chronological order
          let lastTimestamp = agentCreationTime;
          
          for (let i = 0; i < actionCount; i++) {
            // Generate a timestamp that's >= last timestamp
            // Add a random offset (0 to 10 seconds) to simulate time passing
            const timeOffset = Math.floor(Math.random() * 10000); // 0-10 seconds in ms
            const actionTimestamp = lastTimestamp + timeOffset;
            lastTimestamp = actionTimestamp;

            // Generate random action details
            const action: ActionLog = {
              timestamp: actionTimestamp,
              action: fc.sample(actionTypeArb, 1)[0] as any,
              details: {
                target: `agent-${Math.floor(Math.random() * agentCount)}`,
                amount: Math.floor(Math.random() * 1000)
              },
              outcome: fc.sample(outcomeArb, 1)[0] as any
            };

            // Log the action
            manager.logAction(testAgent.id, action);
          }

          // Retrieve the updated agent
          const updatedAgent = manager.getAgent(testAgent.id);
          expect(updatedAgent).toBeDefined();

          // Verify all actions are in memory
          expect(updatedAgent!.memory).toHaveLength(actionCount);

          // Verify each action has a timestamp >= agent creation time
          updatedAgent!.memory.forEach((loggedAction, index) => {
            // 1. Action must have a timestamp
            expect(loggedAction.timestamp).toBeDefined();
            expect(typeof loggedAction.timestamp).toBe('number');
            expect(isFinite(loggedAction.timestamp)).toBe(true);

            // 2. Timestamp must be >= agent creation timestamp
            expect(loggedAction.timestamp).toBeGreaterThanOrEqual(agentCreationTime);

            // 3. Action must have all required fields
            expect(loggedAction.action).toBeDefined();
            expect(loggedAction.details).toBeDefined();
            expect(loggedAction.outcome).toBeDefined();

            // 4. Outcome must be valid
            expect(['success', 'failure']).toContain(loggedAction.outcome);
          });

          // Verify actions are in the order they were logged (chronological)
          for (let i = 1; i < updatedAgent!.memory.length; i++) {
            expect(updatedAgent!.memory[i].timestamp).toBeGreaterThanOrEqual(
              updatedAgent!.memory[i - 1].timestamp
            );
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 2 (Edge Case): Action Logging with Past Timestamps
   * **Validates: Requirements 1.4**
   * 
   * This test verifies that even if we attempt to log an action with a timestamp
   * in the past (before agent creation), the system should still record it.
   * The property states the timestamp must be >= creation time, so this tests
   * that the system doesn't artificially enforce this - it's the caller's
   * responsibility to provide valid timestamps.
   */
  it('Property 2 (Edge Case): Action Logging accepts any timestamp', () => {
    const agentCountArb = fc.integer({ min: 1, max: 10 });
    const initialBalanceArb = fc.integer({ min: 0, max: 5000 });

    fc.assert(
      fc.property(agentCountArb, initialBalanceArb, (agentCount, initialBalance) => {
        const manager = new AgentManager();
        manager.initializeAgents(agentCount, initialBalance);
        const agents = manager.getAllAgents();
        const testAgent = agents[0];

        // Log an action with a timestamp in the past (before creation)
        const pastTimestamp = testAgent.createdAt - 10000; // 10 seconds before creation
        const action: ActionLog = {
          timestamp: pastTimestamp,
          action: 'save',
          details: {},
          outcome: 'success'
        };

        manager.logAction(testAgent.id, action);

        const updatedAgent = manager.getAgent(testAgent.id);
        expect(updatedAgent!.memory).toHaveLength(1);
        expect(updatedAgent!.memory[0].timestamp).toBe(pastTimestamp);

        // This demonstrates that the AgentManager doesn't enforce timestamp
        // validation - it's the caller's responsibility to provide valid timestamps
        // In production, the SimulationOrchestrator should ensure timestamps are valid
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 19: Leaderboard Sorting Correctness
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
   * 
   * For any leaderboard query (by wallet, reputation, or activity), the returned
   * agents must be sorted in descending order by the specified criterion, and if
   * a limit is specified, at most that many agents should be returned.
   */
  it('Property 19: Leaderboard Sorting Correctness', () => {
    // Arbitraries for generating test data
    // Note: Agent count limited to 30 due to unique name pool constraint
    const agentCountArb = fc.integer({ min: 1, max: 30 });
    const initialBalanceArb = fc.integer({ min: 0, max: 10000 });
    const limitArb = fc.integer({ min: 0, max: 100 });
    const criteriaArb = fc.constantFrom('wallet', 'reputation', 'activity');

    fc.assert(
      fc.property(
        agentCountArb,
        initialBalanceArb,
        limitArb,
        criteriaArb,
        (agentCount, initialBalance, limit, criteria) => {
          // Create a fresh AgentManager for this test iteration
          const manager = new AgentManager();
          manager.initializeAgents(agentCount, initialBalance);
          const agents = manager.getAllAgents();

          // Randomize agent values to create diverse leaderboard scenarios
          agents.forEach((agent) => {
            // Randomize wallet balance (0 to 20000)
            const randomWallet = Math.floor(Math.random() * 20000);
            
            // Randomize reputation (0 to 100)
            const randomReputation = Math.floor(Math.random() * 101);
            
            // Randomize transaction count (0 to 200)
            const randomTransactionCount = Math.floor(Math.random() * 201);
            
            manager.updateAgent(agent.id, {
              wallet: randomWallet,
              reputation: randomReputation,
              stats: {
                transactionCount: randomTransactionCount,
                successfulDeals: Math.floor(randomTransactionCount * 0.7),
                failedDeals: Math.floor(randomTransactionCount * 0.3),
                betrayals: 0
              }
            });
          });

          // Get the leaderboard with the specified criteria and limit
          const leaderboard = manager.getLeaderboard(criteria as any, limit);

          // Property 1: At most 'limit' agents should be returned
          expect(leaderboard.length).toBeLessThanOrEqual(limit);

          // Property 2: If limit > agent count, return all agents
          if (limit >= agentCount) {
            expect(leaderboard.length).toBe(agentCount);
          }

          // Property 3: If limit <= 0, return empty array
          if (limit <= 0) {
            expect(leaderboard.length).toBe(0);
            return; // No need to check sorting for empty array
          }

          // Property 4: Agents must be sorted in descending order by the criterion
          for (let i = 1; i < leaderboard.length; i++) {
            const prev = leaderboard[i - 1];
            const curr = leaderboard[i];

            let prevValue: number;
            let currValue: number;

            switch (criteria) {
              case 'wallet':
                prevValue = prev.wallet;
                currValue = curr.wallet;
                break;
              case 'reputation':
                prevValue = prev.reputation;
                currValue = curr.reputation;
                break;
              case 'activity':
                prevValue = prev.stats.transactionCount;
                currValue = curr.stats.transactionCount;
                break;
              default:
                throw new Error(`Unknown criteria: ${criteria}`);
            }

            // Previous value should be >= current value (descending order)
            expect(prevValue).toBeGreaterThanOrEqual(currValue);
          }

          // Property 5: All returned agents should be from the original agent set
          const allAgentIds = new Set(agents.map(a => a.id));
          leaderboard.forEach(agent => {
            expect(allAgentIds.has(agent.id)).toBe(true);
          });

          // Property 6: No duplicate agents in leaderboard
          const leaderboardIds = new Set(leaderboard.map(a => a.id));
          expect(leaderboardIds.size).toBe(leaderboard.length);

          // Property 7: The top agents in leaderboard should have the highest values
          // Get all agents and sort them manually to verify
          const allAgentsUpdated = manager.getAllAgents();
          const manuallySorted = [...allAgentsUpdated].sort((a, b) => {
            switch (criteria) {
              case 'wallet':
                return b.wallet - a.wallet;
              case 'reputation':
                return b.reputation - a.reputation;
              case 'activity':
                return b.stats.transactionCount - a.stats.transactionCount;
              default:
                return 0;
            }
          });

          // The leaderboard should match the top N agents from manual sort
          const expectedTopAgents = manuallySorted.slice(0, Math.min(limit, agentCount));
          expect(leaderboard.length).toBe(expectedTopAgents.length);

          // Verify each agent in leaderboard matches the expected top agents
          for (let i = 0; i < leaderboard.length; i++) {
            expect(leaderboard[i].id).toBe(expectedTopAgents[i].id);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });
});
