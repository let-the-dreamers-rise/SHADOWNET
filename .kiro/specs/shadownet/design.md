# Design Document: SHADOWNET

## Overview

SHADOWNET is an autonomous multi-agent economy simulator built with a modular Node.js backend and React frontend. The system orchestrates 12-20 AI agents that make independent decisions using LLM APIs, transact with simulated currency, form alliances, and compete for wealth and reputation. The architecture emphasizes clean separation of concerns, real-time data flow, and production-ready code quality suitable for a high-impact hackathon demonstration.

The system consists of five core subsystems:
1. **Agent System**: Manages agent state, identity, and lifecycle
2. **Decision Engine**: Integrates with LLM APIs to generate autonomous agent decisions
3. **Economy Engine**: Handles transactions, wallets, and economic rules
4. **Ledger System**: Records transactions in blockchain-style blocks
5. **Dashboard API & Frontend**: Provides real-time visualization of simulation state

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Agents  │ │ Activity │ │Leaderboard│ │Network Graph │  │
│  │  Table   │ │   Feed   │ │  Panels   │ │  (Optional)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    API Layer                          │  │
│  │  /api/agents  /api/activity  /api/leaderboards       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Simulation Orchestrator                  │  │
│  │  - Decision cycle scheduler (5-10s intervals)        │  │
│  │  - Agent action dispatcher                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Agent     │  │   Decision   │  │    Economy      │   │
│  │   System    │  │    Engine    │  │    Engine       │   │
│  │             │  │              │  │                 │   │
│  │ - State     │  │ - LLM API    │  │ - Transactions  │   │
│  │ - Memory    │  │ - Prompt     │  │ - Wallets       │   │
│  │ - Actions   │  │   Builder    │  │ - Reputation    │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Ledger System                        │  │
│  │  - Transaction log                                    │  │
│  │  - Block formation                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  LLM API     │
                    │ (OpenAI/     │
                    │  Gemini)     │
                    └──────────────┘
```

### Technology Stack

**Backend:**
- Node.js 18+ with ES modules
- Express.js for REST API
- Axios for LLM API calls
- Winston for logging
- dotenv for configuration

**Frontend:**
- React 18 with functional components and hooks
- Axios for API calls
- CSS modules or styled-components for dark theme
- Optional: D3.js or vis.js for network graph

**Deployment:**
- Backend: Render (Node.js service)
- Frontend: Vercel (static site)
- Environment variables for API keys

## Components and Interfaces

### 1. Agent System

**Agent Data Model:**
```typescript
interface Agent {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Human-readable name
  personality: 'greedy' | 'loyal' | 'chaotic' | 'strategic';
  role: 'broker' | 'trader' | 'researcher' | 'fixer';
  wallet: number;                // Current credit balance
  reputation: number;            // Score 0-100
  memory: ActionLog[];           // History of actions
  alliances: string[];           // Array of allied agent IDs
  createdAt: number;             // Timestamp
  stats: {
    transactionCount: number;
    successfulDeals: number;
    failedDeals: number;
    betrayals: number;
  };
}

interface ActionLog {
  timestamp: number;
  action: ActionType;
  details: Record<string, any>;
  outcome: 'success' | 'failure';
}

type ActionType = 
  | 'hire_agent'
  | 'trade_resources'
  | 'form_alliance'
  | 'risky_deal'
  | 'invest'
  | 'save'
  | 'betray_alliance'
  | 'build_reputation';
```

**AgentManager Class:**
```typescript
class AgentManager {
  private agents: Map<string, Agent>;
  
  // Initialize agents with diverse personalities and roles
  initializeAgents(count: number, initialBalance: number): void;
  
  // Get agent by ID
  getAgent(id: string): Agent | undefined;
  
  // Get all agents
  getAllAgents(): Agent[];
  
  // Update agent state
  updateAgent(id: string, updates: Partial<Agent>): void;
  
  // Add action to agent's memory
  logAction(agentId: string, action: ActionLog): void;
  
  // Get agents sorted by criteria
  getLeaderboard(criteria: 'wallet' | 'reputation' | 'activity', limit: number): Agent[];
}
```

### 2. Decision Engine

**Decision Context:**
```typescript
interface DecisionContext {
  agent: Agent;                  // Current agent state
  otherAgents: Agent[];          // Visible other agents (sample)
  recentActivity: Transaction[]; // Recent transactions
  availableActions: ActionType[];
  economicState: {
    averageWealth: number;
    averageReputation: number;
  };
}

interface Decision {
  action: ActionType;
  target?: string;               // Target agent ID (for interactions)
  amount?: number;               // Credit amount (for transactions)
  reasoning?: string;            // LLM's explanation
}
```

**LLM Integration:**
```typescript
class DecisionEngine {
  private llmProvider: 'openai' | 'gemini';
  private apiKey: string;
  
  // Generate decision for an agent
  async makeDecision(context: DecisionContext): Promise<Decision>;
  
  // Build prompt for LLM
  private buildPrompt(context: DecisionContext): string;
  
  // Parse LLM response into structured decision
  private parseResponse(response: string): Decision;
  
  // Retry logic with exponential backoff
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T>;
}
```

**Prompt Template:**
The prompt will include:
- Agent's personality and role
- Current wallet and reputation
- Recent actions from memory
- Available other agents and their reputations
- Available actions with descriptions
- Request for JSON response with action, target, amount, reasoning

### 3. Economy Engine

**Transaction Model:**
```typescript
interface Transaction {
  id: string;
  from: string;                  // Agent ID
  to: string;                    // Agent ID
  amount: number;
  actionType: ActionType;
  timestamp: number;
  success: boolean;
  probability: number;           // Success probability (0-1)
  blockNumber?: number;          // Assigned when added to block
}
```

**EconomyEngine Class:**
```typescript
class EconomyEngine {
  private agentManager: AgentManager;
  private transactionLog: Transaction[];
  
  // Process a transaction between agents
  async processTransaction(
    from: string,
    to: string,
    amount: number,
    actionType: ActionType
  ): Promise<Transaction>;
  
  // Calculate success probability based on reputations
  private calculateSuccessProbability(
    fromAgent: Agent,
    toAgent: Agent,
    actionType: ActionType
  ): number;
  
  // Execute wallet transfer atomically
  private transferCredits(from: string, to: string, amount: number): void;
  
  // Update reputation based on transaction outcome
  private updateReputations(
    transaction: Transaction,
    fromAgent: Agent,
    toAgent: Agent
  ): void;
  
  // Get recent transactions
  getRecentTransactions(limit: number): Transaction[];
}
```

**Reputation Update Rules:**
- Successful transaction: +1 to +5 reputation for both parties
- Failed transaction: -2 to -10 reputation for initiator
- Betrayal: -15 to -25 reputation for betrayer
- Build reputation action: +3 to +8 reputation

**Success Probability Formula:**
```
baseProbability = 0.7
reputationBonus = (fromRep + toRep) / 200 * 0.2
actionModifier = {
  'risky_deal': -0.3,
  'trade_resources': 0.1,
  'hire_agent': 0.0,
  // ... other actions
}
finalProbability = clamp(baseProbability + reputationBonus + actionModifier, 0.1, 0.95)
```

### 4. Alliance System

**Alliance Model:**
```typescript
interface Alliance {
  id: string;
  members: string[];             // Agent IDs
  formedAt: number;
  active: boolean;
}
```

**AllianceManager Class:**
```typescript
class AllianceManager {
  private alliances: Map<string, Alliance>;
  
  // Form alliance between agents
  formAlliance(agentId1: string, agentId2: string): Alliance;
  
  // Break alliance (betrayal)
  breakAlliance(allianceId: string, betrayerId: string): void;
  
  // Check if agents are allied
  areAllied(agentId1: string, agentId2: string): boolean;
  
  // Get all alliances for an agent
  getAgentAlliances(agentId: string): Alliance[];
}
```

### 5. Ledger System

**Block Model:**
```typescript
interface Block {
  blockNumber: number;
  timestamp: number;
  transactions: Transaction[];
  transactionCount: number;
}
```

**Ledger Class:**
```typescript
class Ledger {
  private blocks: Block[];
  private pendingTransactions: Transaction[];
  private currentBlockNumber: number;
  
  // Add transaction to pending pool
  addTransaction(transaction: Transaction): void;
  
  // Finalize current block (called every 30 seconds)
  finalizeBlock(): Block;
  
  // Query transactions by agent
  getTransactionsByAgent(agentId: string): Transaction[];
  
  // Query transactions by block
  getBlock(blockNumber: number): Block | undefined;
  
  // Get recent blocks
  getRecentBlocks(limit: number): Block[];
}
```

### 6. Simulation Orchestrator

**Orchestrator Class:**
```typescript
class SimulationOrchestrator {
  private agentManager: AgentManager;
  private decisionEngine: DecisionEngine;
  private economyEngine: EconomyEngine;
  private allianceManager: AllianceManager;
  private ledger: Ledger;
  private isRunning: boolean;
  
  // Start simulation
  start(): void;
  
  // Stop simulation
  stop(): void;
  
  // Execute one decision cycle for all agents
  private async executeCycle(): Promise<void>;
  
  // Execute action for a single agent
  private async executeAgentAction(agent: Agent, decision: Decision): Promise<void>;
  
  // Schedule next cycle
  private scheduleNextCycle(): void;
}
```

**Decision Cycle Flow:**
1. For each agent, gather decision context
2. Call DecisionEngine to get LLM decision
3. Validate decision (check wallet balance, target exists, etc.)
4. Execute action through appropriate system (Economy, Alliance, etc.)
5. Log action to agent's memory
6. Update agent statistics
7. Add transaction to ledger if applicable
8. Schedule next cycle after random delay (5-10 seconds)

### 7. API Layer

**Express Routes:**
```typescript
// GET /api/agents - Return all agent states
router.get('/agents', (req, res) => {
  const agents = agentManager.getAllAgents();
  res.json(agents);
});

// GET /api/activity - Return recent activity
router.get('/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const transactions = economyEngine.getRecentTransactions(limit);
  res.json(transactions);
});

// GET /api/leaderboards - Return all leaderboards
router.get('/leaderboards', (req, res) => {
  const richest = agentManager.getLeaderboard('wallet', 10);
  const mostTrusted = agentManager.getLeaderboard('reputation', 10);
  const mostActive = agentManager.getLeaderboard('activity', 10);
  res.json({ richest, mostTrusted, mostActive });
});

// GET /api/ledger - Return recent blocks
router.get('/ledger', (req, res) => {
  const blocks = ledger.getRecentBlocks(10);
  res.json(blocks);
});

// GET /api/stats - Return aggregate statistics
router.get('/stats', (req, res) => {
  const agents = agentManager.getAllAgents();
  const stats = {
    totalAgents: agents.length,
    totalCredits: agents.reduce((sum, a) => sum + a.wallet, 0),
    averageReputation: agents.reduce((sum, a) => sum + a.reputation, 0) / agents.length,
    totalTransactions: ledger.getTotalTransactionCount(),
    activeAlliances: allianceManager.getActiveAllianceCount()
  };
  res.json(stats);
});

// GET /health - Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

### 8. Frontend Components

**Component Structure:**
```
src/
├── components/
│   ├── AgentsTable.jsx        // Display all agents
│   ├── ActivityFeed.jsx       // Live transaction feed
│   ├── Leaderboards.jsx       // Three leaderboard panels
│   ├── NetworkGraph.jsx       // Optional: agent interaction graph
│   ├── StatsPanel.jsx         // Aggregate statistics
│   └── Dashboard.jsx          // Main container
├── services/
│   └── api.js                 // API client
├── styles/
│   └── theme.css              // Dark futuristic theme
└── App.jsx
```

**Dashboard Component:**
```jsx
function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    // Fetch initial data
    fetchAllData();
    
    // Set up polling interval (3 seconds)
    const interval = setInterval(fetchAllData, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchAllData = async () => {
    const [agentsData, activityData, leaderboardsData, statsData] = 
      await Promise.all([
        api.getAgents(),
        api.getActivity(),
        api.getLeaderboards(),
        api.getStats()
      ]);
    
    setAgents(agentsData);
    setActivity(activityData);
    setLeaderboards(leaderboardsData);
    setStats(statsData);
  };
  
  return (
    <div className="dashboard">
      <header>
        <h1>SHADOWNET</h1>
        <StatsPanel stats={stats} />
      </header>
      <div className="grid">
        <AgentsTable agents={agents} />
        <ActivityFeed activity={activity} />
        <Leaderboards data={leaderboards} />
      </div>
    </div>
  );
}
```

**Dark Futuristic Theme:**
```css
:root {
  --bg-primary: #0a0e27;
  --bg-secondary: #151932;
  --bg-tertiary: #1e2139;
  --accent-cyan: #00f0ff;
  --accent-purple: #b026ff;
  --accent-green: #00ff88;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border: #2a2f4a;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
}

.dashboard {
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
}

.panel h2 {
  color: var(--accent-cyan);
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 2px;
  margin-bottom: 15px;
}

/* Animated new activity entries */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.activity-item.new {
  animation: slideIn 0.3s ease-out;
  border-left: 3px solid var(--accent-green);
}
```

## Data Models

### Agent Initialization

**Personality Traits:**
- **Greedy**: Prioritizes wealth accumulation, takes more risks, less loyal
- **Loyal**: Values alliances, less likely to betray, moderate risk
- **Chaotic**: Unpredictable actions, high variance in decisions
- **Strategic**: Calculated decisions, balances risk and reward

**Role Behaviors:**
- **Broker**: Facilitates deals between other agents, earns commissions
- **Trader**: Focuses on resource exchanges, frequent transactions
- **Researcher**: Invests in long-term gains, builds reputation
- **Fixer**: Handles risky deals, higher risk tolerance

**Initial Distribution:**
```typescript
const PERSONALITIES = ['greedy', 'loyal', 'chaotic', 'strategic'];
const ROLES = ['broker', 'trader', 'researcher', 'fixer'];

function generateAgents(count: number, initialBalance: number): Agent[] {
  const agents: Agent[] = [];
  const names = generateUniqueNames(count); // From name generator
  
  for (let i = 0; i < count; i++) {
    agents.push({
      id: generateUUID(),
      name: names[i],
      personality: PERSONALITIES[i % PERSONALITIES.length],
      role: ROLES[i % ROLES.length],
      wallet: initialBalance + randomInt(-100, 100),
      reputation: randomInt(40, 60),
      memory: [],
      alliances: [],
      createdAt: Date.now(),
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
```

### Configuration Schema

**Environment Variables:**
```
# Required
LLM_PROVIDER=openai          # or 'gemini'
LLM_API_KEY=sk-...           # API key for chosen provider

# Optional with defaults
AGENT_COUNT=15               # Number of agents (12-20)
INITIAL_BALANCE=1000         # Starting credits per agent
DECISION_CYCLE_MIN=5000      # Min cycle time (ms)
DECISION_CYCLE_MAX=10000     # Max cycle time (ms)
BLOCK_INTERVAL=30000         # Block finalization interval (ms)
PORT=3000                    # Server port
LOG_LEVEL=info               # Logging level
FRONTEND_URL=http://localhost:5173  # For CORS
```

## Error Handling

### LLM API Failures

**Retry Strategy:**
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Fallback Decision:**
When all retries fail, use a safe default action:
```typescript
function getFallbackDecision(agent: Agent): Decision {
  return {
    action: 'save',
    reasoning: 'LLM unavailable, defaulting to safe action'
  };
}
```

### Transaction Validation

**Pre-flight Checks:**
```typescript
function validateTransaction(from: Agent, to: Agent, amount: number): ValidationResult {
  const errors: string[] = [];
  
  if (from.wallet < amount) {
    errors.push('Insufficient funds');
  }
  
  if (amount <= 0) {
    errors.push('Amount must be positive');
  }
  
  if (from.id === to.id) {
    errors.push('Cannot transact with self');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### API Error Responses

**Standard Error Format:**
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  timestamp: number;
  path?: string;
}

// Example usage
app.use((err, req, res, next) => {
  logger.error('API Error:', err);
  
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    timestamp: Date.now(),
    path: req.path
  });
});
```

### Graceful Degradation

**When LLM is unavailable:**
- Agents default to 'save' action
- System continues running with reduced functionality
- Dashboard shows warning indicator

**When frontend loses connection:**
- Display "Connection Lost" overlay
- Retry connection automatically
- Queue failed requests for retry

## Testing Strategy

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage and correctness.

**Unit Testing:**
- Focus on specific examples, edge cases, and integration points
- Test error conditions and boundary cases
- Verify component interactions

**Property-Based Testing:**
- Verify universal properties across randomized inputs
- Run minimum 100 iterations per property test
- Each test references its design document property
- Tag format: **Feature: shadownet, Property {number}: {property_text}**

**Testing Framework:**
- Jest for unit and property tests
- fast-check for property-based testing (JavaScript/TypeScript)
- Supertest for API endpoint testing

**Test Organization:**
```
tests/
├── unit/
│   ├── agent-manager.test.js
│   ├── economy-engine.test.js
│   ├── decision-engine.test.js
│   ├── alliance-manager.test.js
│   └── ledger.test.js
├── property/
│   ├── transaction-properties.test.js
│   ├── reputation-properties.test.js
│   ├── alliance-properties.test.js
│   └── ledger-properties.test.js
├── integration/
│   ├── api-endpoints.test.js
│   └── simulation-flow.test.js
└── fixtures/
    └── test-data.js
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Agent Initialization Completeness

*For any* agent created by the system, the agent must have all required fields populated with valid values: a unique non-empty name, a personality from the valid set (greedy/loyal/chaotic/strategic), a role from the valid set (broker/trader/researcher/fixer), a non-negative wallet balance, a reputation score between 0 and 100, and an initialized (possibly empty) memory log.

**Validates: Requirements 1.2, 1.3**

### Property 2: Action Logging Consistency

*For any* action performed by an agent, the action must appear in the agent's memory log with a timestamp, and the timestamp must be greater than or equal to the agent's creation timestamp.

**Validates: Requirements 1.4**

### Property 3: Decision Context Completeness

*For any* agent undergoing a decision cycle, the decision context provided to the LLM engine must include the agent's current state, a list of available actions, and information about other agents in the system.

**Validates: Requirements 2.2**

### Property 4: Transaction Validation

*For any* transaction attempt, if the sender's wallet balance is less than the transaction amount, the transaction must be rejected and no wallet balances should change.

**Validates: Requirements 3.1, 3.2**

### Property 5: Credit Conservation

*For any* successful transaction between two agents, the sum of all agent wallet balances in the system must remain constant (credits are neither created nor destroyed).

**Validates: Requirements 3.3**

### Property 6: Transaction Probability Bounds

*For any* transaction, the calculated success probability must be a value between 0.0 and 1.0 inclusive.

**Validates: Requirements 3.4**

### Property 7: Probabilistic Transaction Fairness

*For any* transaction with a given success probability p, when executed many times (n ≥ 100) with the same parameters, the observed success rate should converge toward p within a reasonable tolerance (±10%).

**Validates: Requirements 3.5**

### Property 8: Failed Transaction Rollback

*For any* transaction that fails (either due to validation or probabilistic failure), the wallet balances of both the sender and receiver must remain unchanged from their pre-transaction values.

**Validates: Requirements 3.6**

### Property 9: Transaction Recording Completeness

*For any* transaction attempt (successful or failed), a corresponding transaction record must exist in the ledger with all required fields: from_agent, to_agent, amount, action_type, timestamp, success_status, and eventually a block_number.

**Validates: Requirements 3.7, 6.1**

### Property 10: Reputation Bounds Invariant

*For any* sequence of actions and transactions performed by an agent, the agent's reputation score must always remain within the bounds [0, 100] inclusive.

**Validates: Requirements 4.6**

### Property 11: Reputation Change Bounds

*For any* action that modifies reputation (successful transaction, failed transaction, betrayal, build_reputation), the change in reputation must fall within the specified range for that action type:
- Successful transaction: +1 to +5
- Failed transaction: -2 to -10
- Betrayal: -15 to -25
- Build reputation: +3 to +8

**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

### Property 12: Reputation Influences Probability

*For any* two otherwise identical transactions where the agents in transaction A have higher combined reputation than the agents in transaction B, transaction A must have a success probability greater than or equal to transaction B.

**Validates: Requirements 4.7**

### Property 13: Alliance Formation Creates Record

*For any* two agents executing a form_alliance action, an alliance record must be created that includes both agent IDs and a formation timestamp.

**Validates: Requirements 5.1, 5.2**

### Property 14: Alliance Betrayal Removes Record

*For any* active alliance, when one member executes a betray_alliance action, the alliance record must be removed (marked inactive or deleted) and the betraying agent's reputation must decrease by 15 to 25 points.

**Validates: Requirements 5.3, 5.4**

### Property 15: Multiple Alliance Support

*For any* agent, the agent must be able to form multiple simultaneous alliances without any alliance formation failing due to existing alliances.

**Validates: Requirements 5.6**

### Property 16: Block Number Sequentiality

*For any* sequence of finalized blocks in the ledger, the block numbers must be strictly increasing and sequential (no gaps or duplicates).

**Validates: Requirements 6.3**

### Property 17: Ledger Immutability

*For any* transaction added to the ledger, the transaction record must never be modified or removed in subsequent operations (append-only property).

**Validates: Requirements 6.4**

### Property 18: Ledger Query Correctness

*For any* query to the ledger (by agent, by block, or by time range), all returned transactions must satisfy the query filter criteria, and no transactions matching the criteria should be omitted.

**Validates: Requirements 6.5**

### Property 19: Leaderboard Sorting Correctness

*For any* leaderboard query (by wallet, reputation, or activity), the returned agents must be sorted in descending order by the specified criterion, and if a limit is specified, at most that many agents should be returned.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 20: Activity Feed Chronological Order

*For any* activity feed query, the returned transactions and actions must be ordered by timestamp in descending order (most recent first).

**Validates: Requirements 8.2**

### Property 21: Agent Diversity at Initialization

*For any* system initialization with n agents where n ≥ 12, the agents must include at least 2 different personality types and at least 2 different role types (ensuring diversity).

**Validates: Requirements 10.5**

### Property 22: Credit Supply Conservation at Initialization

*For any* system initialization with a configured total credit supply S, the sum of all agent wallet balances must equal S (within rounding tolerance).

**Validates: Requirements 10.6**

