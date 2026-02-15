/**
 * AgentManager Service
 * Manages agent state, lifecycle, and leaderboard rankings
 * Requirements: 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.5
 */

import { Agent, ActionLog } from '../models/types.js';
import { generateAgents } from '../utils/agentGenerator.js';
import { logger } from '../utils/logger.js';

/**
 * Leaderboard criteria for ranking agents
 */
export type LeaderboardCriteria = 'wallet' | 'reputation' | 'activity';

/**
 * AgentManager class handles all agent-related operations
 * Uses Map-based storage for efficient lookups and updates
 */
export class AgentManager {
  private agents: Map<string, Agent>;

  constructor() {
    this.agents = new Map();
  }

  /**
   * Initialize agents with diverse personalities and roles
   * Requirements: 1.1, 1.2, 10.5
   * 
   * @param count - Number of agents to create (12-20 recommended)
   * @param initialBalance - Starting wallet balance for each agent
   */
  initializeAgents(count: number, initialBalance: number): void {
    logger.info(`Initializing ${count} agents with initial balance ${initialBalance}`);
    
    const generatedAgents = generateAgents(count, initialBalance);
    
    // Store agents in Map for efficient access
    for (const agent of generatedAgents) {
      this.agents.set(agent.id, agent);
    }
    
    logger.info(`Successfully initialized ${this.agents.size} agents`);
  }

  /**
   * Get agent by ID
   * Requirements: 1.3
   * 
   * @param id - Agent ID to retrieve
   * @returns Agent if found, undefined otherwise
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   * Requirements: 1.3
   * 
   * @returns Array of all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Update agent state
   * Requirements: 1.3
   * 
   * @param id - Agent ID to update
   * @param updates - Partial agent data to merge
   */
  updateAgent(id: string, updates: Partial<Agent>): void {
    const agent = this.agents.get(id);
    
    if (!agent) {
      logger.warn(`Attempted to update non-existent agent: ${id}`);
      return;
    }

    // Merge updates into existing agent
    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    
    logger.debug(`Updated agent ${agent.name} (${id})`);
  }

  /**
   * Add action to agent's memory log
   * Requirements: 1.4
   * 
   * @param agentId - Agent ID to log action for
   * @param action - Action log entry to append
   */
  logAction(agentId: string, action: ActionLog): void {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      logger.warn(`Attempted to log action for non-existent agent: ${agentId}`);
      return;
    }

    // Append action to memory
    agent.memory.push(action);
    
    logger.debug(`Logged action ${action.action} for agent ${agent.name}`);
  }

  /**
   * Get agents sorted by specified criteria
   * Requirements: 7.1, 7.2, 7.3, 7.5
   * 
   * @param criteria - Sorting criteria (wallet, reputation, or activity)
   * @param limit - Maximum number of agents to return
   * @returns Array of top agents sorted by criteria in descending order
   */
  getLeaderboard(criteria: LeaderboardCriteria, limit: number): Agent[] {
    // Handle edge case: negative or zero limit
    if (limit <= 0) {
      return [];
    }

    const allAgents = this.getAllAgents();
    
    // Sort based on criteria
    const sorted = allAgents.sort((a, b) => {
      switch (criteria) {
        case 'wallet':
          // Sort by wallet balance (richest first)
          return b.wallet - a.wallet;
        
        case 'reputation':
          // Sort by reputation score (most trusted first)
          return b.reputation - a.reputation;
        
        case 'activity':
          // Sort by transaction count (most active first)
          return b.stats.transactionCount - a.stats.transactionCount;
        
        default:
          return 0;
      }
    });
    
    // Return top N agents
    return sorted.slice(0, limit);
  }
}
