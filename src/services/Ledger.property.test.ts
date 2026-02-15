/**
 * Property-Based Tests for Ledger
 * Feature: shadownet
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { Ledger } from './Ledger.js';
import { Transaction } from '../models/types.js';

describe('Ledger Property Tests', () => {
  /**
   * Property 9: Transaction Recording Completeness
   * **Validates: Requirements 3.7, 6.1**
   * 
   * For any transaction processed by the economy engine, the transaction must
   * be recorded in the ledger with all required fields.
   */
  it('Property 9: Transaction Recording Completeness', () => {
    const transactionCountArb = fc.integer({ min: 1, max: 50 });
    const agentIdArb = fc.string({ minLength: 1, maxLength: 50 });
    const amountArb = fc.integer({ min: 1, max: 10000 });
    const actionTypeArb = fc.constantFrom(
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
        transactionCountArb,
        (transactionCount) => {
          const ledger = new Ledger();
          const transactions: Transaction[] = [];

          // Add multiple transactions
          for (let i = 0; i < transactionCount; i++) {
            const transaction: Transaction = {
              id: `tx-${i}`,
              from: fc.sample(agentIdArb, 1)[0],
              to: fc.sample(agentIdArb, 1)[0],
              amount: fc.sample(amountArb, 1)[0],
              actionType: fc.sample(actionTypeArb, 1)[0] as any,
              timestamp: Date.now() + i,
              success: Math.random() > 0.5,
              probability: Math.random()
            };

            ledger.addTransaction(transaction);
            transactions.push(transaction);
          }

          // Finalize block to commit transactions
          ledger.finalizeBlock();

          // Property: All transactions must be recorded
          const recentBlocks = ledger.getRecentBlocks(1);
          expect(recentBlocks).toHaveLength(1);

          const block = recentBlocks[0];
          expect(block.transactions).toHaveLength(transactionCount);

          // Property: Each transaction must have all required fields
          block.transactions.forEach((tx, index) => {
            expect(tx.id).toBeDefined();
            expect(tx.from).toBeDefined();
            expect(tx.to).toBeDefined();
            expect(tx.amount).toBeGreaterThanOrEqual(0);
            expect(tx.actionType).toBeDefined();
            expect(tx.timestamp).toBeDefined();
            expect(typeof tx.success).toBe('boolean');
            expect(tx.probability).toBeGreaterThanOrEqual(0);
            expect(tx.probability).toBeLessThanOrEqual(1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Block Number Sequentiality
   * **Validates: Requirements 6.3**
   * 
   * For any sequence of block finalizations, block numbers must be sequential
   * starting from 0 with no gaps.
   */
  it('Property 16: Block Number Sequentiality', () => {
    const blockCountArb = fc.integer({ min: 1, max: 20 });
    const transactionsPerBlockArb = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(
        blockCountArb,
        transactionsPerBlockArb,
        (blockCount, transactionsPerBlock) => {
          const ledger = new Ledger();

          // Create multiple blocks
          for (let blockIndex = 0; blockIndex < blockCount; blockIndex++) {
            // Add transactions to pending pool
            for (let txIndex = 0; txIndex < transactionsPerBlock; txIndex++) {
              const transaction: Transaction = {
                id: `tx-${blockIndex}-${txIndex}`,
                from: `agent-${Math.floor(Math.random() * 10)}`,
                to: `agent-${Math.floor(Math.random() * 10)}`,
                amount: Math.floor(Math.random() * 1000),
                actionType: 'trade_resources',
                timestamp: Date.now() + blockIndex * 1000 + txIndex,
                success: true,
                probability: 0.8
              };
              ledger.addTransaction(transaction);
            }

            // Finalize block
            ledger.finalizeBlock();
          }

          // Property: Block numbers must be sequential starting from 0
          // Note: getRecentBlocks returns blocks in reverse chronological order (most recent first)
          const allBlocks = ledger.getRecentBlocks(blockCount);
          expect(allBlocks).toHaveLength(blockCount);

          // Reverse to get chronological order for testing
          const chronologicalBlocks = [...allBlocks].reverse();

          for (let i = 0; i < chronologicalBlocks.length; i++) {
            expect(chronologicalBlocks[i].blockNumber).toBe(i);
          }

          // Property: No gaps in block numbers
          for (let i = 1; i < chronologicalBlocks.length; i++) {
            expect(chronologicalBlocks[i].blockNumber).toBe(chronologicalBlocks[i - 1].blockNumber + 1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 17: Ledger Immutability
   * **Validates: Requirements 6.4**
   * 
   * For any finalized block, the block's contents (transactions, timestamp, block number)
   * must not change after finalization.
   */
  it('Property 17: Ledger Immutability', () => {
    const transactionCountArb = fc.integer({ min: 1, max: 20 });

    fc.assert(
      fc.property(
        transactionCountArb,
        (transactionCount) => {
          const ledger = new Ledger();

          // Add transactions
          const transactions: Transaction[] = [];
          for (let i = 0; i < transactionCount; i++) {
            const transaction: Transaction = {
              id: `tx-${i}`,
              from: `agent-${Math.floor(Math.random() * 10)}`,
              to: `agent-${Math.floor(Math.random() * 10)}`,
              amount: Math.floor(Math.random() * 1000),
              actionType: 'trade_resources',
              timestamp: Date.now() + i,
              success: true,
              probability: 0.8
            };
            ledger.addTransaction(transaction);
            transactions.push(transaction);
          }

          // Finalize block
          ledger.finalizeBlock();

          // Get the finalized block
          const block1 = ledger.getBlock(0);
          expect(block1).toBeDefined();

          // Record block contents
          const originalBlockNumber = block1!.blockNumber;
          const originalTimestamp = block1!.timestamp;
          const originalTransactionCount = block1!.transactions.length;
          const originalTransactionIds = block1!.transactions.map(tx => tx.id);

          // Add more transactions and finalize another block
          for (let i = 0; i < 5; i++) {
            const transaction: Transaction = {
              id: `tx-new-${i}`,
              from: `agent-${Math.floor(Math.random() * 10)}`,
              to: `agent-${Math.floor(Math.random() * 10)}`,
              amount: Math.floor(Math.random() * 1000),
              actionType: 'trade_resources',
              timestamp: Date.now() + transactionCount + i,
              success: true,
              probability: 0.8
            };
            ledger.addTransaction(transaction);
          }
          ledger.finalizeBlock();

          // Get the first block again
          const block2 = ledger.getBlock(0);
          expect(block2).toBeDefined();

          // Property: Block contents must remain unchanged
          expect(block2!.blockNumber).toBe(originalBlockNumber);
          expect(block2!.timestamp).toBe(originalTimestamp);
          expect(block2!.transactions.length).toBe(originalTransactionCount);

          const newTransactionIds = block2!.transactions.map(tx => tx.id);
          expect(newTransactionIds).toEqual(originalTransactionIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 18: Ledger Query Correctness
   * **Validates: Requirements 6.5**
   * 
   * For any agent ID, getTransactionsByAgent() must return all and only the
   * transactions where the agent is either the sender or receiver.
   */
  it('Property 18: Ledger Query Correctness', () => {
    const agentCountArb = fc.integer({ min: 2, max: 10 });
    const transactionCountArb = fc.integer({ min: 5, max: 30 });

    fc.assert(
      fc.property(
        agentCountArb,
        transactionCountArb,
        (agentCount, transactionCount) => {
          const ledger = new Ledger();
          const agentIds = Array.from({ length: agentCount }, (_, i) => `agent-${i}`);
          const testAgentId = agentIds[0];

          // Track transactions involving the test agent
          const expectedTransactions: Transaction[] = [];

          // Add transactions
          for (let i = 0; i < transactionCount; i++) {
            const fromIndex = Math.floor(Math.random() * agentCount);
            const toIndex = Math.floor(Math.random() * agentCount);

            const transaction: Transaction = {
              id: `tx-${i}`,
              from: agentIds[fromIndex],
              to: agentIds[toIndex],
              amount: Math.floor(Math.random() * 1000),
              actionType: 'trade_resources',
              timestamp: Date.now() + i,
              success: true,
              probability: 0.8
            };

            ledger.addTransaction(transaction);

            // Track if this transaction involves the test agent
            if (transaction.from === testAgentId || transaction.to === testAgentId) {
              expectedTransactions.push(transaction);
            }
          }

          // Finalize block
          ledger.finalizeBlock();

          // Query transactions for the test agent
          const agentTransactions = ledger.getTransactionsByAgent(testAgentId);

          // Property: Must return all transactions involving the agent
          expect(agentTransactions.length).toBe(expectedTransactions.length);

          // Property: All returned transactions must involve the agent
          agentTransactions.forEach(tx => {
            expect(tx.from === testAgentId || tx.to === testAgentId).toBe(true);
          });

          // Property: All expected transactions must be present
          expectedTransactions.forEach(expectedTx => {
            const found = agentTransactions.some(tx => tx.id === expectedTx.id);
            expect(found).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
