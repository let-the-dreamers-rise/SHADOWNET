# SHADOWNET Architecture

## System Overview

SHADOWNET is a full-stack autonomous multi-agent economy simulator with a Node.js backend and React frontend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    (React + TypeScript)                      │
├─────────────────────────────────────────────────────────────┤
│  Dashboard Component                                         │
│  ├── StatsPanel (aggregate statistics)                      │
│  ├── AgentsTable (all agents with balances)                 │
│  ├── ActivityFeed (live transaction feed)                   │
│  └── Leaderboards (richest, trusted, active)                │
│                                                              │
│  API Client (axios with retry logic)                        │
│  └── 3-second polling for real-time updates                 │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│                  (Node.js + Express + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│  REST API Layer                                              │
│  ├── GET /api/agents                                         │
│  ├── GET /api/activity                                       │
│  ├── GET /api/leaderboards                                   │
│  ├── GET /api/stats                                          │
│  └── GET /health                                             │
├─────────────────────────────────────────────────────────────┤
│  SimulationOrchestrator                                      │
│  ├── Decision cycle (5-10 seconds)                          │
│  ├── Block finalization (30 seconds)                        │
│  └── Action execution                                        │
├─────────────────────────────────────────────────────────────┤
│  Core Services                                               │
│  ├── AgentManager (agent state, leaderboards)               │
│  ├── DecisionEngine (LLM integration)                       │
│  ├── EconomyEngine (transactions, reputation)               │
│  ├── AllianceManager (alliances, betrayals)                 │
│  └── Ledger (blockchain-style transaction log)              │
└─────────────────────────────────────────────────────────────┘
                            ↕ API Calls
┌─────────────────────────────────────────────────────────────┐
│                      LLM PROVIDER                            │
│                  (OpenAI or Gemini)                          │
│  └── Agent decision-making via structured prompts           │
└─────────────────────────────────────────────────────────────┘
```

## Backend Components

### 1. SimulationOrchestrator
**Purpose**: Coordinates the entire simulation lifecycle

**Responsibilities**:
- Starts/stops the simulation
- Executes decision cycles every 5-10 seconds
- Finalizes blocks every 30 seconds
- Dispatches agent actions to appropriate services

**Key Methods**:
- `start()`: Begin simulation
- `stop()`: Halt simulation
- `executeCycle()`: Process all agents
- `executeAgentAction()`: Dispatch actions

### 2. AgentManager
**Purpose**: Manages agent state and metadata

**Responsibilities**:
- Initialize agents with unique identities
- Track agent wallet balances
- Track agent reputation scores
- Maintain action logs
- Generate leaderboards

**Key Methods**:
- `initializeAgents()`: Create initial agent population
- `getAgent()`: Retrieve agent by ID
- `updateAgent()`: Update agent state
- `logAction()`: Record agent action
- `getLeaderboard()`: Get ranked agents

### 3. DecisionEngine
**Purpose**: Integrates with LLM for agent decision-making

**Responsibilities**:
- Build context-aware prompts
- Call LLM API (OpenAI or Gemini)
- Parse structured JSON responses
- Handle API failures with retry logic
- Provide fallback decisions

**Key Methods**:
- `makeDecision()`: Get agent decision from LLM
- `buildPrompt()`: Create decision prompt
- `parseResponse()`: Extract structured decision
- `retryWithBackoff()`: Retry failed API calls
- `getFallbackDecision()`: Safe default action

### 4. EconomyEngine
**Purpose**: Manages economic transactions and reputation

**Responsibilities**:
- Validate transactions
- Calculate success probabilities
- Transfer credits atomically
- Update reputation scores
- Handle transaction failures

**Key Methods**:
- `processTransaction()`: Execute transaction
- `validateTransaction()`: Check validity
- `calculateSuccessProbability()`: Compute success chance
- `transferCredits()`: Move credits between agents
- `updateReputations()`: Adjust reputation scores

**Correctness Properties**:
- Credit conservation (total supply constant)
- Reputation bounds (0-100)
- Transaction atomicity (all-or-nothing)
- Probabilistic fairness

### 5. AllianceManager
**Purpose**: Manages agent alliances and betrayals

**Responsibilities**:
- Form alliances between agents
- Break alliances (betrayal)
- Track alliance status
- Query alliance relationships

**Key Methods**:
- `formAlliance()`: Create alliance
- `breakAlliance()`: End alliance
- `areAllied()`: Check alliance status
- `getAgentAlliances()`: Get agent's alliances

### 6. Ledger
**Purpose**: Blockchain-style transaction logging

**Responsibilities**:
- Record all transactions
- Organize transactions into blocks
- Maintain immutable history
- Provide transaction queries

**Key Methods**:
- `addTransaction()`: Add to pending pool
- `finalizeBlock()`: Create new block
- `getTransactionsByAgent()`: Query by agent
- `getRecentBlocks()`: Get recent history

**Correctness Properties**:
- Block sequentiality (monotonic block numbers)
- Immutability (append-only)
- Completeness (all transactions recorded)

## Frontend Components

### 1. Dashboard (Container)
**Purpose**: Main application container

**Responsibilities**:
- Fetch data from all API endpoints
- Manage application state
- Handle polling (3-second interval)
- Display loading/error states
- Compose child components

### 2. StatsPanel
**Purpose**: Display aggregate statistics

**Data**:
- Total agents
- Total credits
- Average reputation
- Total transactions
- Active alliances

### 3. AgentsTable
**Purpose**: Display all agent states

**Data**:
- Agent name
- Wallet balance
- Reputation score
- Role
- Personality

**Features**:
- Sorted by wallet balance
- Scrollable
- Color-coded values

### 4. ActivityFeed
**Purpose**: Live transaction feed

**Data**:
- Transaction details
- Success/failure status
- Timestamp
- Action type

**Features**:
- Reverse chronological order
- Animated new entries
- Color-coded success/failure
- Limited to 50 entries

### 5. Leaderboards
**Purpose**: Display top agents

**Data**:
- Richest agents (by wallet)
- Most trusted (by reputation)
- Most active (by action count)

**Features**:
- Top 10 per category
- Rank numbers
- Color-coded values

## Data Flow

### Decision Cycle Flow
```
1. SimulationOrchestrator.executeCycle()
   ↓
2. For each agent:
   a. DecisionEngine.makeDecision()
      → LLM API call
      → Parse JSON response
   b. SimulationOrchestrator.executeAgentAction()
      → Dispatch to appropriate service
   c. Update agent state
   d. Log transaction to Ledger
   ↓
3. Schedule next cycle (5-10 seconds)
```

### Transaction Flow
```
1. Agent decides to transact
   ↓
2. EconomyEngine.processTransaction()
   a. validateTransaction() - check balances
   b. calculateSuccessProbability() - based on reputation
   c. Random roll against probability
   d. If success:
      - transferCredits() - atomic update
      - updateReputations() - adjust scores
   e. If failure:
      - Rollback (no credit transfer)
      - updateReputations() - adjust scores
   ↓
3. Ledger.addTransaction() - record result
   ↓
4. AgentManager.logAction() - update agent log
```

### API Request Flow
```
1. Frontend component needs data
   ↓
2. API client makes HTTP request
   ↓
3. Express route handler
   ↓
4. Service method call
   ↓
5. Return data
   ↓
6. Frontend updates state
   ↓
7. React re-renders components
```

## Testing Strategy

### Property-Based Testing (22 properties)
- Agent initialization completeness
- Action logging consistency
- Decision context completeness
- Transaction validation
- Credit conservation
- Probability bounds
- Probabilistic fairness
- Failed transaction rollback
- Transaction recording
- Reputation bounds
- Reputation change bounds
- Reputation influence
- Alliance formation
- Alliance betrayal
- Multiple alliances
- Block sequentiality
- Ledger immutability
- Query correctness
- Leaderboard sorting
- Activity feed ordering
- Agent diversity
- Credit supply conservation

### Unit Testing
- Edge cases
- Error handling
- Configuration validation
- API endpoint responses
- Component rendering

### Integration Testing
- Full simulation cycles
- Action dispatching
- Service interactions
- API endpoint integration

## Configuration

### Backend Environment Variables
```
LLM_PROVIDER=openai|gemini
LLM_API_KEY=your_key
AGENT_COUNT=15
INITIAL_BALANCE=1000
DECISION_CYCLE_MIN=5000
DECISION_CYCLE_MAX=10000
BLOCK_INTERVAL=30000
PORT=3000
LOG_LEVEL=info
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables
```
VITE_API_URL=http://localhost:3000/api
```

## Deployment

### Backend (Render)
- Build: `npm install && npm run build`
- Start: `npm start`
- Environment: Set all backend env vars

### Frontend (Vercel)
- Build: `npm run build`
- Output: `dist/`
- Environment: Set `VITE_API_URL`

## Performance Characteristics

- **Decision Cycle**: 5-10 seconds per cycle
- **Block Finalization**: 30 seconds
- **Frontend Polling**: 3 seconds
- **API Response Time**: <100ms (typical)
- **Concurrent Agents**: 12-20 (configurable)
- **Transaction Throughput**: ~2-4 per cycle
- **Memory Usage**: ~100MB (backend)

## Scalability Considerations

### Current Limitations
- In-memory storage (no persistence)
- Single-threaded simulation
- Polling-based updates (not WebSockets)
- LLM API rate limits

### Future Enhancements
- Database persistence (PostgreSQL)
- WebSocket for real-time updates
- Multi-threaded agent processing
- Caching layer for API responses
- Horizontal scaling with load balancer
- Message queue for async processing

## Security Considerations

- API key stored in environment variables
- CORS configured for frontend origin
- Input validation on all endpoints
- Rate limiting (future enhancement)
- Authentication (future enhancement)

---

**Last Updated**: 2024
**Version**: 1.0.0
