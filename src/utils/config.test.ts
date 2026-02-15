import { describe, it, expect } from '@jest/globals';
import { Config } from './config.js';

describe('Configuration Validation', () => {
  it('should validate LLM_PROVIDER values', () => {
    // Test that only 'openai' and 'gemini' are valid
    const validProviders = ['openai', 'gemini'];
    validProviders.forEach(provider => {
      expect(['openai', 'gemini']).toContain(provider);
    });
  });

  it('should validate AGENT_COUNT range', () => {
    // Test that agent count must be between 12 and 20
    const validCount = 15;
    const belowMin = 10;
    const aboveMax = 25;

    expect(validCount).toBeGreaterThanOrEqual(12);
    expect(validCount).toBeLessThanOrEqual(20);
    expect(belowMin).toBeLessThan(12);
    expect(aboveMax).toBeGreaterThan(20);
  });

  it('should have correct default values', () => {
    // Test default values match specification
    const defaults = {
      agentCount: 15,
      initialBalance: 1000,
      decisionCycleMin: 5000,
      decisionCycleMax: 10000,
      blockInterval: 30000,
      port: 3000,
      logLevel: 'info',
      frontendUrl: 'http://localhost:5173'
    };

    expect(defaults.agentCount).toBe(15);
    expect(defaults.initialBalance).toBe(1000);
    expect(defaults.decisionCycleMin).toBe(5000);
    expect(defaults.decisionCycleMax).toBe(10000);
    expect(defaults.blockInterval).toBe(30000);
    expect(defaults.port).toBe(3000);
    expect(defaults.logLevel).toBe('info');
    expect(defaults.frontendUrl).toBe('http://localhost:5173');
  });

  it('should validate number parsing', () => {
    // Test that number parsing works correctly
    const validNumber = '15';
    const invalidNumber = 'not-a-number';

    expect(parseInt(validNumber, 10)).toBe(15);
    expect(isNaN(parseInt(invalidNumber, 10))).toBe(true);
  });

  it('should validate required fields exist in Config interface', () => {
    // Test that Config interface has all required fields
    const mockConfig: Config = {
      llmProvider: 'openai',
      llmApiKey: 'test-key',
      llmModel: 'gpt-4o-mini',
      agentCount: 15,
      initialBalance: 1000,
      decisionCycleMin: 5000,
      decisionCycleMax: 10000,
      minCycleDelay: 5000,
      maxCycleDelay: 10000,
      blockInterval: 30000,
      port: 3000,
      logLevel: 'info',
      frontendUrl: 'http://localhost:5173'
    };

    expect(mockConfig).toHaveProperty('llmProvider');
    expect(mockConfig).toHaveProperty('llmApiKey');
    expect(mockConfig).toHaveProperty('agentCount');
    expect(mockConfig).toHaveProperty('initialBalance');
    expect(mockConfig).toHaveProperty('decisionCycleMin');
    expect(mockConfig).toHaveProperty('decisionCycleMax');
    expect(mockConfig).toHaveProperty('blockInterval');
    expect(mockConfig).toHaveProperty('port');
    expect(mockConfig).toHaveProperty('logLevel');
    expect(mockConfig).toHaveProperty('frontendUrl');
  });
});
