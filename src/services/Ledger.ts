/**
 * Ledger Service
 * Blockchain-style transaction recording system with immutable append-only history
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

import { Transaction, Block } from '../models/types.js';

/**
 * Ledger manages blockchain-style transaction recording with immutable blocks
 * 
 * Key features:
 * - Append-only transaction history
 * - Sequential block numbering
 * - Query capabilities by agent, block, and time range
 * 
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */
export class Ledger {
  private blocks: Block[];
  private pendingTransactions: Transaction[];
  private currentBlockNumber: number;

  constructor() {
    this.blocks = [];
    this.pendingTransactions = [];
    this.currentBlockNumber = 0;
  }

  /**
   * Add transaction to pending pool
   * Transactions are held in pending pool until next block finalization
   * 
   * Requirements: 6.1, 6.4
   */
  addTransaction(transaction: Transaction): void {
    // Create a copy to ensure immutability
    const txCopy = { ...transaction };
    this.pendingTransactions.push(txCopy);
  }

  /**
   * Finalize current block with sequential block numbering
   * Groups all pending transactions into a new block
   * 
   * Requirements: 6.2, 6.3, 6.4
   */
  finalizeBlock(): Block {
    const block: Block = {
      blockNumber: this.currentBlockNumber,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions],
      transactionCount: this.pendingTransactions.length
    };

    // Assign block number to all transactions in this block
    block.transactions.forEach(tx => {
      tx.blockNumber = this.currentBlockNumber;
    });

    // Add block to immutable chain
    this.blocks.push(block);

    // Clear pending pool
    this.pendingTransactions = [];

    // Increment block number for next block
    this.currentBlockNumber++;

    return block;
  }

  /**
   * Query transactions by agent ID
   * Returns all transactions where agent is sender or receiver
   * 
   * Requirements: 6.5
   */
  getTransactionsByAgent(agentId: string): Transaction[] {
    const transactions: Transaction[] = [];

    // Search through all finalized blocks
    for (const block of this.blocks) {
      for (const tx of block.transactions) {
        if (tx.from === agentId || tx.to === agentId) {
          transactions.push(tx);
        }
      }
    }

    // Also check pending transactions
    for (const tx of this.pendingTransactions) {
      if (tx.from === agentId || tx.to === agentId) {
        transactions.push(tx);
      }
    }

    return transactions;
  }

  /**
   * Query block by block number
   * Returns undefined if block doesn't exist
   * 
   * Requirements: 6.5
   */
  getBlock(blockNumber: number): Block | undefined {
    return this.blocks.find(block => block.blockNumber === blockNumber);
  }

  /**
   * Get recent blocks (most recent first)
   * 
   * Requirements: 6.5
   */
  getRecentBlocks(limit: number): Block[] {
    // Return blocks in reverse chronological order
    return this.blocks
      .slice(-limit)
      .reverse();
  }

  /**
   * Get total transaction count across all blocks
   * Used for system statistics
   */
  getTotalTransactionCount(): number {
    return this.blocks.reduce((sum, block) => sum + block.transactionCount, 0);
  }

  /**
   * Get all blocks (for testing and debugging)
   * Returns deep copies to maintain immutability
   */
  getAllBlocks(): Block[] {
    return this.blocks.map(block => ({
      ...block,
      transactions: [...block.transactions]
    }));
  }

  /**
   * Get pending transactions (for testing and debugging)
   */
  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }
}
