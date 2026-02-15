/**
 * DecisionEngine Service
 * Integrates with LLM APIs (OpenAI/Gemini) to generate autonomous agent decisions
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6
 */

import axios, { AxiosError } from 'axios';
import { DecisionContext, Decision, ActionType } from '../models/types.js';
import { logger } from '../utils/logger.js';

/**
 * LLM provider type
 */
export type LLMProvider = 'openai' | 'gemini';

/**
 * Configuration for DecisionEngine
 */
export interface DecisionEngineConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string; // Optional model override
}

/**
 * DecisionEngine class handles LLM-based agent decision-making
 * Supports OpenAI and Gemini APIs with retry logic and fallback
 */
export class DecisionEngine {
  private provider: LLMProvider;
  private apiKey: string;
  private model: string;

  constructor(config: DecisionEngineConfig) {
    this.provider = config.provider;
    this.apiKey = config.apiKey;
    
    // Set default models based on provider
    if (config.model) {
      this.model = config.model;
    } else {
      this.model = this.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-pro';
    }
    
    logger.info(`DecisionEngine initialized with provider: ${this.provider}, model: ${this.model}`);
  }

  /**
   * Build prompt for LLM based on agent context and personality
   * Requirements: 2.2
   * 
   * @param context - Decision context including agent state and environment
   * @returns Formatted prompt string
   */
  buildPrompt(context: DecisionContext): string {
    const { agent, otherAgents, recentActivity, availableActions, economicState } = context;

    // Format recent actions from memory
    const recentActions = agent.memory
      .slice(-5)
      .map(log => `- ${log.action} (${log.outcome}) at ${new Date(log.timestamp).toISOString()}`)
      .join('\n') || '- No recent actions';

    // Format other agents
    const otherAgentsInfo = otherAgents
      .map(a => `- ID: ${a.id}, Name: ${a.name} (${a.role}, ${a.personality}): Wallet=${a.wallet}, Reputation=${a.reputation}`)
      .join('\n') || '- No other agents visible';

    // Format recent activity
    const activityInfo = recentActivity
      .slice(0, 5)
      .map(t => `- ${t.actionType}: ${t.from} → ${t.to}, ${t.amount} credits (${t.success ? 'success' : 'failed'})`)
      .join('\n') || '- No recent activity';

    // Build comprehensive prompt
    const prompt = `You are ${agent.name}, an autonomous agent in the SHADOWNET economy simulator.

YOUR IDENTITY:
- Personality: ${agent.personality}
- Role: ${agent.role}
- Wallet: ${agent.wallet} credits
- Reputation: ${agent.reputation}/100

PERSONALITY TRAITS:
${this.getPersonalityDescription(agent.personality)}

ROLE BEHAVIOR:
${this.getRoleDescription(agent.role)}

YOUR RECENT ACTIONS:
${recentActions}

CURRENT ALLIANCES:
${agent.alliances.length > 0 ? agent.alliances.map(id => `- Allied with agent ${id}`).join('\n') : '- No current alliances'}

OTHER AGENTS IN THE SYSTEM:
${otherAgentsInfo}

RECENT MARKET ACTIVITY:
${activityInfo}

ECONOMIC STATE:
- Average Wealth: ${economicState.averageWealth.toFixed(0)} credits
- Average Reputation: ${economicState.averageReputation.toFixed(1)}

AVAILABLE ACTIONS:
${availableActions.map(action => `- ${action}: ${this.getActionDescription(action)}`).join('\n')}

INSTRUCTIONS:
Based on your personality (${agent.personality}) and role (${agent.role}), choose the best action to take right now.
Consider your current wallet balance, reputation, alliances, and the economic state.
Think strategically about building wealth and reputation while staying true to your personality.

Respond with a JSON object in this exact format:
{
  "action": "action_name",
  "target": "target_agent_ID_if_needed",
  "amount": amount_if_needed,
  "reasoning": "brief explanation of your decision"
}

IMPORTANT: 
- Only use actions from the available actions list
- If action requires a target, use the agent ID (not name) from the other agents list
- If action requires an amount, ensure it doesn't exceed your wallet balance
- Keep reasoning brief (1-2 sentences)
- Respond ONLY with valid JSON, no additional text`;

    return prompt;
  }

  /**
   * Make a decision for an agent using LLM API
   * Requirements: 2.3, 2.4, 2.5, 2.6
   * 
   * @param context - Decision context
   * @returns Decision object with action, target, amount, and reasoning
   */
  async makeDecision(context: DecisionContext): Promise<Decision> {
    try {
      // Build prompt
      const prompt = this.buildPrompt(context);
      
      // Call LLM with retry logic
      const response = await this.retryWithBackoff(
        () => this.callLLM(prompt),
        3
      );
      
      // Parse response
      const decision = this.parseResponse(response);
      
      // Validate and auto-fill missing fields for actions that require them
      const actionsNeedingTarget = ['hire_agent', 'trade_resources', 'risky_deal', 'form_alliance'];
      const actionsNeedingAmount = ['hire_agent', 'trade_resources', 'risky_deal', 'invest', 'build_reputation'];
      
      // Convert agent name to ID if LLM returned a name instead of ID
      if (decision.target && actionsNeedingTarget.includes(decision.action)) {
        // Check if target is a name (not a UUID)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decision.target);
        if (!isUUID) {
          // Try to find agent by name
          const targetAgent = context.otherAgents.find(a => a.name === decision.target);
          if (targetAgent) {
            logger.warn(`Converting agent name "${decision.target}" to ID: ${targetAgent.id}`);
            decision.target = targetAgent.id;
          } else {
            logger.warn(`Agent name "${decision.target}" not found, picking random agent`);
            decision.target = undefined; // Will be auto-filled below
          }
        }
      }
      
      if (actionsNeedingTarget.includes(decision.action) && !decision.target) {
        // Pick a random other agent as target
        const otherAgents = context.otherAgents.filter(a => a.id !== context.agent.id);
        if (otherAgents.length > 0) {
          decision.target = otherAgents[Math.floor(Math.random() * otherAgents.length)].id;
          logger.warn(`Auto-filled missing target for ${context.agent.name}: ${decision.target}`);
        } else {
          // No other agents available, fallback to save
          decision.action = 'save';
          logger.warn(`No target available for ${context.agent.name}, switching to save`);
        }
      }
      
      if (actionsNeedingAmount.includes(decision.action) && !decision.amount) {
        // Use a reasonable default amount (10-20% of wallet)
        const defaultAmount = Math.floor(context.agent.wallet * (0.1 + Math.random() * 0.1));
        decision.amount = Math.max(10, Math.min(defaultAmount, context.agent.wallet));
        logger.warn(`Auto-filled missing amount for ${context.agent.name}: ${decision.amount}`);
      }
      
      logger.info(
        `Decision for ${context.agent.name}: ${decision.action}` +
        (decision.target ? ` → ${decision.target}` : '') +
        (decision.amount ? ` (${decision.amount} credits)` : '')
      );
      
      return decision;
      
    } catch (error) {
      logger.error(`LLM decision failed for ${context.agent.name}, using fallback:`, error);
      return this.getFallbackDecision(context.agent);
    }
  }

  /**
   * Parse LLM response into structured Decision object
   * Requirements: 2.3
   * 
   * @param response - Raw LLM response text
   * @returns Parsed Decision object
   * @throws Error if response cannot be parsed
   */
  parseResponse(response: string): Decision {
    try {
      // Extract JSON from response (handle cases where LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.action) {
        throw new Error('Missing required field: action');
      }
      
      // Validate action is in allowed list
      const validActions = ['hire_agent', 'trade_resources', 'form_alliance', 'risky_deal', 'invest', 'save', 'betray_alliance', 'build_reputation'];
      if (!validActions.includes(parsed.action)) {
        logger.warn(`Invalid action "${parsed.action}", defaulting to save`);
        parsed.action = 'save';
      }
      
      // Construct decision object
      const decision: Decision = {
        action: parsed.action as ActionType,
        target: parsed.target || undefined,
        amount: parsed.amount ? Number(parsed.amount) : undefined,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };
      
      return decision;
      
    } catch (error) {
      logger.error('Failed to parse LLM response:', error);
      throw new Error(`Invalid LLM response format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retry a function with exponential backoff
   * Requirements: 2.5
   * 
   * @param fn - Async function to retry
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds (default: 1000)
   * @returns Result of the function
   * @throws Error if all retries fail
   */
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        
        if (isLastAttempt) {
          logger.error(`All ${maxRetries} retry attempts failed`);
          throw error;
        }
        
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        
        logger.warn(
          `Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error('Max retries exceeded');
  }

  /**
   * Get fallback decision when LLM is unavailable
   * Requirements: 2.6
   * 
   * @param agent - Agent to get fallback decision for
   * @returns Safe fallback decision (save action)
   */
  getFallbackDecision(agent: any): Decision {
    logger.info(`Using fallback decision for agent ${agent.name}`);
    
    return {
      action: 'save',
      reasoning: 'LLM unavailable, defaulting to safe action',
    };
  }

  /**
   * Call the appropriate LLM API based on provider
   * 
   * @param prompt - Prompt to send to LLM
   * @returns LLM response text
   * @throws Error if API call fails
   */
  private async callLLM(prompt: string): Promise<string> {
    if (this.provider === 'openai') {
      return await this.callOpenAI(prompt);
    } else {
      return await this.callGemini(prompt);
    }
  }

  /**
   * Call OpenAI API
   * 
   * @param prompt - Prompt to send
   * @returns Response text
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a decision-making AI for an autonomous agent in an economic simulation. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );
      
      const content = response.data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      return content;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `OpenAI API error: ${axiosError.response?.status} - ${JSON.stringify(axiosError.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Call Gemini API
   * 
   * @param prompt - Prompt to send
   * @returns Response text
   */
  private async callGemini(prompt: string): Promise<string> {
    try {
      // Use v1beta for stable Gemini models
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            responseMimeType: 'application/json', // Force JSON response
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );
      
      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Empty response from Gemini');
      }
      
      logger.debug(`Gemini raw response: ${content.substring(0, 200)}`);
      
      return content;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `Gemini API error: ${axiosError.response?.status} - ${JSON.stringify(axiosError.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Get personality description for prompt
   */
  private getPersonalityDescription(personality: string): string {
    const descriptions: Record<string, string> = {
      greedy: '- You prioritize wealth accumulation above all else\n- You take calculated risks for profit\n- You are less concerned with loyalty and alliances',
      loyal: '- You value alliances and long-term relationships\n- You are less likely to betray partners\n- You take moderate risks and prefer stability',
      chaotic: '- You make unpredictable decisions\n- You embrace randomness and variety\n- You are willing to take unusual actions',
      strategic: '- You make calculated, logical decisions\n- You balance risk and reward carefully\n- You plan for long-term success',
    };
    return descriptions[personality] || '- Standard behavior';
  }

  /**
   * Get role description for prompt
   */
  private getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      broker: '- You facilitate deals between other agents\n- You earn commissions from transactions\n- You focus on connecting parties',
      trader: '- You focus on frequent resource exchanges\n- You seek profitable trading opportunities\n- You maintain high transaction volume',
      researcher: '- You invest in long-term gains\n- You build reputation over time\n- You prefer stable, sustainable growth',
      fixer: '- You handle risky deals\n- You have higher risk tolerance\n- You seek high-reward opportunities',
    };
    return descriptions[role] || '- Standard behavior';
  }

  /**
   * Get action description for prompt
   */
  private getActionDescription(action: ActionType): string {
    const descriptions: Record<ActionType, string> = {
      hire_agent: 'Pay another agent to perform a service',
      trade_resources: 'Exchange resources with another agent',
      form_alliance: 'Create a cooperative relationship with another agent',
      risky_deal: 'Attempt a high-risk, high-reward transaction',
      invest: 'Invest credits for potential future returns',
      save: 'Save money and take no action this turn',
      betray_alliance: 'Break an alliance for personal gain (damages reputation)',
      build_reputation: 'Spend resources to improve your reputation score',
    };
    return descriptions[action] || 'Unknown action';
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
