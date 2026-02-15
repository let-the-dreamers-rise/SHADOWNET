/**
 * Agent Generation Utilities
 * Functions for creating diverse agents with unique identities
 * Requirements: 1.1, 1.2, 10.5
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, Personality, Role } from '../models/types.js';

/**
 * Pool of cyberpunk-themed agent names for the shadow economy
 */
const AGENT_NAMES = [
  'Cipher', 'Neon', 'Raven', 'Ghost', 'Vex', 'Blade', 'Echo', 'Frost',
  'Hex', 'Jinx', 'Kode', 'Lynx', 'Maze', 'Nova', 'Onyx', 'Pulse',
  'Quantum', 'Razor', 'Shadow', 'Spike', 'Trace', 'Viper', 'Wraith', 'Zero',
  'Apex', 'Byte', 'Crash', 'Dagger', 'Edge', 'Flux'
];

/**
 * Available personality types
 */
const PERSONALITIES: Personality[] = ['greedy', 'loyal', 'chaotic', 'strategic'];

/**
 * Available role types
 */
const ROLES: Role[] = ['broker', 'trader', 'researcher', 'fixer'];

/**
 * Generate unique agent names by shuffling and selecting from the name pool
 * Requirements: 1.1, 1.2
 * 
 * @param count - Number of unique names to generate
 * @returns Array of unique agent names
 * @throws Error if count exceeds available names
 */
export function generateUniqueNames(count: number): string[] {
  if (count > AGENT_NAMES.length) {
    throw new Error(`Cannot generate ${count} unique names. Maximum available: ${AGENT_NAMES.length}`);
  }

  // Shuffle the names array using Fisher-Yates algorithm
  const shuffled = [...AGENT_NAMES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return the first 'count' names
  return shuffled.slice(0, count);
}

/**
 * Generate a random integer between min and max (inclusive)
 * 
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer in range [min, max]
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate agents with diverse personalities and roles
 * Requirements: 1.1, 1.2, 10.5
 * 
 * Ensures diversity by:
 * - Cycling through personalities and roles to guarantee representation
 * - Adding randomness to wallet balances and reputation scores
 * - Creating unique identities for each agent
 * 
 * @param count - Number of agents to generate (12-20 recommended)
 * @param initialBalance - Base wallet balance for each agent
 * @returns Array of initialized agents with diverse attributes
 */
export function generateAgents(count: number, initialBalance: number): Agent[] {
  const agents: Agent[] = [];
  const names = generateUniqueNames(count);
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    // Cycle through personalities and roles to ensure diversity
    // This guarantees at least count/4 agents of each type
    const personality = PERSONALITIES[i % PERSONALITIES.length];
    const role = ROLES[i % ROLES.length];

    // Add variance to initial balance (-100 to +100)
    const wallet = initialBalance + randomInt(-100, 100);

    // Initialize reputation between 40 and 60
    const reputation = randomInt(40, 60);

    agents.push({
      id: uuidv4(),
      name: names[i],
      personality,
      role,
      wallet: Math.max(0, wallet), // Ensure non-negative
      reputation,
      memory: [],
      alliances: [],
      createdAt: now,
      stats: {
        transactionCount: 0,
        successfulDeals: 0,
        failedDeals: 0,
        betrayals: 0
      }
    });
  }

  return agents;
}
