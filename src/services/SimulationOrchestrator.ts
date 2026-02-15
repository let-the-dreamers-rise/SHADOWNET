/**
 * SimulationOrchestrator Service
 * Coordinates the entire simulation by orchestrating decision cycles,
 * action execution, and block finalization
 * Requirements: 2.1, 2.4, 3.3, 5.1, 5.3, 6.2
 */

import { AgentManager } from './AgentManager.js';
import { DecisionEngine } from './DecisionEngine.js';
import { EconomyEngine } from './EconomyEngine.js';
import { AllianceManager } from './AllianceManager.js';
import { Ledger } from './Ledger.js';
import { ShadowMemory } from './ShadowMemory.js';
import { Agent, Decision, DecisionContext, ActionType } from '../models/types.js';
import { logger } from '../utils/logger.js';

/**
 * Configuration for SimulationOrchestrator
 */
export interface SimulationConfig {
  minCycleDelay: number; // Minimum delay between cycles (ms)
  maxCycleDelay: number; // Maximum delay between cycles (ms)
  blockInterval: number; // Block finalization interval (ms)
}

/**
 * SimulationOrchestrator coordinates all simulation activities
 * 
 * Responsibilities:
 * - Execute decision cycles for all agents
 * - Dispatch actions to appropriate services
 * - Schedule next cycle with random delay
 * - Finalize blocks at regular intervals
 * 
 * Requirements: 2.1, 2.4, 3.3, 5.1, 5.3, 6.2
 */
export class SimulationOrchestrator {
  private agentManager: AgentManager;
  private decisionEngine: DecisionEngine;
  private economyEngine: EconomyEngine;
  private allianceManager: AllianceManager;
  private ledger: Ledger;
  private shadowMemory: ShadowMemory;
  private config: SimulationConfig;
  private isRunning: boolean;
  private cycleTimer: NodeJS.Timeout | null;
  private blockTimer: NodeJS.Timeout | null;

  constructor(
    agentManager: AgentManager,
    decisionEngine: DecisionEngine,
    economyEngine: EconomyEngine,
    allianceManager: AllianceManager,
    ledger: Ledger,
    shadowMemory: ShadowMemory,
    config: SimulationConfig
  ) {
    this.agentManager = agentManager;
    this.decisionEngine = decisionEngine;
    this.economyEngine = economyEngine;
    this.allianceManager = allianceManager;
    this.ledger = ledger;
    this.shadowMemory = shadowMemory;
    this.config = config;
    this.isRunning = false;
    this.cycleTimer = null;
    this.blockTimer = null;
  }

  /**
   * Start the simulation
   * Begins decision cycles and block finalization
   * Requirements: 2.1, 6.2
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Simulation is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting SHADOWNET simulation');

    // Start decision cycles
    this.scheduleNextCycle();

    // Start block finalization timer
    this.blockTimer = setInterval(() => {
      this.finalizeBlock();
    }, this.config.blockInterval);

    logger.info(
      `Simulation started with cycle delay ${this.config.minCycleDelay}-${this.config.maxCycleDelay}ms, ` +
      `block interval ${this.config.blockInterval}ms`
    );
  }

  /**
   * Stop the simulation
   * Cancels all timers and halts execution
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Simulation is not running');
      return;
    }

    this.isRunning = false;

    // Clear timers
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }

    if (this.blockTimer) {
      clearInterval(this.blockTimer);
      this.blockTimer = null;
    }

    logger.info('Simulation stopped');
  }

  /**
   * Execute one decision cycle for all agents
   * Requirements: 2.1, 2.4
   * 
   * Process:
   * 1. For each agent, gather decision context
   * 2. Call DecisionEngine to get LLM decision
   * 3. Validate decision
   * 4. Execute action through appropriate service
   * 5. Log action to agent's memory
   */
  private async executeCycle(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('=== Starting decision cycle ===');

    const agents = this.agentManager.getAllAgents();
    const allAgents = agents;

    // Process each agent sequentially to avoid race conditions
    for (const agent of agents) {
      try {
        // Build decision context
        const context = this.buildDecisionContext(agent, allAgents);

        // Get decision from LLM
        const decision = await this.decisionEngine.makeDecision(context);

        // Execute the agent's action
        await this.executeAgentAction(agent, decision);

      } catch (error) {
        logger.error(`Error processing agent ${agent.name}:`, error);
        // Continue with next agent even if one fails
      }
    }

    logger.info('=== Decision cycle complete ===');

    // Schedule next cycle
    this.scheduleNextCycle();
  }

  /**
   * Execute a specific action for an agent
   * Dispatches to appropriate service based on action type
   * Requirements: 2.4, 3.3, 5.1, 5.3
   * 
   * @param agent - Agent performing the action
   * @param decision - Decision containing action and parameters
   */
  private async executeAgentAction(agent: Agent, decision: Decision): Promise<void> {
    const { action, target, amount } = decision;

    logger.info(`${agent.name} executing action: ${action}`);

    let outcome: 'success' | 'failure' = 'success';
    const details: Record<string, any> = {
      action,
      reasoning: decision.reasoning,
    };

    try {
      switch (action) {
        case 'hire_agent':
        case 'trade_resources':
        case 'risky_deal':
        case 'invest':
          // Actions that involve transactions
          if (!target || !amount) {
            logger.warn(`${agent.name}: ${action} requires target and amount`);
            outcome = 'failure';
            details.error = 'Missing target or amount';
            break;
          }

          const targetAgent = this.agentManager.getAgent(target);
          if (!targetAgent) {
            logger.warn(`${agent.name}: Target agent ${target} not found`);
            outcome = 'failure';
            details.error = 'Target agent not found';
            break;
          }

          // 🌑 SHADOW CHECK: Blacklist enforcement
          if (this.shadowMemory.isBlacklisted(agent.id, target)) {
            logger.info(`🚫 ${agent.name} REFUSES to deal with blacklisted ${targetAgent.name}`);
            outcome = 'failure';
            details.error = 'Target is blacklisted';
            details.shadow = 'blacklist_enforced';
            break;
          }

          // 🌑 SHADOW CHECK: Revenge opportunity
          const hasGrudge = this.shadowMemory.hasGrudge(agent.id, target);
          if (hasGrudge && Math.random() < 0.3) {
            // 30% chance to attempt revenge instead of normal transaction
            logger.info(`⚔️ ${agent.name} attempts REVENGE on ${targetAgent.name}!`);
            
            const revengeTransaction = await this.economyEngine.processTransaction(
              agent.id,
              target,
              Math.min(amount * 2, agent.wallet), // Double the stakes for revenge
              action
            );

            this.ledger.addTransaction(revengeTransaction);
            this.shadowMemory.recordRevenge(
              agent.id,
              target,
              agent.name,
              targetAgent.name,
              revengeTransaction.success
            );

            outcome = revengeTransaction.success ? 'success' : 'failure';
            details.target = targetAgent.name;
            details.amount = revengeTransaction.amount;
            details.transactionId = revengeTransaction.id;
            details.shadow = 'revenge_attempt';
            break;
          }

          // Process normal transaction
          const transaction = await this.economyEngine.processTransaction(
            agent.id,
            target,
            amount,
            action
          );

          // Add transaction to ledger
          this.ledger.addTransaction(transaction);

          // 🌑 SHADOW: Record failed deals as potential grudges
          if (!transaction.success) {
            this.shadowMemory.recordFailedDeal(
              agent.id,
              target,
              agent.name,
              targetAgent.name,
              amount
            );
          }

          outcome = transaction.success ? 'success' : 'failure';
          details.target = targetAgent.name;
          details.amount = amount;
          details.transactionId = transaction.id;
          break;

        case 'form_alliance':
          // Form alliance with target agent
          if (!target) {
            logger.warn(`${agent.name}: form_alliance requires target`);
            outcome = 'failure';
            details.error = 'Missing target';
            break;
          }

          const allyAgent = this.agentManager.getAgent(target);
          if (!allyAgent) {
            logger.warn(`${agent.name}: Target agent ${target} not found`);
            outcome = 'failure';
            details.error = 'Target agent not found';
            break;
          }

          // Check if already allied
          if (this.allianceManager.areAllied(agent.id, target)) {
            logger.info(`${agent.name} and ${allyAgent.name} are already allied`);
            outcome = 'failure';
            details.error = 'Already allied';
            break;
          }

          // Form alliance
          const alliance = this.allianceManager.formAlliance(agent.id, target);

          // Update both agents' alliance lists
          this.agentManager.updateAgent(agent.id, {
            alliances: [...agent.alliances, alliance.id],
          });
          this.agentManager.updateAgent(target, {
            alliances: [...allyAgent.alliances, alliance.id],
          });

          outcome = 'success';
          details.target = allyAgent.name;
          details.allianceId = alliance.id;
          break;

        case 'betray_alliance':
          // Betray an alliance
          if (agent.alliances.length === 0) {
            logger.warn(`${agent.name}: No alliances to betray`);
            outcome = 'failure';
            details.error = 'No alliances';
            break;
          }

          // Pick first active alliance to betray
          const allianceToBreak = agent.alliances[0];
          const allianceData = this.allianceManager.getAgentAlliances(agent.id)
            .find(a => a.id === allianceToBreak);
          
          // Find the betrayed partner
          const betrayedPartnerId = allianceData?.members.find(id => id !== agent.id);
          const betrayedPartner = betrayedPartnerId ? this.agentManager.getAgent(betrayedPartnerId) : undefined;

          this.allianceManager.breakAlliance(allianceToBreak, agent.id);

          // Remove alliance from agent's list
          this.agentManager.updateAgent(agent.id, {
            alliances: agent.alliances.filter(id => id !== allianceToBreak),
            stats: {
              ...agent.stats,
              betrayals: agent.stats.betrayals + 1,
            },
          });

          // 🌑 SHADOW: Record betrayal and create grudge
          if (betrayedPartner) {
            this.shadowMemory.recordBetrayal(
              agent.id,
              betrayedPartner.id,
              agent.name,
              betrayedPartner.name
            );
            
            // Remove alliance from betrayed partner too
            this.agentManager.updateAgent(betrayedPartner.id, {
              alliances: betrayedPartner.alliances.filter(id => id !== allianceToBreak),
            });
          }

          // Apply reputation penalty through a fake transaction
          // This ensures reputation update logic is centralized
          const betrayalTransaction = await this.economyEngine.processTransaction(
            agent.id,
            agent.id, // Self-transaction (will fail validation but still update reputation)
            0,
            'betray_alliance'
          );

          this.ledger.addTransaction(betrayalTransaction);

          outcome = 'success';
          details.allianceId = allianceToBreak;
          details.shadow = 'betrayal_recorded';
          if (betrayedPartner) {
            details.victim = betrayedPartner.name;
          }
          break;

        case 'build_reputation':
          // Build reputation by spending credits
          const reputationCost = 50; // Fixed cost to build reputation

          if (agent.wallet < reputationCost) {
            logger.warn(`${agent.name}: Insufficient funds to build reputation`);
            outcome = 'failure';
            details.error = 'Insufficient funds';
            break;
          }

          // Create a self-transaction to handle reputation update
          const repTransaction = await this.economyEngine.processTransaction(
            agent.id,
            agent.id, // Self-transaction
            reputationCost,
            'build_reputation'
          );

          this.ledger.addTransaction(repTransaction);

          outcome = repTransaction.success ? 'success' : 'failure';
          details.cost = reputationCost;
          break;

        case 'save':
          // Safe action - do nothing
          outcome = 'success';
          details.message = 'Saved money, no action taken';
          break;

        default:
          logger.warn(`${agent.name}: Unknown action ${action}`);
          outcome = 'failure';
          details.error = 'Unknown action';
      }

    } catch (error) {
      logger.error(`Error executing action ${action} for ${agent.name}:`, error);
      outcome = 'failure';
      details.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Log action to agent's memory
    this.agentManager.logAction(agent.id, {
      timestamp: Date.now(),
      action,
      details,
      outcome,
    });

    logger.info(`${agent.name} action ${action}: ${outcome}`);
  }

  /**
   * Schedule next decision cycle with random delay
   * Requirements: 2.1
   * 
   * Delay is randomized between minCycleDelay and maxCycleDelay
   * to create more natural, unpredictable simulation behavior
   */
  private scheduleNextCycle(): void {
    if (!this.isRunning) {
      return;
    }

    // Calculate random delay between min and max
    const delay = this.randomInt(this.config.minCycleDelay, this.config.maxCycleDelay);

    this.cycleTimer = setTimeout(() => {
      this.executeCycle();
    }, delay);

    logger.debug(`Next cycle scheduled in ${delay}ms`);
  }

  /**
   * Finalize current block in the ledger
   * Requirements: 6.2
   * 
   * Called every blockInterval (30 seconds by default)
   */
  private finalizeBlock(): void {
    const block = this.ledger.finalizeBlock();
    logger.info(
      `Block ${block.blockNumber} finalized with ${block.transactionCount} transactions`
    );
    
    // 🌑 SHADOW: Decay grudges over time
    this.shadowMemory.decayGrudges();
  }

  /**
   * Build decision context for an agent
   * Requirements: 2.2
   * 
   * @param agent - Agent to build context for
   * @param allAgents - All agents in the system
   * @returns Decision context with agent state and environment info
   */
  private buildDecisionContext(agent: Agent, allAgents: Agent[]): DecisionContext {
    // Get sample of other agents (exclude self)
    const otherAgents = allAgents
      .filter(a => a.id !== agent.id)
      .slice(0, 5); // Limit to 5 agents to keep context manageable

    // Get recent transactions
    const recentActivity = this.economyEngine.getRecentTransactions(10);

    // Calculate economic state
    const totalWealth = allAgents.reduce((sum, a) => sum + a.wallet, 0);
    const totalReputation = allAgents.reduce((sum, a) => sum + a.reputation, 0);
    const averageWealth = totalWealth / allAgents.length;
    const averageReputation = totalReputation / allAgents.length;

    // All actions are available
    const availableActions: ActionType[] = [
      'hire_agent',
      'trade_resources',
      'form_alliance',
      'risky_deal',
      'invest',
      'save',
      'betray_alliance',
      'build_reputation',
    ];

    return {
      agent,
      otherAgents,
      recentActivity,
      availableActions,
      economicState: {
        averageWealth,
        averageReputation,
      },
    };
  }

  /**
   * Generate random integer in range [min, max] inclusive
   * 
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get simulation running status
   * 
   * @returns true if simulation is running, false otherwise
   */
  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get shadow memory instance for API access
   */
  getShadowMemory(): ShadowMemory {
    return this.shadowMemory;
  }
}
