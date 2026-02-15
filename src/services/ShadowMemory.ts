/**
 * ShadowMemory Service
 * Tracks grudges, vendettas, blacklists, and dark relationships in SHADOWNET
 * Makes agents remember betrayals and seek revenge
 */

import { Agent, Transaction } from '../models/types.js';
import { logger } from '../utils/logger.js';

/**
 * Grudge represents a vendetta between agents
 */
export interface Grudge {
  /** Agent holding the grudge */
  holder: string;
  /** Target of the grudge */
  target: string;
  /** Reason for the grudge */
  reason: 'betrayal' | 'failed_deal' | 'theft' | 'rivalry';
  /** Intensity level (0-100) */
  intensity: number;
  /** When the grudge was formed */
  formedAt: number;
  /** Number of revenge attempts */
  revengeAttempts: number;
}

/**
 * DramaEvent represents significant shadow economy events
 */
export interface DramaEvent {
  /** Event type */
  type: 'betrayal' | 'revenge' | 'alliance_war' | 'blacklist' | 'vendetta_complete';
  /** Timestamp */
  timestamp: number;
  /** Primary agent involved */
  agent: string;
  /** Target agent (if applicable) */
  target?: string;
  /** Event description */
  description: string;
  /** Severity (1-10) */
  severity: number;
}

/**
 * ShadowMemory tracks the dark side of agent relationships
 */
export class ShadowMemory {
  private grudges: Map<string, Grudge[]>; // agentId -> their grudges
  private blacklists: Map<string, Set<string>>; // agentId -> blacklisted agent IDs
  private dramaEvents: DramaEvent[];
  private threatLevels: Map<string, number>; // agentId -> threat level (0-100)

  constructor() {
    this.grudges = new Map();
    this.blacklists = new Map();
    this.dramaEvents = [];
    this.threatLevels = new Map();
  }

  /**
   * Record a betrayal and create a grudge
   */
  recordBetrayal(betrayer: string, victim: string, betrayerName: string, victimName: string): void {
    // Create grudge for victim against betrayer
    const grudge: Grudge = {
      holder: victim,
      target: betrayer,
      reason: 'betrayal',
      intensity: 80 + Math.random() * 20, // High intensity
      formedAt: Date.now(),
      revengeAttempts: 0
    };

    if (!this.grudges.has(victim)) {
      this.grudges.set(victim, []);
    }
    this.grudges.get(victim)!.push(grudge);

    // Add to blacklist
    this.addToBlacklist(victim, betrayer);

    // Increase betrayer's threat level
    this.increaseThreatLevel(betrayer, 15);

    // Record drama event
    this.dramaEvents.push({
      type: 'betrayal',
      timestamp: Date.now(),
      agent: betrayer,
      target: victim,
      description: `${betrayerName} BETRAYED ${victimName} - alliance shattered`,
      severity: 9
    });

    logger.info(`🗡️ BETRAYAL: ${betrayerName} betrayed ${victimName} - grudge formed`);
  }

  /**
   * Record a failed transaction as potential grudge
   */
  recordFailedDeal(from: string, to: string, fromName: string, toName: string, amount: number): void {
    // Failed deals create weaker grudges
    if (Math.random() < 0.4) { // 40% chance to hold grudge
      const grudge: Grudge = {
        holder: from,
        target: to,
        reason: 'failed_deal',
        intensity: 30 + Math.random() * 30,
        formedAt: Date.now(),
        revengeAttempts: 0
      };

      if (!this.grudges.has(from)) {
        this.grudges.set(from, []);
      }
      this.grudges.get(from)!.push(grudge);

      logger.debug(`💢 ${fromName} holds grudge against ${toName} for failed deal`);
    }
  }

  /**
   * Record a revenge action
   */
  recordRevenge(avenger: string, target: string, avengerName: string, targetName: string, success: boolean): void {
    // Find and update grudge
    const grudges = this.grudges.get(avenger) || [];
    const grudge = grudges.find(g => g.target === target);
    
    if (grudge) {
      grudge.revengeAttempts++;
      
      if (success) {
        // Successful revenge reduces intensity
        grudge.intensity = Math.max(0, grudge.intensity - 40);
        
        this.dramaEvents.push({
          type: 'revenge',
          timestamp: Date.now(),
          agent: avenger,
          target: target,
          description: `${avengerName} got REVENGE on ${targetName}`,
          severity: 8
        });

        logger.info(`⚔️ REVENGE: ${avengerName} successfully revenged against ${targetName}`);

        // If grudge satisfied, mark as complete
        if (grudge.intensity < 20) {
          this.dramaEvents.push({
            type: 'vendetta_complete',
            timestamp: Date.now(),
            agent: avenger,
            target: target,
            description: `${avengerName}'s vendetta against ${targetName} is complete`,
            severity: 6
          });
        }
      }
    }
  }

  /**
   * Check if agent has grudge against target
   */
  hasGrudge(agentId: string, targetId: string): boolean {
    const grudges = this.grudges.get(agentId) || [];
    return grudges.some(g => g.target === targetId && g.intensity > 20);
  }

  /**
   * Get strongest grudge for an agent
   */
  getStrongestGrudge(agentId: string): Grudge | undefined {
    const grudges = this.grudges.get(agentId) || [];
    if (grudges.length === 0) return undefined;
    
    return grudges.reduce((strongest, current) => 
      current.intensity > strongest.intensity ? current : strongest
    );
  }

  /**
   * Add agent to blacklist
   */
  addToBlacklist(agentId: string, targetId: string): void {
    if (!this.blacklists.has(agentId)) {
      this.blacklists.set(agentId, new Set());
    }
    this.blacklists.get(agentId)!.add(targetId);
  }

  /**
   * Check if target is blacklisted
   */
  isBlacklisted(agentId: string, targetId: string): boolean {
    return this.blacklists.get(agentId)?.has(targetId) || false;
  }

  /**
   * Increase agent's threat level
   */
  increaseThreatLevel(agentId: string, amount: number): void {
    const current = this.threatLevels.get(agentId) || 0;
    this.threatLevels.set(agentId, Math.min(100, current + amount));
  }

  /**
   * Get agent's threat level
   */
  getThreatLevel(agentId: string): number {
    return this.threatLevels.get(agentId) || 0;
  }

  /**
   * Get recent drama events
   */
  getRecentDrama(limit: number = 20): DramaEvent[] {
    return this.dramaEvents
      .slice(-limit)
      .reverse();
  }

  /**
   * Get all grudges for an agent
   */
  getAgentGrudges(agentId: string): Grudge[] {
    return this.grudges.get(agentId) || [];
  }

  /**
   * Decay grudges over time (call periodically)
   */
  decayGrudges(): void {
    for (const [agentId, grudges] of this.grudges.entries()) {
      for (const grudge of grudges) {
        // Grudges decay slowly over time
        grudge.intensity = Math.max(0, grudge.intensity - 0.5);
      }
      
      // Remove expired grudges
      this.grudges.set(
        agentId,
        grudges.filter(g => g.intensity > 5)
      );
    }
  }

  /**
   * Get shadow statistics
   */
  getShadowStats() {
    const totalGrudges = Array.from(this.grudges.values())
      .reduce((sum, grudges) => sum + grudges.length, 0);
    
    const totalBlacklisted = Array.from(this.blacklists.values())
      .reduce((sum, set) => sum + set.size, 0);
    
    const avgThreatLevel = Array.from(this.threatLevels.values())
      .reduce((sum, level) => sum + level, 0) / (this.threatLevels.size || 1);

    return {
      totalGrudges,
      totalBlacklisted,
      avgThreatLevel: Math.round(avgThreatLevel),
      recentDramaCount: this.dramaEvents.length
    };
  }
}
