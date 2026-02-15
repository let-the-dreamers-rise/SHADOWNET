/**
 * Shared type definitions for SHADOWNET frontend
 */

export interface Agent {
  id: string;
  name: string;
  personality: string;
  role: string;
  wallet: number;
  reputation: number;
  memory: ActionLog[];
  stats: AgentStats;
  alliances: string[];
}

export interface ActionLog {
  timestamp: number;
  action: string;
  target?: string;
  amount?: number;
  success: boolean;
  reason?: string;
}

export interface AgentStats {
  transactionCount: number;
  successfulDeals: number;
  failedDeals: number;
  totalEarned: number;
  totalLost: number;
  betrayals: number;
  alliances: number;
}

export interface LeaderboardsData {
  richest: Agent[];
  mostTrusted: Agent[];
  mostActive: Agent[];
}

export interface DramaEvent {
  timestamp: number;
  type: 'betrayal' | 'revenge' | 'alliance_war' | 'blacklist' | 'vendetta_complete';
  agent: string;
  target?: string;
  description: string;
  severity: number;
}

export interface Stats {
  totalAgents: number;
  totalTransactions: number;
  totalCredits: number;
  averageReputation: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAlliances: number;
  totalBetrayals: number;
  shadowStats?: {
    totalGrudges: number;
    totalBlacklisted: number;
    avgThreatLevel: number;
    recentDramaCount: number;
  };
}
