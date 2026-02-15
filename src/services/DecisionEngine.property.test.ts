/**
 * Property-Based Tests for DecisionEngine
 * Feature: shadownet
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { DecisionEngine } from './DecisionEngine.js';
import { Agent, DecisionContext, ActionType } from '../models/types.js';

describe('DecisionEngine Property Tests', () => {
  /**
   * Property 3: Decision Context Completeness
   * **Validates: Requirements 2.2**
   * 
   * For any agent making a decision, the prompt sent to the LLM must include
   * all required context: agent name, personality, role, wallet balance,
   * reputation, and available actions.
   */
  it('Property 3: Decision Context Completeness', () => {
    const personalityArb = fc.constantFrom('greedy', 'loyal', 'chaotic', 'strategic');
    const roleArb = fc.constantFrom('broker', 'trader', 'researcher', 'fixer');
    const walletArb = fc.integer({ min: 0, max: 10000 });
    const reputationArb = fc.integer({ min: 0, max: 100 });

    fc.assert(
      fc.property(
        personalityArb,
        roleArb,
        walletArb,
        reputationArb,
        (personality, role, wallet, reputation) => {
          const decisionEngine = new DecisionEngine({
            provider: 'openai',
            apiKey: 'fake-api-key',
            model: 'gpt-4o-mini',
          });

          // Create a test agent
          const agent: Agent = {
            id: 'test-agent',
            name: 'TestAgent',
            personality: personality as any,
            role: role as any,
            wallet,
            reputation,
            memory: [],
            alliances: [],
            createdAt: Date.now(),
            stats: {
              transactionCount: 0,
              successfulDeals: 0,
              failedDeals: 0,
              betrayals: 0
            }
          };

          const otherAgents: Agent[] = [
            {
              id: 'other-agent-1',
              name: 'OtherAgent1',
              personality: 'greedy',
              role: 'broker',
              wallet: 1000,
              reputation: 50,
              memory: [],
              alliances: [],
              createdAt: Date.now(),
              stats: {
                transactionCount: 0,
                successfulDeals: 0,
                failedDeals: 0,
                betrayals: 0
              }
            }
          ];

          const availableActions: ActionType[] = [
            'hire_agent',
            'trade_resources',
            'form_alliance',
            'risky_deal',
            'invest',
            'save',
            'betray_alliance',
            'build_reputation'
          ];

          // Build the decision context
          const context: DecisionContext = {
            agent,
            otherAgents,
            recentActivity: [],
            availableActions,
            economicState: {
              averageWealth: 1000,
              averageReputation: 50,
            },
          };

          // Build the prompt
          const prompt = decisionEngine.buildPrompt(context);

          // Property: Prompt must include agent name
          expect(prompt).toContain(agent.name);

          // Property: Prompt must include personality
          expect(prompt.toLowerCase()).toContain(personality.toLowerCase());

          // Property: Prompt must include role
          expect(prompt.toLowerCase()).toContain(role.toLowerCase());

          // Property: Prompt must include wallet balance
          expect(prompt).toContain(wallet.toString());

          // Property: Prompt must include reputation
          expect(prompt).toContain(reputation.toString());

          // Property: Prompt must include available actions
          availableActions.forEach(action => {
            expect(prompt.toLowerCase()).toContain(action.toLowerCase());
          });

          // Property: Prompt must include other agents information
          expect(prompt).toContain('OtherAgent1');
        }
      ),
      { numRuns: 100 }
    );
  });
});
