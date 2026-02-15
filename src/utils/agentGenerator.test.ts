/**
 * Unit tests for agent generation utilities
 * Requirements: 1.1, 1.2, 10.5
 */

import { describe, it, expect } from '@jest/globals';
import { generateUniqueNames, generateAgents } from './agentGenerator.js';
import { Personality, Role } from '../models/types.js';

describe('generateUniqueNames', () => {
  it('should generate the requested number of unique names', () => {
    const count = 15;
    const names = generateUniqueNames(count);
    
    expect(names).toHaveLength(count);
    
    // Check uniqueness
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(count);
  });

  it('should generate different names on subsequent calls', () => {
    const names1 = generateUniqueNames(10);
    const names2 = generateUniqueNames(10);
    
    // Due to shuffling, it's extremely unlikely to get the same order
    expect(names1).not.toEqual(names2);
  });

  it('should throw error when requesting more names than available', () => {
    expect(() => generateUniqueNames(100)).toThrow();
  });

  it('should handle edge case of generating 1 name', () => {
    const names = generateUniqueNames(1);
    expect(names).toHaveLength(1);
    expect(typeof names[0]).toBe('string');
    expect(names[0].length).toBeGreaterThan(0);
  });
});

describe('generateAgents', () => {
  const PERSONALITIES: Personality[] = ['greedy', 'loyal', 'chaotic', 'strategic'];
  const ROLES: Role[] = ['broker', 'trader', 'researcher', 'fixer'];

  it('should generate the requested number of agents', () => {
    const count = 15;
    const agents = generateAgents(count, 1000);
    
    expect(agents).toHaveLength(count);
  });

  it('should assign unique IDs to each agent', () => {
    const agents = generateAgents(12, 1000);
    const ids = agents.map(a => a.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(agents.length);
  });

  it('should assign unique names to each agent', () => {
    const agents = generateAgents(12, 1000);
    const names = agents.map(a => a.name);
    const uniqueNames = new Set(names);
    
    expect(uniqueNames.size).toBe(agents.length);
  });

  it('should ensure diverse personality distribution', () => {
    const count = 16; // Multiple of 4 for even distribution
    const agents = generateAgents(count, 1000);
    
    const personalityCounts = new Map<Personality, number>();
    PERSONALITIES.forEach(p => personalityCounts.set(p, 0));
    
    agents.forEach(agent => {
      expect(PERSONALITIES).toContain(agent.personality);
      personalityCounts.set(agent.personality, (personalityCounts.get(agent.personality) || 0) + 1);
    });
    
    // Each personality should appear at least once
    PERSONALITIES.forEach(personality => {
      expect(personalityCounts.get(personality)).toBeGreaterThan(0);
    });
    
    // For count=16, each personality should appear exactly 4 times
    PERSONALITIES.forEach(personality => {
      expect(personalityCounts.get(personality)).toBe(4);
    });
  });

  it('should ensure diverse role distribution', () => {
    const count = 16; // Multiple of 4 for even distribution
    const agents = generateAgents(count, 1000);
    
    const roleCounts = new Map<Role, number>();
    ROLES.forEach(r => roleCounts.set(r, 0));
    
    agents.forEach(agent => {
      expect(ROLES).toContain(agent.role);
      roleCounts.set(agent.role, (roleCounts.get(agent.role) || 0) + 1);
    });
    
    // Each role should appear at least once
    ROLES.forEach(role => {
      expect(roleCounts.get(role)).toBeGreaterThan(0);
    });
    
    // For count=16, each role should appear exactly 4 times
    ROLES.forEach(role => {
      expect(roleCounts.get(role)).toBe(4);
    });
  });

  it('should initialize wallet balance with variance around initial balance', () => {
    const initialBalance = 1000;
    const agents = generateAgents(15, initialBalance);
    
    agents.forEach(agent => {
      // Wallet should be within [-100, +100] of initial balance
      expect(agent.wallet).toBeGreaterThanOrEqual(initialBalance - 100);
      expect(agent.wallet).toBeLessThanOrEqual(initialBalance + 100);
      // Wallet should never be negative
      expect(agent.wallet).toBeGreaterThanOrEqual(0);
    });
  });

  it('should initialize reputation between 40 and 60', () => {
    const agents = generateAgents(15, 1000);
    
    agents.forEach(agent => {
      expect(agent.reputation).toBeGreaterThanOrEqual(40);
      expect(agent.reputation).toBeLessThanOrEqual(60);
    });
  });

  it('should initialize empty memory log', () => {
    const agents = generateAgents(12, 1000);
    
    agents.forEach(agent => {
      expect(agent.memory).toEqual([]);
      expect(Array.isArray(agent.memory)).toBe(true);
    });
  });

  it('should initialize empty alliances array', () => {
    const agents = generateAgents(12, 1000);
    
    agents.forEach(agent => {
      expect(agent.alliances).toEqual([]);
      expect(Array.isArray(agent.alliances)).toBe(true);
    });
  });

  it('should set createdAt timestamp', () => {
    const beforeTime = Date.now();
    const agents = generateAgents(12, 1000);
    const afterTime = Date.now();
    
    agents.forEach(agent => {
      expect(agent.createdAt).toBeGreaterThanOrEqual(beforeTime);
      expect(agent.createdAt).toBeLessThanOrEqual(afterTime);
    });
  });

  it('should initialize stats with zero values', () => {
    const agents = generateAgents(12, 1000);
    
    agents.forEach(agent => {
      expect(agent.stats.transactionCount).toBe(0);
      expect(agent.stats.successfulDeals).toBe(0);
      expect(agent.stats.failedDeals).toBe(0);
      expect(agent.stats.betrayals).toBe(0);
    });
  });

  it('should handle minimum agent count (12)', () => {
    const agents = generateAgents(12, 1000);
    
    expect(agents).toHaveLength(12);
    
    // Should still have at least 2 different personalities
    const personalities = new Set(agents.map(a => a.personality));
    expect(personalities.size).toBeGreaterThanOrEqual(2);
    
    // Should still have at least 2 different roles
    const roles = new Set(agents.map(a => a.role));
    expect(roles.size).toBeGreaterThanOrEqual(2);
  });

  it('should handle maximum agent count (20)', () => {
    const agents = generateAgents(20, 1000);
    
    expect(agents).toHaveLength(20);
    
    // Should have all 4 personalities represented
    const personalities = new Set(agents.map(a => a.personality));
    expect(personalities.size).toBe(4);
    
    // Should have all 4 roles represented
    const roles = new Set(agents.map(a => a.role));
    expect(roles.size).toBe(4);
  });

  it('should ensure non-negative wallet even with negative variance', () => {
    // Test with very low initial balance
    const agents = generateAgents(12, 50);
    
    agents.forEach(agent => {
      expect(agent.wallet).toBeGreaterThanOrEqual(0);
    });
  });
});
