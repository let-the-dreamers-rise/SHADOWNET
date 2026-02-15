/**
 * EconomyEngine Service
 * Manages transactions, wallets, reputation updates, and economic rules
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, Transaction, ActionType, ValidationResult } from '../models/types.js';
import { AgentManager } from './AgentManager.js';
import { logger } from '../utils/logger.js';

/**
 * Action modifiers for success probability calculation
 * Different actions have different risk levels
 */
const ACTION_MODIFIERS: Record<ActionType, number> = {
  'risky_deal': -0.3,
  'trade_resources': 0.1,
  'hire_agent': 0.0,
  'form_alliance': 0.05,
  'invest': -0.1,
  'save': 0.0,
  'betray_alliance': -0.2,
  'build_reputation': 0.0,
};

/**
 * Reputation change ranges for different outcomes
 */
const REPUTATION_CHANGES = {
  successfulTransaction: { min: 1, max: 5 },
  failedTransaction: { min: -10, max: -2 },
  betrayal: { min: -25, max: -15 },
  buildReputation: { min: 3, max: 8 },
};

/**
 * EconomyEngine class handles all economic operations
 * Manages transactions, wallet updates, and reputation changes
 */
export class EconomyEngine {
  private agentManager: AgentManager;
  private transactionLog: Transaction[];

  constructor(agentManager: AgentManager) {
    this.agentManager = agentManager;
    this.transactionLog = [];
  }

  /**
   * Validate a transaction before processing
   * Requirements: 3.1, 3.2
   * 
   * @param from - Sender agent
   * @param to - Receiver agent
   * @param amount - Amount to transfer
   * @returns Validation result with errors if any
   */
  validateTransaction(from: Agent, to: Agent, amount: number): ValidationResult {
    const errors: string[] = [];

    // Check sufficient balance
    if (from.wallet < amount) {
      errors.push('Insufficient funds');
    }

    // Check positive amount
    if (amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Check not sending to self
    if (from.id === to.id) {
      errors.push('Cannot transact with self');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate success probability based on agent reputations and action type
   * Requirements: 3.4, 4.7
   * 
   * Formula: baseProbability + reputationBonus + actionModifier
   * - baseProbability: 0.7
   * - reputationBonus: (fromRep + toRep) / 200 * 0.2
   * - actionModifier: varies by action type
   * - Result clamped to [0.1, 0.95]
   * 
   * @param fromAgent - Sender agent
   * @param toAgent - Receiver agent
   * @param actionType - Type of action being performed
   * @returns Success probability between 0.1 and 0.95
   */
  calculateSuccessProbability(
    fromAgent: Agent,
    toAgent: Agent,
    actionType: ActionType
  ): number {
    const baseProbability = 0.7;
    
    // Reputation bonus: higher combined reputation increases success chance
    const reputationBonus = ((fromAgent.reputation + toAgent.reputation) / 200) * 0.2;
    
    // Action-specific modifier
    const actionModifier = ACTION_MODIFIERS[actionType] || 0;
    
    // Calculate final probability
    const probability = baseProbability + reputationBonus + actionModifier;
    
    // Clamp to [0.1, 0.95]
    return Math.max(0.1, Math.min(0.95, probability));
  }

  /**
   * Transfer credits atomically between agents
   * Requirements: 3.3
   * 
   * @param fromId - Sender agent ID
   * @param toId - Receiver agent ID
   * @param amount - Amount to transfer
   */
  private transferCredits(fromId: string, toId: string, amount: number): void {
    const fromAgent = this.agentManager.getAgent(fromId);
    const toAgent = this.agentManager.getAgent(toId);

    if (!fromAgent || !toAgent) {
      throw new Error('Agent not found during transfer');
    }

    // Atomic update: deduct from sender, add to receiver
    this.agentManager.updateAgent(fromId, {
      wallet: fromAgent.wallet - amount,
    });

    this.agentManager.updateAgent(toId, {
      wallet: toAgent.wallet + amount,
    });

    logger.debug(`Transferred ${amount} credits from ${fromAgent.name} to ${toAgent.name}`);
  }

  /**
   * Update agent reputations based on transaction outcome
   * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
   * 
   * @param transaction - The transaction that occurred
   * @param fromAgent - Sender agent
   * @param toAgent - Receiver agent
   */
  private updateReputations(
    transaction: Transaction,
    fromAgent: Agent,
    toAgent: Agent
  ): void {
    let fromChange = 0;
    let toChange = 0;

    if (transaction.success) {
      // Successful transaction: both parties gain reputation
      const { min, max } = REPUTATION_CHANGES.successfulTransaction;
      fromChange = this.randomInt(min, max);
      toChange = this.randomInt(min, max);
    } else {
      // Failed transaction: initiator loses reputation
      const { min, max } = REPUTATION_CHANGES.failedTransaction;
      fromChange = this.randomInt(min, max);
      toChange = 0; // Receiver's reputation unchanged
    }

    // Special case: betrayal action
    if (transaction.actionType === 'betray_alliance') {
      const { min, max } = REPUTATION_CHANGES.betrayal;
      fromChange = this.randomInt(min, max);
    }

    // Special case: build reputation action
    if (transaction.actionType === 'build_reputation' && transaction.success) {
      const { min, max } = REPUTATION_CHANGES.buildReputation;
      fromChange = this.randomInt(min, max);
    }

    // Apply reputation changes with clamping to [0, 100]
    const newFromReputation = this.clampReputation(fromAgent.reputation + fromChange);
    const newToReputation = this.clampReputation(toAgent.reputation + toChange);

    this.agentManager.updateAgent(fromAgent.id, {
      reputation: newFromReputation,
    });

    this.agentManager.updateAgent(toAgent.id, {
      reputation: newToReputation,
    });

    logger.debug(
      `Reputation changes: ${fromAgent.name} ${fromChange > 0 ? '+' : ''}${fromChange}, ` +
      `${toAgent.name} ${toChange > 0 ? '+' : ''}${toChange}`
    );
  }

  /**
   * Process a transaction with probabilistic success/failure
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
   * 
   * @param fromId - Sender agent ID
   * @param toId - Receiver agent ID
   * @param amount - Amount to transfer
   * @param actionType - Type of action triggering the transaction
   * @returns Completed transaction record
   */
  async processTransaction(
    fromId: string,
    toId: string,
    amount: number,
    actionType: ActionType
  ): Promise<Transaction> {
    const fromAgent = this.agentManager.getAgent(fromId);
    const toAgent = this.agentManager.getAgent(toId);

    if (!fromAgent || !toAgent) {
      throw new Error('Agent not found');
    }

    // Validate transaction
    const validation = this.validateTransaction(fromAgent, toAgent, amount);
    
    if (!validation.valid) {
      logger.warn(`Transaction validation failed: ${validation.errors.join(', ')}`);
      
      // Create failed transaction record
      const failedTransaction: Transaction = {
        id: uuidv4(),
        from: fromId,
        to: toId,
        amount,
        actionType,
        timestamp: Date.now(),
        success: false,
        probability: 0,
      };
      
      this.transactionLog.push(failedTransaction);
      return failedTransaction;
    }

    // Calculate success probability
    const probability = this.calculateSuccessProbability(fromAgent, toAgent, actionType);
    
    // Determine success based on probability
    const success = Math.random() < probability;

    // Create transaction record
    const transaction: Transaction = {
      id: uuidv4(),
      from: fromId,
      to: toId,
      amount,
      actionType,
      timestamp: Date.now(),
      success,
      probability,
    };

    if (success) {
      // Execute transfer
      this.transferCredits(fromId, toId, amount);
      
      // Update agent stats
      this.agentManager.updateAgent(fromId, {
        stats: {
          ...fromAgent.stats,
          transactionCount: fromAgent.stats.transactionCount + 1,
          successfulDeals: fromAgent.stats.successfulDeals + 1,
        },
      });
      
      logger.info(
        `Transaction successful: ${fromAgent.name} → ${toAgent.name}, ` +
        `${amount} credits (${(probability * 100).toFixed(1)}% chance)`
      );
    } else {
      // Transaction failed probabilistically - no wallet changes
      this.agentManager.updateAgent(fromId, {
        stats: {
          ...fromAgent.stats,
          transactionCount: fromAgent.stats.transactionCount + 1,
          failedDeals: fromAgent.stats.failedDeals + 1,
        },
      });
      
      logger.info(
        `Transaction failed: ${fromAgent.name} → ${toAgent.name}, ` +
        `${amount} credits (${(probability * 100).toFixed(1)}% chance)`
      );
    }

    // Update reputations based on outcome
    // Need to get fresh agent data after stats update
    const updatedFromAgent = this.agentManager.getAgent(fromId)!;
    const updatedToAgent = this.agentManager.getAgent(toId)!;
    this.updateReputations(transaction, updatedFromAgent, updatedToAgent);

    // Record transaction in log
    this.transactionLog.push(transaction);

    return transaction;
  }

  /**
   * Get recent transactions
   * Requirements: 3.7
   * 
   * @param limit - Maximum number of transactions to return
   * @returns Array of recent transactions in reverse chronological order
   */
  getRecentTransactions(limit: number): Transaction[] {
    // Return most recent transactions first
    return this.transactionLog
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all transactions (for testing and ledger integration)
   * 
   * @returns All transactions
   */
  getAllTransactions(): Transaction[] {
    return [...this.transactionLog];
  }

  /**
   * Clamp reputation to valid range [0, 100]
   * Requirements: 4.6
   * 
   * @param reputation - Reputation value to clamp
   * @returns Clamped reputation value
   */
  private clampReputation(reputation: number): number {
    return Math.max(0, Math.min(100, reputation));
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
}
