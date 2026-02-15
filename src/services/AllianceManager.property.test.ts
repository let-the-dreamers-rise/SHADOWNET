/**
 * Property-Based Tests for AllianceManager
 * Feature: shadownet
 * **Validates: Requirements 5.1, 5.2**
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { AllianceManager } from './AllianceManager.js';
import { Alliance } from '../models/types.js';

describe('AllianceManager Property Tests', () => {
  let allianceManager: AllianceManager;

  beforeEach(() => {
    allianceManager = new AllianceManager();
  });

  /**
   * Property 13: Alliance Formation Creates Record
   * **Validates: Requirements 5.1, 5.2**
   * 
   * For any two agents executing a form_alliance action, an alliance record
   * must be created that includes both agent IDs and a formation timestamp.
   */
  it('Property 13: Alliance Formation Creates Record', () => {
    // Arbitrary for generating agent IDs (non-empty strings)
    const agentIdArb = fc.string({ minLength: 1, maxLength: 50 });

    fc.assert(
      fc.property(agentIdArb, agentIdArb, (agentId1, agentId2) => {
        // Create a fresh AllianceManager for each test case
        const manager = new AllianceManager();
        
        // Record timestamp before alliance formation
        const beforeTimestamp = Date.now();
        
        // Form alliance between the two agents
        const alliance = manager.formAlliance(agentId1, agentId2);
        
        // Record timestamp after alliance formation
        const afterTimestamp = Date.now();
        
        // Verify alliance record was created
        expect(alliance).toBeDefined();
        
        // Verify alliance has a unique ID
        expect(alliance.id).toBeDefined();
        expect(typeof alliance.id).toBe('string');
        expect(alliance.id.length).toBeGreaterThan(0);
        
        // Verify alliance includes both agent IDs
        expect(alliance.members).toBeDefined();
        expect(Array.isArray(alliance.members)).toBe(true);
        expect(alliance.members).toHaveLength(2);
        expect(alliance.members).toContain(agentId1);
        expect(alliance.members).toContain(agentId2);
        
        // Verify alliance has a formation timestamp
        expect(alliance.formedAt).toBeDefined();
        expect(typeof alliance.formedAt).toBe('number');
        expect(alliance.formedAt).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(alliance.formedAt).toBeLessThanOrEqual(afterTimestamp);
        
        // Verify alliance is marked as active
        expect(alliance.active).toBe(true);
        
        // Verify the alliance can be retrieved via getAgentAlliances
        const agent1Alliances = manager.getAgentAlliances(agentId1);
        const agent2Alliances = manager.getAgentAlliances(agentId2);
        
        expect(agent1Alliances).toContainEqual(alliance);
        expect(agent2Alliances).toContainEqual(alliance);
        
        // Verify agents are now allied
        expect(manager.areAllied(agentId1, agentId2)).toBe(true);
        expect(manager.areAllied(agentId2, agentId1)).toBe(true);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 14: Alliance Betrayal Removes Record
   * **Validates: Requirements 5.3, 5.4**
   *
   * For any active alliance, when one member executes a betray_alliance action,
   * the alliance record must be removed (marked inactive or deleted) and the
   * betraying agent's reputation must decrease by 15 to 25 points.
   *
   * Note: This test focuses on the AllianceManager's responsibility (marking inactive).
   * Reputation penalties are handled by EconomyEngine and tested separately.
   */
  it('Property 14: Alliance Betrayal Removes Record', () => {
  // Arbitrary for generating agent IDs (non-empty strings)
  const agentIdArb = fc.string({ minLength: 1, maxLength: 50 });

  fc.assert(
    fc.property(agentIdArb, agentIdArb, (agentId1, agentId2) => {
      // Create a fresh AllianceManager for each test case
      const manager = new AllianceManager();

      // Form an alliance between the two agents
      const alliance = manager.formAlliance(agentId1, agentId2);

      // Verify alliance is initially active
      expect(alliance.active).toBe(true);
      expect(manager.areAllied(agentId1, agentId2)).toBe(true);

      // One agent betrays the alliance
      manager.breakAlliance(alliance.id, agentId1);

      // Verify the alliance record is marked as inactive
      const alliances = manager.getAgentAlliances(agentId1);
      const betrayedAlliance = alliances.find(a => a.id === alliance.id);

      expect(betrayedAlliance).toBeDefined();
      expect(betrayedAlliance!.active).toBe(false);

      // Verify agents are no longer considered allied
      expect(manager.areAllied(agentId1, agentId2)).toBe(false);
      expect(manager.areAllied(agentId2, agentId1)).toBe(false);

      // Verify the alliance record still exists (not deleted, just inactive)
      const agent1Alliances = manager.getAgentAlliances(agentId1);
      const agent2Alliances = manager.getAgentAlliances(agentId2);

      expect(agent1Alliances.some(a => a.id === alliance.id)).toBe(true);
      expect(agent2Alliances.some(a => a.id === alliance.id)).toBe(true);

      // Verify attempting to break an already inactive alliance is handled gracefully
      manager.breakAlliance(alliance.id, agentId2);
      expect(betrayedAlliance!.active).toBe(false); // Still inactive
    }),
    { numRuns: 100 } // Run 100 iterations as specified in design doc
  );
  });

  /**
   * Property 15: Multiple Alliance Support
   * **Validates: Requirements 5.6**
   *
   * For any agent, the agent must be able to form multiple simultaneous alliances
   * without any alliance formation failing due to existing alliances.
   */
  it('Property 15: Multiple Alliance Support', () => {
    // Arbitrary for generating an array of unique agent IDs
    const agentIdArb = fc.string({ minLength: 1, maxLength: 50 });
    const multipleAgentsArb = fc.uniqueArray(agentIdArb, { minLength: 3, maxLength: 10 });

    fc.assert(
      fc.property(multipleAgentsArb, (agentIds) => {
        // Create a fresh AllianceManager for each test case
        const manager = new AllianceManager();

        // Pick the first agent as the one forming multiple alliances
        const centralAgent = agentIds[0];
        const otherAgents = agentIds.slice(1);

        // Form alliances between the central agent and all other agents
        const formedAlliances: Alliance[] = [];
        for (const otherAgent of otherAgents) {
          const alliance = manager.formAlliance(centralAgent, otherAgent);
          formedAlliances.push(alliance);

          // Verify alliance was created successfully
          expect(alliance).toBeDefined();
          expect(alliance.id).toBeDefined();
          expect(alliance.members).toContain(centralAgent);
          expect(alliance.members).toContain(otherAgent);
          expect(alliance.active).toBe(true);
        }

        // Verify the central agent has multiple alliances
        const centralAgentAlliances = manager.getAgentAlliances(centralAgent);
        expect(centralAgentAlliances.length).toBe(otherAgents.length);

        // Verify all formed alliances are active
        for (const alliance of formedAlliances) {
          expect(alliance.active).toBe(true);
          expect(centralAgentAlliances).toContainEqual(alliance);
        }

        // Verify the central agent is allied with all other agents
        for (const otherAgent of otherAgents) {
          expect(manager.areAllied(centralAgent, otherAgent)).toBe(true);
          expect(manager.areAllied(otherAgent, centralAgent)).toBe(true);
        }

        // Verify each alliance is independent (breaking one doesn't affect others)
        if (formedAlliances.length > 1) {
          const allianceToBreak = formedAlliances[0];
          manager.breakAlliance(allianceToBreak.id, centralAgent);

          // Verify the broken alliance is inactive
          expect(allianceToBreak.active).toBe(false);

          // Verify other alliances remain active
          for (let i = 1; i < formedAlliances.length; i++) {
            expect(formedAlliances[i].active).toBe(true);
            expect(manager.areAllied(centralAgent, otherAgents[i])).toBe(true);
          }

          // Verify the central agent still has multiple alliances (including the broken one)
          const updatedAlliances = manager.getAgentAlliances(centralAgent);
          expect(updatedAlliances.length).toBe(otherAgents.length);

          // Count active alliances
          const activeAlliances = updatedAlliances.filter(a => a.active);
          expect(activeAlliances.length).toBe(otherAgents.length - 1);
        }
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });
});
