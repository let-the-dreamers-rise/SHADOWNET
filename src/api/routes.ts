/**
 * API Routes for SHADOWNET
 * Provides REST endpoints for frontend dashboard
 */

import { Router, Request, Response } from 'express';
import { AgentManager } from '../services/AgentManager.js';
import { EconomyEngine } from '../services/EconomyEngine.js';
import { Ledger } from '../services/Ledger.js';
import { SimulationOrchestrator } from '../services/SimulationOrchestrator.js';
import { logger } from '../utils/logger.js';

export interface RoutesDependencies {
  agentManager: AgentManager;
  economyEngine: EconomyEngine;
  ledger: Ledger;
  orchestrator: SimulationOrchestrator;
}

export function createRoutes(deps: RoutesDependencies): Router {
  const router = Router();
  const { agentManager, economyEngine, ledger, orchestrator } = deps;
  const shadowMemory = orchestrator.getShadowMemory();

  /**
   * GET /api/agents
   * Returns all agents with their current state
   */
  router.get('/agents', (req: Request, res: Response) => {
    try {
      const agents = agentManager.getAllAgents();
      res.json({
        success: true,
        data: agents,
        count: agents.length
      });
    } catch (error) {
      logger.error('Error fetching agents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch agents'
      });
    }
  });

  /**
   * GET /api/activity
   * Returns recent transaction activity
   * Query params:
   *   - limit: number of transactions to return (default: 50, max: 100)
   */
  router.get('/activity', (req: Request, res: Response) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 50,
        100
      );

      const transactions = economyEngine.getRecentTransactions(limit);

      // Sort by timestamp descending (most recent first)
      const sortedTransactions = transactions.sort((a, b) => b.timestamp - a.timestamp);

      res.json({
        success: true,
        data: sortedTransactions,
        count: sortedTransactions.length
      });
    } catch (error) {
      logger.error('Error fetching activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch activity'
      });
    }
  });

  /**
   * GET /api/leaderboards
   * Returns leaderboards for richest, most trusted, and most active agents
   * Query params:
   *   - limit: number of agents per leaderboard (default: 10)
   */
  router.get('/leaderboards', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const richest = agentManager.getLeaderboard('wallet', limit);
      const mostTrusted = agentManager.getLeaderboard('reputation', limit);
      const mostActive = agentManager.getLeaderboard('activity', limit);

      res.json({
        success: true,
        data: {
          richest,
          mostTrusted,
          mostActive
        }
      });
    } catch (error) {
      logger.error('Error fetching leaderboards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboards'
      });
    }
  });

  /**
   * GET /api/ledger
   * Returns recent blocks from the ledger
   * Query params:
   *   - limit: number of blocks to return (default: 10, max: 50)
   */
  router.get('/ledger', (req: Request, res: Response) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 10,
        50
      );

      const blocks = ledger.getRecentBlocks(limit);

      res.json({
        success: true,
        data: blocks,
        count: blocks.length
      });
    } catch (error) {
      logger.error('Error fetching ledger:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ledger'
      });
    }
  });

  /**
   * GET /api/stats
   * Returns aggregate statistics about the simulation
   */
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const agents = agentManager.getAllAgents();
      const transactions = economyEngine.getRecentTransactions(1000);

      // Calculate aggregate stats
      const totalAgents = agents.length;
      const totalCredits = agents.reduce((sum, agent) => sum + agent.wallet, 0);
      const averageReputation = agents.reduce((sum, agent) => sum + agent.reputation, 0) / totalAgents;
      const totalTransactions = transactions.length;

      const successfulTransactions = transactions.filter(tx => tx.success).length;
      const failedTransactions = transactions.filter(tx => !tx.success).length;

      const totalAlliances = agents.reduce((sum, agent) => sum + agent.alliances.length, 0);
      const totalBetrayals = agents.reduce((sum, agent) => sum + agent.stats.betrayals, 0);

      // 🌑 SHADOW STATS
      const shadowStats = shadowMemory.getShadowStats();

      res.json({
        success: true,
        data: {
          totalAgents,
          totalCredits,
          averageReputation: Math.round(averageReputation * 100) / 100,
          totalTransactions,
          successfulTransactions,
          failedTransactions,
          totalAlliances,
          totalBetrayals,
          shadowStats
        }
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats'
      });
    }
  });

  /**
   * GET /api/drama
   * Returns recent dramatic events (betrayals, revenge, etc.)
   * Query params:
   *   - limit: number of events to return (default: 20, max: 50)
   */
  router.get('/drama', (req: Request, res: Response) => {
    try {
      const limit = Math.min(
        parseInt(req.query.limit as string) || 20,
        50
      );

      const drama = shadowMemory.getRecentDrama(limit);

      res.json({
        success: true,
        data: drama,
        count: drama.length
      });
    } catch (error) {
      logger.error('Error fetching drama:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch drama'
      });
    }
  });

  /**
   * GET /api/agents/:id/grudges
   * Returns grudges held by a specific agent
   */
  router.get('/agents/:id/grudges', (req: Request, res: Response) => {
    try {
      const agentId = req.params.id;
      const agent = agentManager.getAgent(agentId);

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }

      const grudges = shadowMemory.getAgentGrudges(agentId);
      const threatLevel = shadowMemory.getThreatLevel(agentId);

      // Enrich grudges with target names
      const enrichedGrudges = grudges.map(grudge => {
        const target = agentManager.getAgent(grudge.target);
        return {
          ...grudge,
          targetName: target?.name || 'Unknown'
        };
      });

      res.json({
        success: true,
        data: {
          agent: {
            id: agent.id,
            name: agent.name
          },
          threatLevel,
          grudges: enrichedGrudges
        }
      });
    } catch (error) {
      logger.error('Error fetching agent grudges:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch agent grudges'
      });
    }
  });

  /**
   * GET /health
   * Health check endpoint
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: Date.now()
    });
  });

  return router;
}
