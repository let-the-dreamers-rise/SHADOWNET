/**
 * Unit tests for Ledger service
 * Tests block management, transaction recording, and query capabilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Ledger } from './Ledger.js';
import { Transaction } from '../models/types.js';

describe('Ledger', () => {
  let ledger: Ledger;

  beforeEach(() => {
    ledger = new Ledger();
  });

  describe('addTransaction', () => {
    it('should add transaction to pending pool', () => {
      const transaction: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      ledger.addTransaction(transaction);

      const pending = ledger.getPendingTransactions();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe('tx1');
    });

    it('should maintain immutability by copying transaction', () => {
      const transaction: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      ledger.addTransaction(transaction);

      // Modify original transaction
      transaction.amount = 200;

      const pending = ledger.getPendingTransactions();
      expect(pending[0].amount).toBe(100); // Should still be original value
    });

    it('should accumulate multiple transactions in pending pool', () => {
      const tx1: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      const tx2: Transaction = {
        id: 'tx2',
        from: 'agent2',
        to: 'agent3',
        amount: 50,
        actionType: 'hire_agent',
        timestamp: Date.now(),
        success: true,
        probability: 0.9
      };

      ledger.addTransaction(tx1);
      ledger.addTransaction(tx2);

      const pending = ledger.getPendingTransactions();
      expect(pending).toHaveLength(2);
    });
  });

  describe('finalizeBlock', () => {
    it('should create block with sequential block number starting at 0', () => {
      const tx: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      ledger.addTransaction(tx);
      const block = ledger.finalizeBlock();

      expect(block.blockNumber).toBe(0);
      expect(block.transactionCount).toBe(1);
      expect(block.transactions).toHaveLength(1);
    });

    it('should assign sequential block numbers', () => {
      const tx1: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      const tx2: Transaction = {
        id: 'tx2',
        from: 'agent2',
        to: 'agent3',
        amount: 50,
        actionType: 'hire_agent',
        timestamp: Date.now(),
        success: true,
        probability: 0.9
      };

      ledger.addTransaction(tx1);
      const block1 = ledger.finalizeBlock();

      ledger.addTransaction(tx2);
      const block2 = ledger.finalizeBlock();

      expect(block1.blockNumber).toBe(0);
      expect(block2.blockNumber).toBe(1);
    });

    it('should assign block number to all transactions in block', () => {
      const tx1: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      const tx2: Transaction = {
        id: 'tx2',
        from: 'agent2',
        to: 'agent3',
        amount: 50,
        actionType: 'hire_agent',
        timestamp: Date.now(),
        success: true,
        probability: 0.9
      };

      ledger.addTransaction(tx1);
      ledger.addTransaction(tx2);
      const block = ledger.finalizeBlock();

      expect(block.transactions[0].blockNumber).toBe(0);
      expect(block.transactions[1].blockNumber).toBe(0);
    });

    it('should clear pending transactions after finalization', () => {
      const tx: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      ledger.addTransaction(tx);
      ledger.finalizeBlock();

      const pending = ledger.getPendingTransactions();
      expect(pending).toHaveLength(0);
    });

    it('should create empty block if no pending transactions', () => {
      const block = ledger.finalizeBlock();

      expect(block.blockNumber).toBe(0);
      expect(block.transactionCount).toBe(0);
      expect(block.transactions).toHaveLength(0);
    });

    it('should maintain append-only immutability', () => {
      const tx: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      ledger.addTransaction(tx);
      ledger.finalizeBlock();

      const blocks = ledger.getAllBlocks();
      expect(blocks).toHaveLength(1);

      // Try to modify the returned block (should not affect internal state)
      blocks[0].blockNumber = 999;

      const blocksAgain = ledger.getAllBlocks();
      expect(blocksAgain[0].blockNumber).toBe(0);
    });
  });

  describe('getTransactionsByAgent', () => {
    beforeEach(() => {
      // Set up test data
      const tx1: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      const tx2: Transaction = {
        id: 'tx2',
        from: 'agent2',
        to: 'agent3',
        amount: 50,
        actionType: 'hire_agent',
        timestamp: Date.now(),
        success: true,
        probability: 0.9
      };

      const tx3: Transaction = {
        id: 'tx3',
        from: 'agent3',
        to: 'agent1',
        amount: 75,
        actionType: 'invest',
        timestamp: Date.now(),
        success: true,
        probability: 0.85
      };

      ledger.addTransaction(tx1);
      ledger.addTransaction(tx2);
      ledger.finalizeBlock();

      ledger.addTransaction(tx3);
    });

    it('should return transactions where agent is sender', () => {
      const transactions = ledger.getTransactionsByAgent('agent1');
      expect(transactions).toHaveLength(2); // tx1 (sender) and tx3 (receiver)
      expect(transactions.map(tx => tx.id).sort()).toEqual(['tx1', 'tx3']);
    });

    it('should return transactions where agent is receiver', () => {
      const transactions = ledger.getTransactionsByAgent('agent2');
      expect(transactions).toHaveLength(2);
      expect(transactions.map(tx => tx.id).sort()).toEqual(['tx1', 'tx2']);
    });

    it('should return transactions from both finalized blocks and pending pool', () => {
      const transactions = ledger.getTransactionsByAgent('agent3');
      expect(transactions).toHaveLength(2);
      expect(transactions.map(tx => tx.id).sort()).toEqual(['tx2', 'tx3']);
    });

    it('should return empty array for agent with no transactions', () => {
      const transactions = ledger.getTransactionsByAgent('agent999');
      expect(transactions).toHaveLength(0);
    });
  });

  describe('getBlock', () => {
    beforeEach(() => {
      const tx1: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      const tx2: Transaction = {
        id: 'tx2',
        from: 'agent2',
        to: 'agent3',
        amount: 50,
        actionType: 'hire_agent',
        timestamp: Date.now(),
        success: true,
        probability: 0.9
      };

      ledger.addTransaction(tx1);
      ledger.finalizeBlock();

      ledger.addTransaction(tx2);
      ledger.finalizeBlock();
    });

    it('should return block by block number', () => {
      const block = ledger.getBlock(0);
      expect(block).toBeDefined();
      expect(block!.blockNumber).toBe(0);
      expect(block!.transactions[0].id).toBe('tx1');
    });

    it('should return correct block for different block numbers', () => {
      const block1 = ledger.getBlock(1);
      expect(block1).toBeDefined();
      expect(block1!.blockNumber).toBe(1);
      expect(block1!.transactions[0].id).toBe('tx2');
    });

    it('should return undefined for non-existent block', () => {
      const block = ledger.getBlock(999);
      expect(block).toBeUndefined();
    });
  });

  describe('getRecentBlocks', () => {
    beforeEach(() => {
      // Create 5 blocks
      for (let i = 0; i < 5; i++) {
        const tx: Transaction = {
          id: `tx${i}`,
          from: 'agent1',
          to: 'agent2',
          amount: 100 + i,
          actionType: 'trade_resources',
          timestamp: Date.now() + i,
          success: true,
          probability: 0.8
        };
        ledger.addTransaction(tx);
        ledger.finalizeBlock();
      }
    });

    it('should return most recent blocks in reverse chronological order', () => {
      const blocks = ledger.getRecentBlocks(3);
      expect(blocks).toHaveLength(3);
      expect(blocks[0].blockNumber).toBe(4); // Most recent
      expect(blocks[1].blockNumber).toBe(3);
      expect(blocks[2].blockNumber).toBe(2);
    });

    it('should return all blocks if limit exceeds total blocks', () => {
      const blocks = ledger.getRecentBlocks(10);
      expect(blocks).toHaveLength(5);
      expect(blocks[0].blockNumber).toBe(4);
      expect(blocks[4].blockNumber).toBe(0);
    });

    it('should return empty array if no blocks exist', () => {
      const emptyLedger = new Ledger();
      const blocks = emptyLedger.getRecentBlocks(5);
      expect(blocks).toHaveLength(0);
    });
  });

  describe('getTotalTransactionCount', () => {
    it('should return 0 for empty ledger', () => {
      expect(ledger.getTotalTransactionCount()).toBe(0);
    });

    it('should return total count across all blocks', () => {
      const tx1: Transaction = {
        id: 'tx1',
        from: 'agent1',
        to: 'agent2',
        amount: 100,
        actionType: 'trade_resources',
        timestamp: Date.now(),
        success: true,
        probability: 0.8
      };

      const tx2: Transaction = {
        id: 'tx2',
        from: 'agent2',
        to: 'agent3',
        amount: 50,
        actionType: 'hire_agent',
        timestamp: Date.now(),
        success: true,
        probability: 0.9
      };

      const tx3: Transaction = {
        id: 'tx3',
        from: 'agent3',
        to: 'agent1',
        amount: 75,
        actionType: 'invest',
        timestamp: Date.now(),
        success: true,
        probability: 0.85
      };

      ledger.addTransaction(tx1);
      ledger.addTransaction(tx2);
      ledger.finalizeBlock();

      ledger.addTransaction(tx3);
      ledger.finalizeBlock();

      expect(ledger.getTotalTransactionCount()).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple finalizations without pending transactions', () => {
      ledger.finalizeBlock();
      ledger.finalizeBlock();
      ledger.finalizeBlock();

      const blocks = ledger.getAllBlocks();
      expect(blocks).toHaveLength(3);
      expect(blocks[0].blockNumber).toBe(0);
      expect(blocks[1].blockNumber).toBe(1);
      expect(blocks[2].blockNumber).toBe(2);
    });

    it('should maintain correct state after many operations', () => {
      // Add and finalize multiple times
      for (let i = 0; i < 10; i++) {
        const tx: Transaction = {
          id: `tx${i}`,
          from: `agent${i}`,
          to: `agent${i + 1}`,
          amount: 100 + i,
          actionType: 'trade_resources',
          timestamp: Date.now() + i,
          success: true,
          probability: 0.8
        };
        ledger.addTransaction(tx);
        
        if (i % 3 === 0) {
          ledger.finalizeBlock();
        }
      }

      // Finalize remaining
      ledger.finalizeBlock();

      const blocks = ledger.getAllBlocks();
      const totalTx = blocks.reduce((sum, b) => sum + b.transactionCount, 0);
      expect(totalTx).toBe(10);
    });
  });
});
