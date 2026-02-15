/**
 * SHADOWNET Server Entry Point
 * Initializes all services and starts the simulation
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AgentManager } from './services/AgentManager.js';
import { DecisionEngine } from './services/DecisionEngine.js';
import { EconomyEngine } from './services/EconomyEngine.js';
import { AllianceManager } from './services/AllianceManager.js';
import { Ledger } from './services/Ledger.js';
import { ShadowMemory } from './services/ShadowMemory.js';
import { SimulationOrchestrator } from './services/SimulationOrchestrator.js';
import { createRoutes } from './api/routes.js';
import { errorHandler } from './api/middleware.js';
import { logger } from './utils/logger.js';
import { validateConfig } from './utils/config.js';

// Load environment variables
dotenv.config();

// Validate configuration
const config = validateConfig();

// Initialize services
logger.info('Initializing SHADOWNET services...');

const agentManager = new AgentManager();
const allianceManager = new AllianceManager();
const ledger = new Ledger();
const shadowMemory = new ShadowMemory();

logger.info('🌑 SHADOWNET shadow economy initialized');

// Initialize agents with credit supply conservation
const agentCount = config.agentCount;
const initialBalance = config.initialBalance;
const totalSupply = agentCount * initialBalance;

logger.info(`Initializing ${agentCount} agents with ${initialBalance} credits each`);
logger.info(`Total credit supply: ${totalSupply} credits`);

agentManager.initializeAgents(agentCount, initialBalance);

// Verify credit supply conservation
const agents = agentManager.getAllAgents();
const actualSupply = agents.reduce((sum, agent) => sum + agent.wallet, 0);

if (Math.abs(actualSupply - totalSupply) > agentCount * 200) {
  logger.error(`Credit supply mismatch! Expected: ${totalSupply}, Actual: ${actualSupply}`);
  throw new Error('Credit supply conservation violated at initialization');
}

logger.info(`Credit supply verified: ${actualSupply} credits`);

// Create economy engine
const economyEngine = new EconomyEngine(agentManager);

// Create decision engine
const decisionEngine = new DecisionEngine({
  provider: config.llmProvider,
  apiKey: config.llmApiKey,
  model: config.llmModel,
});

// Create simulation orchestrator
const orchestrator = new SimulationOrchestrator(
  agentManager,
  decisionEngine,
  economyEngine,
  allianceManager,
  ledger,
  shadowMemory,
  {
    minCycleDelay: config.minCycleDelay,
    maxCycleDelay: config.maxCycleDelay,
    blockInterval: config.blockInterval,
  }
);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', createRoutes({ agentManager, economyEngine, ledger, orchestrator }));

// Error handling
app.use(errorHandler);

// Start server
const port = config.port;
const server = app.listen(port, () => {
  logger.info(`SHADOWNET server listening on port ${port}`);
  logger.info(`Health check: http://localhost:${port}/api/health`);
  logger.info(`API endpoints: http://localhost:${port}/api/`);
});

// Start simulation
logger.info('Starting simulation...');
orchestrator.start();
logger.info('Simulation started successfully');

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down SHADOWNET...');
  
  // Stop simulation
  orchestrator.stop();
  logger.info('Simulation stopped');
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});

logger.info('SHADOWNET initialized successfully');
