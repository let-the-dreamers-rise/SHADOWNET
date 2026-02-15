/**
 * AllianceManager Service
 * Manages alliance formation, betrayal, and queries
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */

import { Alliance } from '../models/types.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * AllianceManager class handles all alliance-related operations
 * Supports multiple simultaneous alliances per agent
 */
export class AllianceManager {
  private alliances: Map<string, Alliance>;

  constructor() {
    this.alliances = new Map();
  }

  /**
   * Form alliance between two agents
   * Requirements: 5.1, 5.2
   * 
   * @param agentId1 - First agent ID
   * @param agentId2 - Second agent ID
   * @returns The newly created Alliance
   */
  formAlliance(agentId1: string, agentId2: string): Alliance {
    // Create new alliance
    const alliance: Alliance = {
      id: uuidv4(),
      members: [agentId1, agentId2],
      formedAt: Date.now(),
      active: true
    };

    // Store alliance
    this.alliances.set(alliance.id, alliance);

    logger.info(`Alliance formed between agents ${agentId1} and ${agentId2} (Alliance ID: ${alliance.id})`);

    return alliance;
  }

  /**
   * Break alliance (betrayal)
   * Requirements: 5.3, 5.4
   * 
   * @param allianceId - Alliance ID to break
   * @param betrayerId - Agent ID who is betraying the alliance
   */
  breakAlliance(allianceId: string, betrayerId: string): void {
    const alliance = this.alliances.get(allianceId);

    if (!alliance) {
      logger.warn(`Attempted to break non-existent alliance: ${allianceId}`);
      return;
    }

    if (!alliance.active) {
      logger.warn(`Attempted to break already inactive alliance: ${allianceId}`);
      return;
    }

    // Mark alliance as inactive
    alliance.active = false;

    logger.info(`Alliance ${allianceId} broken by agent ${betrayerId}`);
  }

  /**
   * Check if two agents are allied
   * Requirements: 5.6
   * 
   * @param agentId1 - First agent ID
   * @param agentId2 - Second agent ID
   * @returns true if agents have an active alliance, false otherwise
   */
  areAllied(agentId1: string, agentId2: string): boolean {
    // Check all active alliances
    for (const alliance of this.alliances.values()) {
      if (alliance.active && 
          alliance.members.includes(agentId1) && 
          alliance.members.includes(agentId2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all alliances for a specific agent
   * Requirements: 5.6
   * 
   * @param agentId - Agent ID to get alliances for
   * @returns Array of alliances (both active and inactive) involving this agent
   */
  getAgentAlliances(agentId: string): Alliance[] {
    const agentAlliances: Alliance[] = [];

    for (const alliance of this.alliances.values()) {
      if (alliance.members.includes(agentId)) {
        agentAlliances.push(alliance);
      }
    }

    return agentAlliances;
  }

  /**
   * Get count of active alliances in the system
   * Used for system statistics
   * 
   * @returns Number of currently active alliances
   */
  getActiveAllianceCount(): number {
    let count = 0;
    for (const alliance of this.alliances.values()) {
      if (alliance.active) {
        count++;
      }
    }
    return count;
  }
}
