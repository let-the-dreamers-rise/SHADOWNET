/**
 * SHADOWNET Type Definitions
 * Core data models for the autonomous multi-agent economy simulator
 */

/**
 * ActionType union type representing all possible agent actions
 * Requirements: 2.4
 */
export type ActionType =
  | 'hire_agent'
  | 'trade_resources'
  | 'form_alliance'
  | 'risky_deal'
  | 'invest'
  | 'save'
  | 'betray_alliance'
  | 'build_reputation';

/**
 * Personality types that influence agent decision-making
 * - greedy: Prioritizes wealth accumulation, takes more risks, less loyal
 * - loyal: Values alliances, less likely to betray, moderate risk
 * - chaotic: Unpredictable actions, high variance in decisions
 * - strategic: Calculated decisions, balances risk and reward
 * Requirements: 1.2
 */
export type Personality = 'greedy' | 'loyal' | 'chaotic' | 'strategic';

/**
 * Role types that define agent behavior patterns
 * - broker: Facilitates deals between other agents, earns commissions
 * - trader: Focuses on resource exchanges, frequent transactions
 * - researcher: Invests in long-term gains, builds reputation
 * - fixer: Handles risky deals, higher risk tolerance
 * Requirements: 1.2
 */
export type Role = 'broker' | 'trader' | 'researcher' | 'fixer';

/**
 * Outcome status for actions and transactions
 */
export type Outcome = 'success' | 'failure';

/**
 * ActionLog records a single action performed by an agent
 * Requirements: 1.4
 */
export interface ActionLog {
  /** Timestamp when the action was performed */
  timestamp: number;
  /** Type of action performed */
  action: ActionType;
  /** Additional details specific to the action */
  details: Record<string, any>;
  /** Whether the action succeeded or failed */
  outcome: Outcome;
}

/**
 * Agent statistics tracking performance metrics
 * Requirements: 1.3
 */
export interface AgentStats {
  /** Total number of transactions initiated */
  transactionCount: number;
  /** Number of successful deals completed */
  successfulDeals: number;
  /** Number of failed deals */
  failedDeals: number;
  /** Number of times this agent betrayed an alliance */
  betrayals: number;
}

/**
 * Agent represents an autonomous AI entity in the simulation
 * Requirements: 1.2, 1.3
 */
export interface Agent {
  /** Unique identifier (UUID) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Personality type influencing decision-making */
  personality: Personality;
  /** Role defining behavior patterns */
  role: Role;
  /** Current credit balance */
  wallet: number;
  /** Reputation score (0-100) */
  reputation: number;
  /** History of actions performed */
  memory: ActionLog[];
  /** Array of allied agent IDs */
  alliances: string[];
  /** Timestamp when agent was created */
  createdAt: number;
  /** Performance statistics */
  stats: AgentStats;
}

/**
 * Transaction represents a credit transfer between agents
 * Requirements: 3.1, 6.1
 */
export interface Transaction {
  /** Unique transaction identifier */
  id: string;
  /** Sender agent ID */
  from: string;
  /** Receiver agent ID */
  to: string;
  /** Amount of credits transferred */
  amount: number;
  /** Type of action that triggered this transaction */
  actionType: ActionType;
  /** Timestamp when transaction was initiated */
  timestamp: number;
  /** Whether the transaction succeeded */
  success: boolean;
  /** Calculated success probability (0-1) */
  probability: number;
  /** Block number (assigned when added to a block) */
  blockNumber?: number;
}

/**
 * Alliance represents a cooperative relationship between agents
 * Requirements: 5.1, 5.2
 */
export interface Alliance {
  /** Unique alliance identifier */
  id: string;
  /** Array of agent IDs in this alliance */
  members: string[];
  /** Timestamp when alliance was formed */
  formedAt: number;
  /** Whether the alliance is currently active */
  active: boolean;
}

/**
 * Block represents a grouped collection of transactions in the ledger
 * Requirements: 6.1, 6.3
 */
export interface Block {
  /** Sequential block number */
  blockNumber: number;
  /** Timestamp when block was finalized */
  timestamp: number;
  /** Transactions included in this block */
  transactions: Transaction[];
  /** Number of transactions in this block */
  transactionCount: number;
}

/**
 * DecisionContext provides information for agent decision-making
 * Requirements: 2.2
 */
export interface DecisionContext {
  /** Current agent state */
  agent: Agent;
  /** Sample of other visible agents */
  otherAgents: Agent[];
  /** Recent transaction history */
  recentActivity: Transaction[];
  /** Actions available to the agent */
  availableActions: ActionType[];
  /** Current economic state metrics */
  economicState: {
    averageWealth: number;
    averageReputation: number;
  };
}

/**
 * Decision represents an agent's chosen action
 * Requirements: 2.3
 */
export interface Decision {
  /** Chosen action type */
  action: ActionType;
  /** Target agent ID (for interactions) */
  target?: string;
  /** Credit amount (for transactions) */
  amount?: number;
  /** LLM's explanation for the decision */
  reasoning?: string;
}

/**
 * ValidationResult for transaction validation
 * Requirements: 3.1, 3.2
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Array of error messages if validation failed */
  errors: string[];
}

/**
 * ErrorResponse for API error handling
 */
export interface ErrorResponse {
  /** Error type/name */
  error: string;
  /** Human-readable error message */
  message: string;
  /** Timestamp when error occurred */
  timestamp: number;
  /** Request path that caused the error */
  path?: string;
}

/**
 * LeaderboardEntry for ranking displays
 * Requirements: 7.1, 7.2, 7.3
 */
export interface LeaderboardEntry {
  /** Agent ID */
  id: string;
  /** Agent name */
  name: string;
  /** Value being ranked (wallet, reputation, or activity count) */
  value: number;
  /** Agent's rank position */
  rank: number;
}

/**
 * SystemStats for aggregate statistics
 * Requirements: 9.5
 */
export interface SystemStats {
  /** Total number of agents in the system */
  totalAgents: number;
  /** Total credits in circulation */
  totalCredits: number;
  /** Average reputation across all agents */
  averageReputation: number;
  /** Total number of transactions processed */
  totalTransactions: number;
  /** Number of currently active alliances */
  activeAlliances: number;
  /** Shadow economy stats */
  shadowStats?: {
    totalGrudges: number;
    totalBlacklisted: number;
    avgThreatLevel: number;
    recentDramaCount: number;
  };
}
