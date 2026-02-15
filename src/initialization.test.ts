/**
 * Unit Tests for System Initialization
 * Tests environment variable validation, error handling, and seed data loading
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateConfig } from './utils/config.js';

describe('System Initialization', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variable Validation', () => {
    it('should validate all required environment variables', () => {
      // Set all required variables
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.PORT = '3000';
      process.env.AGENT_COUNT = '15';
      process.env.INITIAL_BALANCE = '1000';

      const config = validateConfig();

      expect(config.llmProvider).toBe('openai');
      expect(config.llmApiKey).toBe('test-key');
      expect(config.port).toBe(3000);
      expect(config.agentCount).toBe(15);
      expect(config.initialBalance).toBe(1000);
    });

    it('should throw error for missing LLM_PROVIDER', () => {
      delete process.env.LLM_PROVIDER;
      process.env.LLM_API_KEY = 'test-key';

      expect(() => validateConfig()).toThrow('LLM_PROVIDER');
    });

    it('should throw error for missing LLM_API_KEY', () => {
      process.env.LLM_PROVIDER = 'openai';
      delete process.env.LLM_API_KEY;

      expect(() => validateConfig()).toThrow('LLM_API_KEY');
    });

    it('should use default values for optional variables', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      delete process.env.PORT;
      delete process.env.AGENT_COUNT;
      delete process.env.INITIAL_BALANCE;

      const config = validateConfig();

      expect(config.port).toBe(3000); // Default port
      expect(config.agentCount).toBe(15); // Default agent count
      expect(config.initialBalance).toBe(1000); // Default initial balance
    });

    it('should validate agent count is within range', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.AGENT_COUNT = '5'; // Below minimum of 12

      expect(() => validateConfig()).toThrow('AGENT_COUNT must be between 12 and 20');
    });

    it('should validate agent count maximum', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.AGENT_COUNT = '25'; // Above maximum of 20

      expect(() => validateConfig()).toThrow('AGENT_COUNT must be between 12 and 20');
    });

    it('should validate initial balance is positive', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.INITIAL_BALANCE = '-100';

      expect(() => validateConfig()).toThrow('INITIAL_BALANCE must be positive');
    });

    it('should validate port is a valid number', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.PORT = 'invalid';

      expect(() => validateConfig()).toThrow();
    });

    it('should accept valid LLM providers', () => {
      process.env.LLM_API_KEY = 'test-key';

      // Test openai
      process.env.LLM_PROVIDER = 'openai';
      let config = validateConfig();
      expect(config.llmProvider).toBe('openai');

      // Test gemini
      process.env.LLM_PROVIDER = 'gemini';
      config = validateConfig();
      expect(config.llmProvider).toBe('gemini');
    });

    it('should reject invalid LLM provider', () => {
      process.env.LLM_PROVIDER = 'invalid-provider';
      process.env.LLM_API_KEY = 'test-key';

      expect(() => validateConfig()).toThrow('LLM_PROVIDER must be either openai or gemini');
    });
  });

  describe('Graceful Error Handling', () => {
    it('should handle missing config gracefully', () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_API_KEY;

      expect(() => validateConfig()).toThrow();
    });

    it('should provide clear error messages', () => {
      delete process.env.LLM_PROVIDER;
      process.env.LLM_API_KEY = 'test-key';

      try {
        validateConfig();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('LLM_PROVIDER');
      }
    });
  });

  describe('Seed Data Loading', () => {
    it('should initialize with default agent count', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      delete process.env.AGENT_COUNT;

      const config = validateConfig();
      expect(config.agentCount).toBe(15);
    });

    it('should initialize with default initial balance', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      delete process.env.INITIAL_BALANCE;

      const config = validateConfig();
      expect(config.initialBalance).toBe(1000);
    });

    it('should accept custom agent count within range', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.AGENT_COUNT = '18';

      const config = validateConfig();
      expect(config.agentCount).toBe(18);
    });

    it('should accept custom initial balance', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';
      process.env.INITIAL_BALANCE = '2500';

      const config = validateConfig();
      expect(config.initialBalance).toBe(2500);
    });
  });

  describe('Configuration Defaults', () => {
    it('should use default cycle delays', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';

      const config = validateConfig();
      expect(config.minCycleDelay).toBe(5000);
      expect(config.maxCycleDelay).toBe(10000);
    });

    it('should use default block interval', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';

      const config = validateConfig();
      expect(config.blockInterval).toBe(30000);
    });

    it('should use default LLM model', () => {
      process.env.LLM_PROVIDER = 'openai';
      process.env.LLM_API_KEY = 'test-key';

      const config = validateConfig();
      expect(config.llmModel).toBeDefined();
    });
  });
});
