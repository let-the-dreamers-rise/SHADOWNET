/**
 * EconomyEngine Unit Tests
 * Tests transaction processing, validation, reputation updates, and economic rules
 */

import { EconomyEngine } from './EconomyEngine.js';
import { AgentManager } from './AgentManager.js';
import { Agent, ActionType } from '../models/types.js';

describe('EconomyEngine', () => {
  let agentManager: AgentManager;
  let economyEngine: EconomyEngine;

  beforeEach(() => {
    agentManager = new AgentManager();
    agentManager.initializeAgents(5, 1000);
    economyEngine = new EconomyEngine(agentManager);
  });

  describe('validateTransaction', () => {
    it('should validate a valid transaction', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const result = economyEngine.validateTransaction(from, to, 100);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject transaction with insufficient funds', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const result = economyEngine.validateTransaction(from, to, from.wallet + 100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Insufficient funds');
    });

    it('should reject transaction with zero amount', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const result = economyEngine.validateTransaction(from, to, 0);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount must be positive');
    });

    it('should reject transaction with negative amount', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const result = economyEngine.validateTransaction(from, to, -50);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Amount must be positive');
    });

    it('should reject transaction from agent to itself', () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      const result = economyEngine.validateTransaction(agent, agent, 100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot transact with self');
    });

    it('should return multiple errors for multiple violations', () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      const result = economyEngine.validateTransaction(agent, agent, -100);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('calculateSuccessProbability', () => {
    it('should return probability between 0.1 and 0.95', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const probability = economyEngine.calculateSuccessProbability(
        from,
        to,
        'trade_resources'
      );

      expect(probability).toBeGreaterThanOrEqual(0.1);
      expect(probability).toBeLessThanOrEqual(0.95);
    });

    it('should increase probability with higher reputation', () => {
      const agents = agentManager.getAllAgents();
      const lowRepFrom = agents[0];
      const lowRepTo = agents[1];
      
      // Set low reputation
      agentManager.updateAgent(lowRepFrom.id, { reputation: 10 });
      agentManager.updateAgent(lowRepTo.id, { reputation: 10 });
      
      const lowRepFromUpdated = agentManager.getAgent(lowRepFrom.id)!;
      const lowRepToUpdated = agentManager.getAgent(lowRepTo.id)!;

      const lowProbability = economyEngine.calculateSuccessProbability(
        lowRepFromUpdated,
        lowRepToUpdated,
        'trade_resources'
      );

      // Set high reputation
      const highRepFrom = agents[2];
      const highRepTo = agents[3];
      agentManager.updateAgent(highRepFrom.id, { reputation: 90 });
      agentManager.updateAgent(highRepTo.id, { reputation: 90 });
      
      const highRepFromUpdated = agentManager.getAgent(highRepFrom.id)!;
      const highRepToUpdated = agentManager.getAgent(highRepTo.id)!;

      const highProbability = economyEngine.calculateSuccessProbability(
        highRepFromUpdated,
        highRepToUpdated,
        'trade_resources'
      );

      expect(highProbability).toBeGreaterThan(lowProbability);
    });

    it('should apply action modifiers correctly', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const riskyProb = economyEngine.calculateSuccessProbability(
        from,
        to,
        'risky_deal'
      );

      const tradeProb = economyEngine.calculateSuccessProbability(
        from,
        to,
        'trade_resources'
      );

      // risky_deal has -0.3 modifier, trade_resources has +0.1 modifier
      expect(tradeProb).toBeGreaterThan(riskyProb);
    });

    it('should clamp probability to minimum 0.1', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];
      
      // Set very low reputation
      agentManager.updateAgent(from.id, { reputation: 0 });
      agentManager.updateAgent(to.id, { reputation: 0 });
      
      const fromUpdated = agentManager.getAgent(from.id)!;
      const toUpdated = agentManager.getAgent(to.id)!;

      const probability = economyEngine.calculateSuccessProbability(
        fromUpdated,
        toUpdated,
        'risky_deal' // Has -0.3 modifier
      );

      expect(probability).toBeGreaterThanOrEqual(0.1);
    });

    it('should clamp probability to maximum 0.95', () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];
      
      // Set very high reputation
      agentManager.updateAgent(from.id, { reputation: 100 });
      agentManager.updateAgent(to.id, { reputation: 100 });
      
      const fromUpdated = agentManager.getAgent(from.id)!;
      const toUpdated = agentManager.getAgent(to.id)!;

      const probability = economyEngine.calculateSuccessProbability(
        fromUpdated,
        toUpdated,
        'trade_resources' // Has +0.1 modifier
      );

      expect(probability).toBeLessThanOrEqual(0.95);
    });
  });

  describe('processTransaction', () => {
    it('should process a successful transaction and update wallets', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];
      const amount = 100;

      const initialFromWallet = from.wallet;
      const initialToWallet = to.wallet;

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Will succeed with any probability > 0.1

      const transaction = await economyEngine.processTransaction(
        from.id,
        to.id,
        amount,
        'trade_resources'
      );

      Math.random = originalRandom;

      expect(transaction.success).toBe(true);
      expect(transaction.amount).toBe(amount);
      expect(transaction.from).toBe(from.id);
      expect(transaction.to).toBe(to.id);

      // Check wallet updates
      const fromUpdated = agentManager.getAgent(from.id)!;
      const toUpdated = agentManager.getAgent(to.id)!;

      expect(fromUpdated.wallet).toBe(initialFromWallet - amount);
      expect(toUpdated.wallet).toBe(initialToWallet + amount);
    });

    it('should not update wallets on failed transaction', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];
      const amount = 100;

      const initialFromWallet = from.wallet;
      const initialToWallet = to.wallet;

      // Mock Math.random to ensure failure
      const originalRandom = Math.random;
      Math.random = () => 0.99; // Will fail with any probability < 0.99

      const transaction = await economyEngine.processTransaction(
        from.id,
        to.id,
        amount,
        'trade_resources'
      );

      Math.random = originalRandom;

      expect(transaction.success).toBe(false);

      // Check wallets unchanged
      const fromUpdated = agentManager.getAgent(from.id)!;
      const toUpdated = agentManager.getAgent(to.id)!;

      expect(fromUpdated.wallet).toBe(initialFromWallet);
      expect(toUpdated.wallet).toBe(initialToWallet);
    });

    it('should update agent stats on successful transaction', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialTransactionCount = from.stats.transactionCount;
      const initialSuccessfulDeals = from.stats.successfulDeals;

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.1;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      const fromUpdated = agentManager.getAgent(from.id)!;

      expect(fromUpdated.stats.transactionCount).toBe(initialTransactionCount + 1);
      expect(fromUpdated.stats.successfulDeals).toBe(initialSuccessfulDeals + 1);
    });

    it('should update agent stats on failed transaction', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialTransactionCount = from.stats.transactionCount;
      const initialFailedDeals = from.stats.failedDeals;

      // Mock Math.random to ensure failure
      const originalRandom = Math.random;
      Math.random = () => 0.99;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      const fromUpdated = agentManager.getAgent(from.id)!;

      expect(fromUpdated.stats.transactionCount).toBe(initialTransactionCount + 1);
      expect(fromUpdated.stats.failedDeals).toBe(initialFailedDeals + 1);
    });

    it('should update reputations on successful transaction', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialFromReputation = from.reputation;
      const initialToReputation = to.reputation;

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.1;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      const fromUpdated = agentManager.getAgent(from.id)!;
      const toUpdated = agentManager.getAgent(to.id)!;

      // Both should gain reputation (1 to 5 points)
      expect(fromUpdated.reputation).toBeGreaterThanOrEqual(initialFromReputation + 1);
      expect(fromUpdated.reputation).toBeLessThanOrEqual(initialFromReputation + 5);
      expect(toUpdated.reputation).toBeGreaterThanOrEqual(initialToReputation + 1);
      expect(toUpdated.reputation).toBeLessThanOrEqual(initialToReputation + 5);
    });

    it('should update reputation on failed transaction', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialFromReputation = from.reputation;
      const initialToReputation = to.reputation;

      // Mock Math.random to ensure failure
      const originalRandom = Math.random;
      Math.random = () => 0.99;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      const fromUpdated = agentManager.getAgent(from.id)!;
      const toUpdated = agentManager.getAgent(to.id)!;

      // Sender should lose reputation (-10 to -2 points)
      expect(fromUpdated.reputation).toBeLessThanOrEqual(initialFromReputation - 2);
      expect(fromUpdated.reputation).toBeGreaterThanOrEqual(initialFromReputation - 10);
      
      // Receiver's reputation should be unchanged
      expect(toUpdated.reputation).toBe(initialToReputation);
    });

    it('should clamp reputation to 0-100 range', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      // Set reputation near boundaries
      agentManager.updateAgent(from.id, { reputation: 2 });
      agentManager.updateAgent(to.id, { reputation: 98 });

      // Mock Math.random to ensure failure (will decrease from's reputation)
      const originalRandom = Math.random;
      Math.random = () => 0.99;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      const fromUpdated = agentManager.getAgent(from.id)!;

      // Should be clamped to 0
      expect(fromUpdated.reputation).toBeGreaterThanOrEqual(0);
      expect(fromUpdated.reputation).toBeLessThanOrEqual(100);

      // Now test upper bound
      agentManager.updateAgent(from.id, { reputation: 98 });
      Math.random = () => 0.1; // Success

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      const fromUpdated2 = agentManager.getAgent(from.id)!;

      // Should be clamped to 100
      expect(fromUpdated2.reputation).toBeGreaterThanOrEqual(0);
      expect(fromUpdated2.reputation).toBeLessThanOrEqual(100);
    });

    it('should record transaction in log', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialLogLength = economyEngine.getAllTransactions().length;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'trade_resources'
      );

      const transactions = economyEngine.getAllTransactions();

      expect(transactions.length).toBe(initialLogLength + 1);
      expect(transactions[transactions.length - 1].from).toBe(from.id);
      expect(transactions[transactions.length - 1].to).toBe(to.id);
    });

    it('should reject invalid transaction and record it', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      // Try to send more than wallet balance
      const transaction = await economyEngine.processTransaction(
        from.id,
        to.id,
        from.wallet + 1000,
        'trade_resources'
      );

      expect(transaction.success).toBe(false);
      expect(transaction.probability).toBe(0);

      // Should still be recorded
      const transactions = economyEngine.getAllTransactions();
      expect(transactions).toContainEqual(transaction);
    });

    it('should handle betrayal action with severe reputation penalty', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialFromReputation = from.reputation;

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.1;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'betray_alliance'
      );

      Math.random = originalRandom;

      const fromUpdated = agentManager.getAgent(from.id)!;

      // Should lose 15-25 reputation points
      expect(fromUpdated.reputation).toBeLessThanOrEqual(initialFromReputation - 15);
      expect(fromUpdated.reputation).toBeGreaterThanOrEqual(initialFromReputation - 25);
    });

    it('should handle build_reputation action with reputation gain', async () => {
      const agents = agentManager.getAllAgents();
      const from = agents[0];
      const to = agents[1];

      const initialFromReputation = from.reputation;

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.1;

      await economyEngine.processTransaction(
        from.id,
        to.id,
        100,
        'build_reputation'
      );

      Math.random = originalRandom;

      const fromUpdated = agentManager.getAgent(from.id)!;

      // Should gain 3-8 reputation points
      expect(fromUpdated.reputation).toBeGreaterThanOrEqual(initialFromReputation + 3);
      expect(fromUpdated.reputation).toBeLessThanOrEqual(initialFromReputation + 8);
    });
  });

  describe('credit conservation', () => {
    it('should maintain total credits across successful transactions', async () => {
      const agents = agentManager.getAllAgents();
      
      // Calculate initial total credits
      const initialTotal = agents.reduce((sum, agent) => sum + agent.wallet, 0);

      // Mock Math.random to ensure success
      const originalRandom = Math.random;
      Math.random = () => 0.1;

      // Perform multiple transactions
      await economyEngine.processTransaction(
        agents[0].id,
        agents[1].id,
        50,
        'trade_resources'
      );

      await economyEngine.processTransaction(
        agents[1].id,
        agents[2].id,
        75,
        'trade_resources'
      );

      await economyEngine.processTransaction(
        agents[2].id,
        agents[3].id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      // Calculate final total credits
      const updatedAgents = agentManager.getAllAgents();
      const finalTotal = updatedAgents.reduce((sum, agent) => sum + agent.wallet, 0);

      // Total credits should remain constant
      expect(finalTotal).toBe(initialTotal);
    });

    it('should maintain total credits across failed transactions', async () => {
      const agents = agentManager.getAllAgents();
      
      // Calculate initial total credits
      const initialTotal = agents.reduce((sum, agent) => sum + agent.wallet, 0);

      // Mock Math.random to ensure failure
      const originalRandom = Math.random;
      Math.random = () => 0.99;

      // Perform multiple transactions that will fail
      await economyEngine.processTransaction(
        agents[0].id,
        agents[1].id,
        50,
        'trade_resources'
      );

      await economyEngine.processTransaction(
        agents[1].id,
        agents[2].id,
        75,
        'trade_resources'
      );

      Math.random = originalRandom;

      // Calculate final total credits
      const updatedAgents = agentManager.getAllAgents();
      const finalTotal = updatedAgents.reduce((sum, agent) => sum + agent.wallet, 0);

      // Total credits should remain constant even with failed transactions
      expect(finalTotal).toBe(initialTotal);
    });

    it('should maintain total credits across mixed successful and failed transactions', async () => {
      const agents = agentManager.getAllAgents();
      
      // Calculate initial total credits
      const initialTotal = agents.reduce((sum, agent) => sum + agent.wallet, 0);

      const originalRandom = Math.random;
      
      // Success
      Math.random = () => 0.1;
      await economyEngine.processTransaction(
        agents[0].id,
        agents[1].id,
        50,
        'trade_resources'
      );

      // Failure
      Math.random = () => 0.99;
      await economyEngine.processTransaction(
        agents[1].id,
        agents[2].id,
        75,
        'trade_resources'
      );

      // Success
      Math.random = () => 0.1;
      await economyEngine.processTransaction(
        agents[2].id,
        agents[3].id,
        100,
        'trade_resources'
      );

      Math.random = originalRandom;

      // Calculate final total credits
      const updatedAgents = agentManager.getAllAgents();
      const finalTotal = updatedAgents.reduce((sum, agent) => sum + agent.wallet, 0);

      // Total credits should remain constant
      expect(finalTotal).toBe(initialTotal);
    });
  });

  describe('getRecentTransactions', () => {
    it('should return recent transactions in reverse chronological order', async () => {
      const agents = agentManager.getAllAgents();

      // Create multiple transactions
      await economyEngine.processTransaction(
        agents[0].id,
        agents[1].id,
        50,
        'trade_resources'
      );

      await economyEngine.processTransaction(
        agents[1].id,
        agents[2].id,
        75,
        'hire_agent'
      );

      await economyEngine.processTransaction(
        agents[2].id,
        agents[3].id,
        100,
        'invest'
      );

      const recent = economyEngine.getRecentTransactions(3);

      expect(recent.length).toBe(3);
      // Most recent should be first
      expect(recent[0].timestamp).toBeGreaterThanOrEqual(recent[1].timestamp);
      expect(recent[1].timestamp).toBeGreaterThanOrEqual(recent[2].timestamp);
    });

    it('should limit results to specified count', async () => {
      const agents = agentManager.getAllAgents();

      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await economyEngine.processTransaction(
          agents[0].id,
          agents[1].id,
          10,
          'trade_resources'
        );
      }

      const recent = economyEngine.getRecentTransactions(3);

      expect(recent.length).toBe(3);
    });

    it('should return empty array when no transactions exist', () => {
      const recent = economyEngine.getRecentTransactions(10);

      expect(recent).toEqual([]);
    });
  });
});
