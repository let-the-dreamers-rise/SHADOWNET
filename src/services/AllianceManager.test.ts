/**
 * AllianceManager Unit Tests
 * Tests alliance formation, betrayal, and query operations
 */

import { AllianceManager } from './AllianceManager.js';
import { Alliance } from '../models/types.js';

describe('AllianceManager', () => {
  let allianceManager: AllianceManager;

  beforeEach(() => {
    allianceManager = new AllianceManager();
  });

  describe('formAlliance', () => {
    it('should create an alliance between two agents', () => {
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';

      const alliance = allianceManager.formAlliance(agentId1, agentId2);

      expect(alliance).toBeDefined();
      expect(alliance.id).toBeDefined();
      expect(alliance.members).toEqual([agentId1, agentId2]);
      expect(alliance.formedAt).toBeGreaterThan(0);
      expect(alliance.active).toBe(true);
    });

    it('should create unique alliance IDs for different alliances', () => {
      const alliance1 = allianceManager.formAlliance('agent-1', 'agent-2');
      const alliance2 = allianceManager.formAlliance('agent-3', 'agent-4');

      expect(alliance1.id).not.toBe(alliance2.id);
    });

    it('should allow an agent to form multiple alliances', () => {
      const agentId = 'agent-1';
      
      const alliance1 = allianceManager.formAlliance(agentId, 'agent-2');
      const alliance2 = allianceManager.formAlliance(agentId, 'agent-3');

      expect(alliance1.id).not.toBe(alliance2.id);
      
      const agentAlliances = allianceManager.getAgentAlliances(agentId);
      expect(agentAlliances).toHaveLength(2);
    });
  });

  describe('breakAlliance', () => {
    it('should mark an alliance as inactive', () => {
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';
      
      const alliance = allianceManager.formAlliance(agentId1, agentId2);
      expect(alliance.active).toBe(true);

      allianceManager.breakAlliance(alliance.id, agentId1);

      const alliances = allianceManager.getAgentAlliances(agentId1);
      const brokenAlliance = alliances.find(a => a.id === alliance.id);
      
      expect(brokenAlliance).toBeDefined();
      expect(brokenAlliance!.active).toBe(false);
    });

    it('should handle breaking a non-existent alliance gracefully', () => {
      expect(() => {
        allianceManager.breakAlliance('non-existent-id', 'agent-1');
      }).not.toThrow();
    });

    it('should handle breaking an already inactive alliance gracefully', () => {
      const alliance = allianceManager.formAlliance('agent-1', 'agent-2');
      
      allianceManager.breakAlliance(alliance.id, 'agent-1');
      
      // Try to break it again
      expect(() => {
        allianceManager.breakAlliance(alliance.id, 'agent-1');
      }).not.toThrow();
    });
  });

  describe('areAllied', () => {
    it('should return true when agents have an active alliance', () => {
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';

      allianceManager.formAlliance(agentId1, agentId2);

      expect(allianceManager.areAllied(agentId1, agentId2)).toBe(true);
      expect(allianceManager.areAllied(agentId2, agentId1)).toBe(true);
    });

    it('should return false when agents have no alliance', () => {
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';

      expect(allianceManager.areAllied(agentId1, agentId2)).toBe(false);
    });

    it('should return false when alliance is broken', () => {
      const agentId1 = 'agent-1';
      const agentId2 = 'agent-2';

      const alliance = allianceManager.formAlliance(agentId1, agentId2);
      allianceManager.breakAlliance(alliance.id, agentId1);

      expect(allianceManager.areAllied(agentId1, agentId2)).toBe(false);
    });

    it('should return false for agents not in any alliance', () => {
      allianceManager.formAlliance('agent-1', 'agent-2');

      expect(allianceManager.areAllied('agent-3', 'agent-4')).toBe(false);
    });
  });

  describe('getAgentAlliances', () => {
    it('should return all alliances for an agent', () => {
      const agentId = 'agent-1';

      allianceManager.formAlliance(agentId, 'agent-2');
      allianceManager.formAlliance(agentId, 'agent-3');

      const alliances = allianceManager.getAgentAlliances(agentId);

      expect(alliances).toHaveLength(2);
      expect(alliances.every(a => a.members.includes(agentId))).toBe(true);
    });

    it('should return empty array for agent with no alliances', () => {
      const alliances = allianceManager.getAgentAlliances('agent-1');

      expect(alliances).toEqual([]);
    });

    it('should return both active and inactive alliances', () => {
      const agentId = 'agent-1';

      const alliance1 = allianceManager.formAlliance(agentId, 'agent-2');
      const alliance2 = allianceManager.formAlliance(agentId, 'agent-3');

      allianceManager.breakAlliance(alliance1.id, agentId);

      const alliances = allianceManager.getAgentAlliances(agentId);

      expect(alliances).toHaveLength(2);
      expect(alliances.some(a => a.active)).toBe(true);
      expect(alliances.some(a => !a.active)).toBe(true);
    });
  });

  describe('getActiveAllianceCount', () => {
    it('should return 0 when no alliances exist', () => {
      expect(allianceManager.getActiveAllianceCount()).toBe(0);
    });

    it('should return count of active alliances', () => {
      allianceManager.formAlliance('agent-1', 'agent-2');
      allianceManager.formAlliance('agent-3', 'agent-4');

      expect(allianceManager.getActiveAllianceCount()).toBe(2);
    });

    it('should not count inactive alliances', () => {
      const alliance1 = allianceManager.formAlliance('agent-1', 'agent-2');
      allianceManager.formAlliance('agent-3', 'agent-4');

      allianceManager.breakAlliance(alliance1.id, 'agent-1');

      expect(allianceManager.getActiveAllianceCount()).toBe(1);
    });

    it('should return 0 when all alliances are broken', () => {
      const alliance1 = allianceManager.formAlliance('agent-1', 'agent-2');
      const alliance2 = allianceManager.formAlliance('agent-3', 'agent-4');

      allianceManager.breakAlliance(alliance1.id, 'agent-1');
      allianceManager.breakAlliance(alliance2.id, 'agent-3');

      expect(allianceManager.getActiveAllianceCount()).toBe(0);
    });
  });

  describe('Multiple simultaneous alliances', () => {
    it('should support an agent being in multiple active alliances', () => {
      const agentId = 'agent-1';

      allianceManager.formAlliance(agentId, 'agent-2');
      allianceManager.formAlliance(agentId, 'agent-3');
      allianceManager.formAlliance(agentId, 'agent-4');

      const alliances = allianceManager.getAgentAlliances(agentId);
      const activeAlliances = alliances.filter(a => a.active);

      expect(activeAlliances).toHaveLength(3);
    });

    it('should correctly track alliances after some are broken', () => {
      const agentId = 'agent-1';

      const alliance1 = allianceManager.formAlliance(agentId, 'agent-2');
      const alliance2 = allianceManager.formAlliance(agentId, 'agent-3');
      const alliance3 = allianceManager.formAlliance(agentId, 'agent-4');

      allianceManager.breakAlliance(alliance2.id, agentId);

      expect(allianceManager.areAllied(agentId, 'agent-2')).toBe(true);
      expect(allianceManager.areAllied(agentId, 'agent-3')).toBe(false);
      expect(allianceManager.areAllied(agentId, 'agent-4')).toBe(true);
    });
  });
});
