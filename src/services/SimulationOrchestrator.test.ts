/**
 * Unit tests for SimulationOrchestrator
 * Tests simulation lifecycle, action dispatching, and integration with services
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SimulationOrchestrator, SimulationConfig } from './SimulationOrchestrator.js';
import { AgentManager } from './AgentManager.js';
import { DecisionEngine } from './DecisionEngine.js';
import { EconomyEngine } from './EconomyEngine.js';
import { AllianceManager } from './AllianceManager.js';
import { Ledger } from './Ledger.js';
import { Decision } from '../models/types.js';

describe('SimulationOrchestrator', () => {
  let orchestrator: SimulationOrchestrator;
  let agentManager: AgentManager;
  let decisionEngine: DecisionEngine;
  let economyEngine: EconomyEngine;
  let allianceManager: AllianceManager;
  let ledger: Ledger;
  let config: SimulationConfig;

  beforeEach(() => {
    // Initialize services
    agentManager = new AgentManager();
    allianceManager = new AllianceManager();
    ledger = new Ledger();

    // Initialize agents
    agentManager.initializeAgents(3, 1000);

    // Create economy engine
    economyEngine = new EconomyEngine(agentManager);

    // Create mock decision engine
    decisionEngine = new DecisionEngine({
      provider: 'openai',
      apiKey: 'test-key',
    });

    // Mock the makeDecision method to avoid real API calls
    jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
      action: 'save',
      reasoning: 'Test decision',
    });

    // Create config
    config = {
      minCycleDelay: 100,
      maxCycleDelay: 200,
      blockInterval: 1000,
    };

    // Create orchestrator
    orchestrator = new SimulationOrchestrator(
      agentManager,
      decisionEngine,
      economyEngine,
      allianceManager,
      ledger,
      config
    );
  });

  afterEach(() => {
    // Stop simulation if running
    if (orchestrator.isSimulationRunning()) {
      orchestrator.stop();
    }
    jest.restoreAllMocks();
  });

  describe('start() and stop()', () => {
    it('should start the simulation', () => {
      orchestrator.start();
      expect(orchestrator.isSimulationRunning()).toBe(true);
    });

    it('should stop the simulation', () => {
      orchestrator.start();
      orchestrator.stop();
      expect(orchestrator.isSimulationRunning()).toBe(false);
    });

    it('should not start if already running', () => {
      orchestrator.start();
      orchestrator.start(); // Second start should be ignored
      expect(orchestrator.isSimulationRunning()).toBe(true);
    });

    it('should not stop if not running', () => {
      orchestrator.stop(); // Should not throw
      expect(orchestrator.isSimulationRunning()).toBe(false);
    });
  });

  describe('executeCycle()', () => {
    it('should process all agents in a cycle', async () => {
      const agents = agentManager.getAllAgents();

      // Clear any previous mock calls
      jest.mocked(decisionEngine.makeDecision).mockClear();

      orchestrator.start();

      // Wait for at least one cycle to complete (100-200ms cycle delay)
      await new Promise(resolve => setTimeout(resolve, 250));

      orchestrator.stop();

      // Verify makeDecision was called at least once for each agent
      // (may be called multiple times if multiple cycles ran)
      const callCount = jest.mocked(decisionEngine.makeDecision).mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(agents.length);
      
      // Verify it's a multiple of agent count (complete cycles)
      expect(callCount % agents.length).toBe(0);
    });

    it('should log actions to agent memory', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];
      const initialMemoryLength = agent.memory.length;

      orchestrator.start();

      // Wait for one cycle
      await new Promise(resolve => setTimeout(resolve, 300));

      orchestrator.stop();

      // Check that action was logged
      const updatedAgent = agentManager.getAgent(agent.id)!;
      expect(updatedAgent.memory.length).toBeGreaterThan(initialMemoryLength);
    });
  });

  describe('executeAgentAction() - save action', () => {
    it('should execute save action successfully', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      // Mock decision to return save action
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'save',
        reasoning: 'Saving money',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action was logged
      const updatedAgent = agentManager.getAgent(agent.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.action).toBe('save');
      expect(lastAction.outcome).toBe('success');
    });
  });

  describe('executeAgentAction() - transaction actions', () => {
    it('should execute trade_resources action', async () => {
      const agents = agentManager.getAllAgents();
      const agent1 = agents[0];
      const agent2 = agents[1];

      // Mock decision to trade
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'trade_resources',
        target: agent2.id,
        amount: 100,
        reasoning: 'Trading resources',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify transaction was created
      const transactions = economyEngine.getRecentTransactions(10);
      expect(transactions.length).toBeGreaterThan(0);

      // Verify transaction was added to ledger
      const pendingTxs = ledger.getPendingTransactions();
      expect(pendingTxs.length).toBeGreaterThan(0);
    });

    it('should handle missing target gracefully', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      // Mock decision with missing target
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'hire_agent',
        amount: 100,
        reasoning: 'Hiring agent',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action failed
      const updatedAgent = agentManager.getAgent(agent.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.outcome).toBe('failure');
    });

    it('should handle invalid target gracefully', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      // Mock decision with invalid target
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'trade_resources',
        target: 'invalid-id',
        amount: 100,
        reasoning: 'Trading with invalid agent',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action failed
      const updatedAgent = agentManager.getAgent(agent.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.outcome).toBe('failure');
    });
  });

  describe('executeAgentAction() - alliance actions', () => {
    it('should form alliance between agents', async () => {
      const agents = agentManager.getAllAgents();
      const agent1 = agents[0];
      const agent2 = agents[1];

      // Mock decision to form alliance
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'form_alliance',
        target: agent2.id,
        reasoning: 'Forming alliance',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify alliance was created
      expect(allianceManager.areAllied(agent1.id, agent2.id)).toBe(true);

      // Verify agents' alliance lists were updated
      const updatedAgent1 = agentManager.getAgent(agent1.id)!;
      expect(updatedAgent1.alliances.length).toBeGreaterThan(0);
    });

    it('should handle already allied agents', async () => {
      const agents = agentManager.getAllAgents();
      const agent1 = agents[0];
      const agent2 = agents[1];

      // Form alliance first
      const alliance = allianceManager.formAlliance(agent1.id, agent2.id);
      agentManager.updateAgent(agent1.id, {
        alliances: [alliance.id],
      });

      // Mock decision to form alliance again
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'form_alliance',
        target: agent2.id,
        reasoning: 'Forming alliance again',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action failed
      const updatedAgent = agentManager.getAgent(agent1.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.outcome).toBe('failure');
    });

    it('should betray alliance', async () => {
      const agents = agentManager.getAllAgents();
      const agent1 = agents[0];
      const agent2 = agents[1];

      // Form alliance first
      const alliance = allianceManager.formAlliance(agent1.id, agent2.id);
      agentManager.updateAgent(agent1.id, {
        alliances: [alliance.id],
      });

      // Mock decision to betray
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'betray_alliance',
        reasoning: 'Betraying alliance',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify alliance was broken
      const allianceData = allianceManager.getAgentAlliances(agent1.id)[0];
      expect(allianceData.active).toBe(false);

      // Verify betrayal was counted
      const updatedAgent = agentManager.getAgent(agent1.id)!;
      expect(updatedAgent.stats.betrayals).toBeGreaterThan(0);
    });

    it('should handle betray with no alliances', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      // Mock decision to betray (but agent has no alliances)
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'betray_alliance',
        reasoning: 'Betraying alliance',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action failed
      const updatedAgent = agentManager.getAgent(agent.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.outcome).toBe('failure');
    });
  });

  describe('executeAgentAction() - build_reputation', () => {
    it('should build reputation when agent has sufficient funds', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      // Mock decision to build reputation
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'build_reputation',
        reasoning: 'Building reputation',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action was attempted
      const updatedAgent = agentManager.getAgent(agent.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.action).toBe('build_reputation');
    });

    it('should fail build_reputation when agent has insufficient funds', async () => {
      const agents = agentManager.getAllAgents();
      const agent = agents[0];

      // Set agent wallet to low amount
      agentManager.updateAgent(agent.id, { wallet: 10 });

      // Mock decision to build reputation
      jest.spyOn(decisionEngine, 'makeDecision').mockResolvedValue({
        action: 'build_reputation',
        reasoning: 'Building reputation',
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify action failed
      const updatedAgent = agentManager.getAgent(agent.id)!;
      const lastAction = updatedAgent.memory[updatedAgent.memory.length - 1];
      expect(lastAction.outcome).toBe('failure');
    });
  });

  describe('block finalization', () => {
    it('should finalize blocks at regular intervals', async () => {
      orchestrator.start();

      // Wait for block interval
      await new Promise(resolve => setTimeout(resolve, 1100));

      orchestrator.stop();

      // Verify at least one block was finalized
      const blocks = ledger.getAllBlocks();
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('decision context building', () => {
    it('should include agent state in context', async () => {
      const agents = agentManager.getAllAgents();

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Verify makeDecision was called with proper context
      const calls = jest.mocked(decisionEngine.makeDecision).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const context = calls[0][0];
      expect(context.agent).toBeDefined();
      expect(context.otherAgents).toBeDefined();
      expect(context.recentActivity).toBeDefined();
      expect(context.availableActions).toBeDefined();
      expect(context.economicState).toBeDefined();
    });

    it('should include other agents in context', async () => {
      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      const calls = jest.mocked(decisionEngine.makeDecision).mock.calls;
      const context = calls[0][0];

      // Should have other agents (excluding self)
      expect(context.otherAgents.length).toBeGreaterThan(0);
      expect(context.otherAgents.length).toBeLessThanOrEqual(5);
    });

    it('should include economic state in context', async () => {
      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      const calls = jest.mocked(decisionEngine.makeDecision).mock.calls;
      const context = calls[0][0];

      expect(context.economicState.averageWealth).toBeGreaterThan(0);
      expect(context.economicState.averageReputation).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should continue processing other agents if one fails', async () => {
      const agents = agentManager.getAllAgents();

      // Mock decision to throw error for first call, then succeed
      let callCount = 0;
      jest.mocked(decisionEngine.makeDecision).mockClear();
      jest.mocked(decisionEngine.makeDecision).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Test error');
        }
        return {
          action: 'save',
          reasoning: 'Test decision',
        };
      });

      orchestrator.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      orchestrator.stop();

      // Should have attempted all agents despite first failure
      expect(callCount).toBe(agents.length);
    });
  });
});
