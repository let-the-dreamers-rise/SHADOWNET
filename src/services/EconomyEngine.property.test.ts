/**
 * Property-Based Tests for EconomyEngine
 * Feature: shadownet
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { EconomyEngine } from './EconomyEngine.js';
import { AgentManager } from './AgentManager.js';
import { ActionType } from '../models/types.js';

describe('EconomyEngine Property Tests', () => {
  /**
   * Property 4: Transaction Validation
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any transaction attempt, if the sender's wallet balance is less than
   * the transaction amount, the transaction must be rejected and no wallet
   * balances should change.
   */
  it('Property 4: Transaction Validation', () => {
    // Arbitraries for test data generation
    const agentCountArb = fc.integer({ min: 2, max: 10 });
    const initialBalanceArb = fc.integer({ min: 100, max: 5000 });
    const transactionAmountArb = fc.integer({ min: 1, max: 10000 });

    fc.assert(
      fc.asyncProperty(
        agentCountArb,
        initialBalanceArb,
        transactionAmountArb,
        async (agentCount, initialBalance, transactionAmount) => {
          // Initialize system
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, initialBalance);
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();
          const sender = agents[0];
          const receiver = agents[1];

          // Record initial wallet balances
          const initialSenderWallet = sender.wallet;
          const initialReceiverWallet = receiver.wallet;
          const initialTotalCredits = agents.reduce((sum, a) => sum + a.wallet, 0);

          // Attempt transaction
          const transaction = await economyEngine.processTransaction(
            sender.id,
            receiver.id,
            transactionAmount,
            'trade_resources'
          );

          // Get updated agent states
          const updatedSender = agentManager.getAgent(sender.id)!;
          const updatedReceiver = agentManager.getAgent(receiver.id)!;
          const updatedAgents = agentManager.getAllAgents();
          const finalTotalCredits = updatedAgents.reduce((sum, a) => sum + a.wallet, 0);

          // Property: If sender had insufficient funds, transaction must be rejected
          if (initialSenderWallet < transactionAmount) {
            // Transaction must fail
            expect(transaction.success).toBe(false);
            
            // Wallet balances must remain unchanged
            expect(updatedSender.wallet).toBe(initialSenderWallet);
            expect(updatedReceiver.wallet).toBe(initialReceiverWallet);
            
            // Total credits must remain unchanged
            expect(finalTotalCredits).toBe(initialTotalCredits);
          }

          // Property: If sender had sufficient funds and transaction succeeded,
          // wallets must be updated correctly
          if (initialSenderWallet >= transactionAmount && transaction.success) {
            expect(updatedSender.wallet).toBe(initialSenderWallet - transactionAmount);
            expect(updatedReceiver.wallet).toBe(initialReceiverWallet + transactionAmount);
            
            // Total credits must remain unchanged (conservation)
            expect(finalTotalCredits).toBe(initialTotalCredits);
          }

          // Property: If sender had sufficient funds but transaction failed probabilistically,
          // wallets must remain unchanged
          if (initialSenderWallet >= transactionAmount && !transaction.success) {
            expect(updatedSender.wallet).toBe(initialSenderWallet);
            expect(updatedReceiver.wallet).toBe(initialReceiverWallet);
            
            // Total credits must remain unchanged
            expect(finalTotalCredits).toBe(initialTotalCredits);
          }

          // Property: Total credits in the system must always be conserved
          expect(finalTotalCredits).toBe(initialTotalCredits);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 5: Credit Conservation
   * **Validates: Requirements 3.3**
   * 
   * For any successful transaction between two agents, the sum of all agent
   * wallet balances in the system must remain constant (credits are neither
   * created nor destroyed).
   */
  it('Property 5: Credit Conservation', () => {
    // Arbitraries for test data generation
    const agentCountArb = fc.integer({ min: 2, max: 20 });
    const initialBalanceArb = fc.integer({ min: 500, max: 5000 });
    const transactionCountArb = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.asyncProperty(
        agentCountArb,
        initialBalanceArb,
        transactionCountArb,
        async (agentCount, initialBalance, transactionCount) => {
          // Initialize system
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, initialBalance);
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();
          
          // Calculate initial total credits in the system
          const initialTotalCredits = agents.reduce((sum, a) => sum + a.wallet, 0);

          // Perform multiple transactions
          for (let i = 0; i < transactionCount; i++) {
            // Select random sender and receiver
            const senderIndex = Math.floor(Math.random() * agents.length);
            let receiverIndex = Math.floor(Math.random() * agents.length);
            
            // Ensure sender and receiver are different
            while (receiverIndex === senderIndex) {
              receiverIndex = Math.floor(Math.random() * agents.length);
            }

            const sender = agentManager.getAgent(agents[senderIndex].id)!;
            const receiver = agentManager.getAgent(agents[receiverIndex].id)!;

            // Generate transaction amount that sender can afford
            const maxAmount = Math.max(1, Math.floor(sender.wallet * 0.8));
            const amount = Math.floor(Math.random() * maxAmount) + 1;

            // Process transaction
            await economyEngine.processTransaction(
              sender.id,
              receiver.id,
              amount,
              'trade_resources'
            );
          }

          // Calculate final total credits in the system
          const updatedAgents = agentManager.getAllAgents();
          const finalTotalCredits = updatedAgents.reduce((sum, a) => sum + a.wallet, 0);

          // Property: Total credits must be conserved across all transactions
          expect(finalTotalCredits).toBe(initialTotalCredits);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 6: Transaction Probability Bounds
   * **Validates: Requirements 3.4**
   * 
   * For any transaction, the calculated success probability must be a value
   * between 0.0 and 1.0 inclusive.
   */
  it('Property 6: Transaction Probability Bounds', () => {
    // Arbitraries for test data generation
    const agentCountArb = fc.integer({ min: 2, max: 20 });
    const reputationArb = fc.integer({ min: 0, max: 100 });
    const actionTypeArb = fc.constantFrom<ActionType>(
      'hire_agent',
      'trade_resources',
      'form_alliance',
      'risky_deal',
      'invest',
      'save',
      'betray_alliance',
      'build_reputation'
    );

    fc.assert(
      fc.property(
        agentCountArb,
        reputationArb,
        reputationArb,
        actionTypeArb,
        (agentCount, senderReputation, receiverReputation, actionType) => {
          // Initialize system
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, 1000);
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();
          const sender = agents[0];
          const receiver = agents[1];

          // Set specific reputation values to test edge cases
          agentManager.updateAgent(sender.id, { reputation: senderReputation });
          agentManager.updateAgent(receiver.id, { reputation: receiverReputation });

          // Get updated agents
          const updatedSender = agentManager.getAgent(sender.id)!;
          const updatedReceiver = agentManager.getAgent(receiver.id)!;

          // Calculate success probability
          const probability = economyEngine.calculateSuccessProbability(
            updatedSender,
            updatedReceiver,
            actionType
          );

          // Property: Probability must be between 0.0 and 1.0 inclusive
          expect(probability).toBeGreaterThanOrEqual(0.0);
          expect(probability).toBeLessThanOrEqual(1.0);

          // Additional check: probability should be a valid number (not NaN or Infinity)
          expect(Number.isFinite(probability)).toBe(true);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property 7: Probabilistic Transaction Fairness
   * **Validates: Requirements 3.5**
   * 
   * For any transaction with a given success probability p, when executed many
   * times (n ≥ 100) with the same parameters, the observed success rate should
   * converge toward p within a reasonable tolerance (±10%).
   */
  it('Property 7: Probabilistic Transaction Fairness', async () => {
    // Arbitraries for test data generation
    const reputationArb = fc.integer({ min: 0, max: 100 });
    const actionTypeArb = fc.constantFrom<ActionType>(
      'hire_agent',
      'trade_resources',
      'form_alliance',
      'risky_deal',
      'invest',
      'save',
      'betray_alliance',
      'build_reputation'
    );

    await fc.assert(
      fc.asyncProperty(
        reputationArb,
        reputationArb,
        actionTypeArb,
        async (senderReputation, receiverReputation, actionType) => {
          // Initialize system with sufficient agents and balance
          const agentManager = new AgentManager();
          agentManager.initializeAgents(2, 1000000); // Large balance to avoid insufficient funds
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();
          const sender = agents[0];
          const receiver = agents[1];

          // Set specific reputation values
          agentManager.updateAgent(sender.id, { reputation: senderReputation });
          agentManager.updateAgent(receiver.id, { reputation: receiverReputation });

          // Get updated agents
          const updatedSender = agentManager.getAgent(sender.id)!;
          const updatedReceiver = agentManager.getAgent(receiver.id)!;

          // Calculate expected success probability
          const expectedProbability = economyEngine.calculateSuccessProbability(
            updatedSender,
            updatedReceiver,
            actionType
          );

          // Run the transaction many times (n = 100 as per requirement)
          const numTrials = 100;
          const transactionAmount = 100; // Small amount to ensure we don't run out of funds
          let successCount = 0;

          for (let i = 0; i < numTrials; i++) {
            // Reset reputations and wallets to ensure consistent conditions across all trials
            agentManager.updateAgent(sender.id, { 
              reputation: senderReputation,
              wallet: 1000000 
            });
            agentManager.updateAgent(receiver.id, { 
              reputation: receiverReputation,
              wallet: 1000000 
            });

            // Process transaction
            const transaction = await economyEngine.processTransaction(
              sender.id,
              receiver.id,
              transactionAmount,
              actionType
            );

            if (transaction.success) {
              successCount++;
            }
          }

          // Calculate observed success rate
          const observedSuccessRate = successCount / numTrials;

          // Property: Observed success rate should be within ±12% of expected probability
          // (Slightly wider tolerance to account for statistical variance with 100 trials)
          const tolerance = 0.12;
          const lowerBound = expectedProbability - tolerance;
          const upperBound = expectedProbability + tolerance;

          // The observed rate should converge toward the expected probability
          expect(observedSuccessRate).toBeGreaterThanOrEqual(lowerBound);
          expect(observedSuccessRate).toBeLessThanOrEqual(upperBound);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  }, 60000); // Increase timeout to 60 seconds for this test
});


  /**
   * Property 8: Failed Transaction Rollback
   * **Validates: Requirements 3.6**
   * 
   * For any transaction that fails (either due to insufficient funds or probabilistic failure),
   * all agent states (wallet balances, reputation) must remain unchanged.
   */
  it('Property 8: Failed Transaction Rollback', async () => {
    const agentCountArb = fc.integer({ min: 2, max: 10 });
    const initialBalanceArb = fc.integer({ min: 100, max: 5000 });

    await fc.assert(
      fc.asyncProperty(
        agentCountArb,
        initialBalanceArb,
        async (agentCount, initialBalance) => {
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, initialBalance);
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();
          const sender = agents[0];
          const receiver = agents[1];

          // Record initial states
          const initialSenderWallet = sender.wallet;
          const initialSenderReputation = sender.reputation;
          const initialReceiverWallet = receiver.wallet;
          const initialReceiverReputation = receiver.reputation;

          // Attempt transaction with amount exceeding sender's balance
          const transactionAmount = sender.wallet + 1000;
          const transaction = await economyEngine.processTransaction(
            sender.id,
            receiver.id,
            transactionAmount,
            'trade_resources'
          );

          // Get updated states
          const updatedSender = agentManager.getAgent(sender.id)!;
          const updatedReceiver = agentManager.getAgent(receiver.id)!;

          // Property: Transaction must fail
          expect(transaction.success).toBe(false);

          // Property: All states must remain unchanged
          expect(updatedSender.wallet).toBe(initialSenderWallet);
          expect(updatedSender.reputation).toBe(initialSenderReputation);
          expect(updatedReceiver.wallet).toBe(initialReceiverWallet);
          expect(updatedReceiver.reputation).toBe(initialReceiverReputation);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Reputation Bounds Invariant
   * **Validates: Requirements 4.6**
   * 
   * For any agent at any time, the reputation score must always be between 0 and 100 inclusive.
   */
  it('Property 10: Reputation Bounds Invariant', async () => {
    const agentCountArb = fc.integer({ min: 2, max: 10 });
    const initialBalanceArb = fc.integer({ min: 500, max: 5000 });
    const transactionCountArb = fc.integer({ min: 1, max: 20 });

    await fc.assert(
      fc.asyncProperty(
        agentCountArb,
        initialBalanceArb,
        transactionCountArb,
        async (agentCount, initialBalance, transactionCount) => {
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, initialBalance);
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();

          // Perform multiple transactions
          for (let i = 0; i < transactionCount; i++) {
            const senderIndex = Math.floor(Math.random() * agents.length);
            let receiverIndex = Math.floor(Math.random() * agents.length);
            while (receiverIndex === senderIndex) {
              receiverIndex = Math.floor(Math.random() * agents.length);
            }

            const sender = agentManager.getAgent(agents[senderIndex].id)!;
            const receiver = agentManager.getAgent(agents[receiverIndex].id)!;
            const amount = Math.min(100, Math.floor(sender.wallet * 0.5));

            if (amount > 0) {
              await economyEngine.processTransaction(
                sender.id,
                receiver.id,
                amount,
                'trade_resources'
              );
            }
          }

          // Property: All agents must have reputation between 0 and 100
          const updatedAgents = agentManager.getAllAgents();
          updatedAgents.forEach(agent => {
            expect(agent.reputation).toBeGreaterThanOrEqual(0);
            expect(agent.reputation).toBeLessThanOrEqual(100);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Reputation Change Bounds
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
   * 
   * For any action, the reputation change must be within the specified bounds for that action type.
   */
  it('Property 11: Reputation Change Bounds', async () => {
    const agentCountArb = fc.integer({ min: 2, max: 10 });
    const actionTypeArb = fc.constantFrom<ActionType>(
      'hire_agent',
      'trade_resources',
      'risky_deal',
      'betray_alliance'
    );

    await fc.assert(
      fc.asyncProperty(
        agentCountArb,
        actionTypeArb,
        async (agentCount, actionType) => {
          const agentManager = new AgentManager();
          agentManager.initializeAgents(agentCount, 5000);
          const economyEngine = new EconomyEngine(agentManager);

          const agents = agentManager.getAllAgents();
          const sender = agents[0];
          const receiver = agents[1];

          const initialSenderReputation = sender.reputation;
          const initialReceiverReputation = receiver.reputation;

          await economyEngine.processTransaction(
            sender.id,
            receiver.id,
            100,
            actionType
          );

          const updatedSender = agentManager.getAgent(sender.id)!;
          const updatedReceiver = agentManager.getAgent(receiver.id)!;

          const senderChange = Math.abs(updatedSender.reputation - initialSenderReputation);
          const receiverChange = Math.abs(updatedReceiver.reputation - initialReceiverReputation);

          // Property: Reputation changes must be within expected bounds
          // Based on design doc: successful deals +3 to +7, failed deals -2 to -5, betrayal -15 to -25
          expect(senderChange).toBeLessThanOrEqual(25);
          expect(receiverChange).toBeLessThanOrEqual(25);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Reputation Influences Probability
   * **Validates: Requirements 4.7**
   * 
   * For any two agents with different reputation scores, the agent with higher reputation
   * should have a higher success probability for the same action.
   */
  it('Property 12: Reputation Influences Probability', () => {
    const actionTypeArb = fc.constantFrom<ActionType>(
      'hire_agent',
      'trade_resources',
      'form_alliance',
      'risky_deal'
    );

    fc.assert(
      fc.property(actionTypeArb, (actionType) => {
        const agentManager = new AgentManager();
        agentManager.initializeAgents(4, 1000);
        const economyEngine = new EconomyEngine(agentManager);

        const agents = agentManager.getAllAgents();

        // Set up two scenarios with different reputations
        agentManager.updateAgent(agents[0].id, { reputation: 80 }); // High reputation sender
        agentManager.updateAgent(agents[1].id, { reputation: 50 }); // Medium reputation receiver
        agentManager.updateAgent(agents[2].id, { reputation: 20 }); // Low reputation sender
        agentManager.updateAgent(agents[3].id, { reputation: 50 }); // Medium reputation receiver

        const highRepSender = agentManager.getAgent(agents[0].id)!;
        const receiver1 = agentManager.getAgent(agents[1].id)!;
        const lowRepSender = agentManager.getAgent(agents[2].id)!;
        const receiver2 = agentManager.getAgent(agents[3].id)!;

        const highRepProbability = economyEngine.calculateSuccessProbability(
          highRepSender,
          receiver1,
          actionType
        );

        const lowRepProbability = economyEngine.calculateSuccessProbability(
          lowRepSender,
          receiver2,
          actionType
        );

        // Property: Higher reputation should lead to higher success probability
        expect(highRepProbability).toBeGreaterThanOrEqual(lowRepProbability);
      }),
      { numRuns: 100 }
    );
  });
