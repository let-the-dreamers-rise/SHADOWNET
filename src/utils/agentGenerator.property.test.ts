/**
 * Property-Based Tests for Agent Generation
 * Feature: shadownet
 * **Validates: Requirements 1.2, 1.3**
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { generateAgents } from './agentGenerator.js';
import { Personality, Role } from '../models/types.js';

describe('Agent Generation Property Tests', () => {
  const VALID_PERSONALITIES: Personality[] = ['greedy', 'loyal', 'chaotic', 'strategic'];
  const VALID_ROLES: Role[] = ['broker', 'trader', 'researcher', 'fixer'];

  /**
   * Property 1: Agent Initialization Completeness
   * **Validates: Requirements 1.2, 1.3**
   * 
   * For any agent created by the system, the agent must have all required fields
   * populated with valid values:
   * - Unique non-empty name
   * - Personality from valid set (greedy/loyal/chaotic/strategic)
   * - Role from valid set (broker/trader/researcher/fixer)
   * - Non-negative wallet balance
   * - Reputation score between 0 and 100
   * - Initialized (possibly empty) memory log
   */
  it('Property 1: Agent Initialization Completeness', () => {
    // Generate random test cases for agent count (12-20) and initial balance (0-10000)
    const agentCountArb = fc.integer({ min: 12, max: 20 });
    const initialBalanceArb = fc.integer({ min: 0, max: 10000 });

    fc.assert(
      fc.property(agentCountArb, initialBalanceArb, (count, initialBalance) => {
        // Generate agents with the given parameters
        const agents = generateAgents(count, initialBalance);

        // Verify we got the correct number of agents
        expect(agents).toHaveLength(count);

        // Track names to verify uniqueness
        const seenNames = new Set<string>();

        // Check each agent for completeness
        agents.forEach((agent) => {
          // 1. Agent must have a unique non-empty name
          expect(agent.name).toBeDefined();
          expect(typeof agent.name).toBe('string');
          expect(agent.name.length).toBeGreaterThan(0);
          expect(seenNames.has(agent.name)).toBe(false);
          seenNames.add(agent.name);

          // 2. Agent must have a valid personality from the set
          expect(VALID_PERSONALITIES).toContain(agent.personality);

          // 3. Agent must have a valid role from the set
          expect(VALID_ROLES).toContain(agent.role);

          // 4. Agent must have a non-negative wallet balance
          expect(agent.wallet).toBeGreaterThanOrEqual(0);
          expect(typeof agent.wallet).toBe('number');
          expect(isFinite(agent.wallet)).toBe(true);

          // 5. Agent must have a reputation score between 0 and 100
          expect(agent.reputation).toBeGreaterThanOrEqual(0);
          expect(agent.reputation).toBeLessThanOrEqual(100);
          expect(typeof agent.reputation).toBe('number');
          expect(isFinite(agent.reputation)).toBe(true);

          // 6. Agent must have an initialized memory log (array, possibly empty)
          expect(Array.isArray(agent.memory)).toBe(true);
          expect(agent.memory).toBeDefined();

          // Additional completeness checks for other required fields
          
          // Agent must have a unique ID
          expect(agent.id).toBeDefined();
          expect(typeof agent.id).toBe('string');
          expect(agent.id.length).toBeGreaterThan(0);

          // Agent must have an initialized alliances array
          expect(Array.isArray(agent.alliances)).toBe(true);
          expect(agent.alliances).toBeDefined();

          // Agent must have a valid createdAt timestamp
          expect(agent.createdAt).toBeDefined();
          expect(typeof agent.createdAt).toBe('number');
          expect(agent.createdAt).toBeGreaterThan(0);

          // Agent must have initialized stats
          expect(agent.stats).toBeDefined();
          expect(typeof agent.stats.transactionCount).toBe('number');
          expect(typeof agent.stats.successfulDeals).toBe('number');
          expect(typeof agent.stats.failedDeals).toBe('number');
          expect(typeof agent.stats.betrayals).toBe('number');
          expect(agent.stats.transactionCount).toBeGreaterThanOrEqual(0);
          expect(agent.stats.successfulDeals).toBeGreaterThanOrEqual(0);
          expect(agent.stats.failedDeals).toBeGreaterThanOrEqual(0);
          expect(agent.stats.betrayals).toBeGreaterThanOrEqual(0);
        });

        // Verify all names are unique (double-check)
        expect(seenNames.size).toBe(count);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 21: Agent Diversity at Initialization
   * **Validates: Requirements 10.5**
   * 
   * For any system initialization with n agents where n ≥ 12, the agents must
   * include at least 2 different personality types and at least 2 different
   * role types (ensuring diversity).
   */
  it('Property 21: Agent Diversity at Initialization', () => {
    // Generate random test cases for agent count (12-20) and initial balance (0-10000)
    const agentCountArb = fc.integer({ min: 12, max: 20 });
    const initialBalanceArb = fc.integer({ min: 0, max: 10000 });

    fc.assert(
      fc.property(agentCountArb, initialBalanceArb, (count, initialBalance) => {
        // Generate agents with the given parameters
        const agents = generateAgents(count, initialBalance);

        // Track unique personalities and roles
        const uniquePersonalities = new Set<Personality>();
        const uniqueRoles = new Set<Role>();

        agents.forEach(agent => {
          uniquePersonalities.add(agent.personality);
          uniqueRoles.add(agent.role);
        });

        // Verify at least 2 different personality types exist
        expect(uniquePersonalities.size).toBeGreaterThanOrEqual(2);

        // Verify at least 2 different role types exist
        expect(uniqueRoles.size).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });
});
