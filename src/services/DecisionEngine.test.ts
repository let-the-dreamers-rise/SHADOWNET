/**
 * DecisionEngine Unit Tests
 * Tests LLM integration, retry logic, fallback behavior, and response parsing
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DecisionEngine, LLMProvider } from './DecisionEngine.js';
import { DecisionContext, Agent, Transaction, ActionType } from '../models/types.js';

describe('DecisionEngine', () => {
  let engine: DecisionEngine;
  let mockContext: DecisionContext;
  let mockAgent: Agent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create test agent
    mockAgent = {
      id: 'agent-1',
      name: 'TestAgent',
      personality: 'strategic',
      role: 'trader',
      wallet: 1000,
      reputation: 50,
      memory: [],
      alliances: [],
      createdAt: Date.now(),
      stats: {
        transactionCount: 0,
        successfulDeals: 0,
        failedDeals: 0,
        betrayals: 0,
      },
    };

    // Create test context
    mockContext = {
      agent: mockAgent,
      otherAgents: [
        {
          id: 'agent-2',
          name: 'OtherAgent',
          personality: 'greedy',
          role: 'broker',
          wallet: 800,
          reputation: 60,
          memory: [],
          alliances: [],
          createdAt: Date.now(),
          stats: {
            transactionCount: 5,
            successfulDeals: 3,
            failedDeals: 2,
            betrayals: 0,
          },
        },
      ],
      recentActivity: [],
      availableActions: ['trade_resources', 'form_alliance', 'save'] as ActionType[],
      economicState: {
        averageWealth: 900,
        averageReputation: 55,
      },
    };

    // Create engine with OpenAI provider
    engine = new DecisionEngine({
      provider: 'openai',
      apiKey: 'test-api-key',
    });
  });

  describe('buildPrompt', () => {
    it('should build a comprehensive prompt with agent context', () => {
      const prompt = engine.buildPrompt(mockContext);

      // Check that prompt includes key information
      expect(prompt).toContain('TestAgent');
      expect(prompt).toContain('strategic');
      expect(prompt).toContain('trader');
      expect(prompt).toContain('1000 credits');
      expect(prompt).toContain('50/100');
      expect(prompt).toContain('OtherAgent');
      expect(prompt).toContain('trade_resources');
      expect(prompt).toContain('form_alliance');
      expect(prompt).toContain('save');
    });

    it('should include personality description', () => {
      const prompt = engine.buildPrompt(mockContext);
      expect(prompt).toContain('calculated');
      expect(prompt).toContain('logical');
    });

    it('should include role description', () => {
      const prompt = engine.buildPrompt(mockContext);
      expect(prompt).toContain('resource exchanges');
      expect(prompt).toContain('trading');
    });

    it('should include recent actions from memory', () => {
      mockAgent.memory = [
        {
          timestamp: Date.now() - 10000,
          action: 'trade_resources',
          details: {},
          outcome: 'success',
        },
      ];

      const prompt = engine.buildPrompt(mockContext);
      expect(prompt).toContain('trade_resources');
      expect(prompt).toContain('success');
    });

    it('should include alliance information', () => {
      mockAgent.alliances = ['agent-3', 'agent-4'];

      const prompt = engine.buildPrompt(mockContext);
      expect(prompt).toContain('agent-3');
      expect(prompt).toContain('agent-4');
    });

    it('should include economic state', () => {
      const prompt = engine.buildPrompt(mockContext);
      expect(prompt).toContain('900');
      expect(prompt).toContain('55');
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        action: 'trade_resources',
        target: 'agent-2',
        amount: 100,
        reasoning: 'Good opportunity',
      });

      const decision = engine.parseResponse(response);

      expect(decision.action).toBe('trade_resources');
      expect(decision.target).toBe('agent-2');
      expect(decision.amount).toBe(100);
      expect(decision.reasoning).toBe('Good opportunity');
    });

    it('should extract JSON from response with extra text', () => {
      const response = 'Here is my decision:\n{"action": "save", "reasoning": "Being cautious"}\nThat is all.';

      const decision = engine.parseResponse(response);

      expect(decision.action).toBe('save');
      expect(decision.reasoning).toBe('Being cautious');
    });

    it('should handle response without optional fields', () => {
      const response = JSON.stringify({
        action: 'save',
      });

      const decision = engine.parseResponse(response);

      expect(decision.action).toBe('save');
      expect(decision.target).toBeUndefined();
      expect(decision.amount).toBeUndefined();
    });

    it('should throw error for missing action field', () => {
      const response = JSON.stringify({
        target: 'agent-2',
        amount: 100,
      });

      expect(() => engine.parseResponse(response)).toThrow('Missing required field: action');
    });

    it('should throw error for invalid JSON', () => {
      const response = 'This is not JSON at all';

      expect(() => engine.parseResponse(response)).toThrow('No JSON object found');
    });

    it('should throw error for malformed JSON', () => {
      const response = '{"action": "save", invalid}';

      expect(() => engine.parseResponse(response)).toThrow();
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = async () => 'success';

      const result = await engine.retryWithBackoff(mockFn, 3);

      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const mockFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return 'success';
      };

      const result = await engine.retryWithBackoff(mockFn, 3, 10); // Short delay for testing

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw error after max retries', async () => {
      const mockFn = async () => {
        throw new Error('Always fails');
      };

      await expect(engine.retryWithBackoff(mockFn, 3, 10)).rejects.toThrow('Always fails');
    });

    it('should use exponential backoff delays', async () => {
      let attempts = 0;
      const mockFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error(`Fail ${attempts}`);
        }
        return 'success';
      };

      const startTime = Date.now();
      await engine.retryWithBackoff(mockFn, 3, 50);
      const duration = Date.now() - startTime;

      // Should wait 50ms + 100ms = 150ms minimum
      expect(duration).toBeGreaterThanOrEqual(140); // Allow some margin
    });
  });

  describe('getFallbackDecision', () => {
    it('should return safe save action', () => {
      const decision = engine.getFallbackDecision(mockAgent);

      expect(decision.action).toBe('save');
      expect(decision.reasoning).toContain('LLM unavailable');
    });

    it('should work with any agent', () => {
      const anotherAgent = { ...mockAgent, name: 'AnotherAgent' };
      const decision = engine.getFallbackDecision(anotherAgent);

      expect(decision.action).toBe('save');
    });
  });

  describe('makeDecision - OpenAI', () => {
    it('should use fallback on API failure (simulated by invalid key)', async () => {
      // Using invalid API key will cause failure, triggering fallback
      const testEngine = new DecisionEngine({
        provider: 'openai',
        apiKey: 'invalid-key',
      });

      const decision = await testEngine.makeDecision(mockContext);

      expect(decision.action).toBe('save');
      expect(decision.reasoning).toContain('LLM unavailable');
    }, 10000); // 10 second timeout for API retry logic
  });

  describe('makeDecision - Gemini', () => {
    it('should use fallback on API failure (simulated by invalid key)', async () => {
      const testEngine = new DecisionEngine({
        provider: 'gemini',
        apiKey: 'invalid-key',
      });

      const decision = await testEngine.makeDecision(mockContext);

      expect(decision.action).toBe('save');
      expect(decision.reasoning).toContain('LLM unavailable');
    }, 10000); // 10 second timeout for API retry logic
  });

  describe('Action type support', () => {
    it('should parse all action types correctly', () => {
      const allActions: ActionType[] = [
        'hire_agent',
        'trade_resources',
        'form_alliance',
        'risky_deal',
        'invest',
        'save',
        'betray_alliance',
        'build_reputation',
      ];

      for (const action of allActions) {
        const response = JSON.stringify({
          action,
          reasoning: `Testing ${action}`,
        });

        const decision = engine.parseResponse(response);
        expect(decision.action).toBe(action);
      }
    });
  });

  describe('Custom model configuration', () => {
    it('should use custom OpenAI model', () => {
      const customEngine = new DecisionEngine({
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      // Access private field through type assertion for testing
      expect((customEngine as any).model).toBe('gpt-4');
    });

    it('should use custom Gemini model', () => {
      const customEngine = new DecisionEngine({
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-pro-vision',
      });

      expect((customEngine as any).model).toBe('gemini-pro-vision');
    });
  });
});
