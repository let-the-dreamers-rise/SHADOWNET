# Requirements Document

## Introduction

SHADOWNET is an autonomous multi-agent shadow economy simulator designed as a production-ready hackathon project. The system simulates a low-trust digital economy where 12-20 AI agents with unique identities operate autonomously, making independent decisions using LLMs, transacting with simulated currency, forming alliances, and competing for wealth and reputation. The project demonstrates advanced multi-agent coordination, economic simulation, and real-time visualization in a compelling dark futuristic interface.

## Glossary

- **Agent**: An autonomous AI entity with unique identity, personality, role, wallet, reputation, and decision-making capabilities
- **System**: The SHADOWNET multi-agent economy simulator
- **LLM_Engine**: The language model integration component (OpenAI/Gemini) that powers agent decision-making
- **Economy_Engine**: The component managing currency, transactions, wallets, and economic rules
- **Ledger**: The blockchain-style transaction recording system
- **Dashboard**: The live web interface displaying agent activity and system state
- **Credits**: The simulated currency used for transactions between agents
- **Reputation_Score**: A numeric value representing an agent's trustworthiness (0-100)
- **Alliance**: A cooperative relationship between two or more agents
- **Transaction**: A transfer of credits between agents with associated metadata
- **Block**: A grouped collection of transactions in the ledger
- **Decision_Cycle**: The 5-10 second interval during which agents evaluate and execute actions

## Requirements

### Requirement 1: Agent Identity and State Management

**User Story:** As a system operator, I want each agent to have a persistent identity and state, so that agents can build history and reputation over time.

#### Acceptance Criteria

1. THE System SHALL create between 12 and 20 unique agents at initialization
2. WHEN an agent is created, THE System SHALL assign it a unique name, personality type (greedy/loyal/chaotic/strategic), role (broker/trader/researcher/fixer), initial wallet balance, initial reputation score, and empty memory log
3. THE System SHALL maintain each agent's state including current wallet balance, current reputation score, transaction history, and action log
4. WHEN an agent performs an action, THE System SHALL append the action to the agent's memory log with timestamp
5. THE System SHALL persist agent state throughout the simulation runtime

### Requirement 2: Autonomous Agent Decision-Making

**User Story:** As a system operator, I want agents to make autonomous decisions using AI, so that the simulation exhibits emergent and unpredictable behavior.

#### Acceptance Criteria

1. THE System SHALL execute a decision cycle for each agent every 5 to 10 seconds
2. WHEN a decision cycle executes, THE LLM_Engine SHALL receive the agent's current state, available actions, and context about other agents
3. THE LLM_Engine SHALL return a structured JSON decision containing the chosen action and required parameters
4. THE System SHALL support these action types: hire_agent, trade_resources, form_alliance, risky_deal, invest, save, betray_alliance, build_reputation
5. WHEN an LLM request fails, THE System SHALL log the error and retry with exponential backoff up to 3 attempts
6. IF all retry attempts fail, THEN THE System SHALL default the agent to a safe action (save money)

### Requirement 3: Economic Transaction Processing

**User Story:** As a system operator, I want a robust transaction system, so that agents can exchange value reliably and transparently.

#### Acceptance Criteria

1. WHEN an agent initiates a transaction, THE Economy_Engine SHALL validate that the sender has sufficient credits
2. IF the sender has insufficient credits, THEN THE Economy_Engine SHALL reject the transaction and return an error
3. WHEN a valid transaction is processed, THE Economy_Engine SHALL atomically deduct credits from the sender's wallet and add credits to the receiver's wallet
4. THE Economy_Engine SHALL assign each transaction a success probability based on agent reputations and action type
5. WHEN a transaction has a success probability less than 100%, THE Economy_Engine SHALL use random number generation to determine success or failure
6. WHEN a transaction fails probabilistically, THE Economy_Engine SHALL reverse any wallet changes and apply reputation penalties
7. THE Economy_Engine SHALL record every transaction attempt (successful or failed) in the transaction log

### Requirement 4: Reputation System

**User Story:** As a system operator, I want agents to build or lose reputation based on their actions, so that trust becomes a valuable resource in the economy.

#### Acceptance Criteria

1. THE System SHALL initialize each agent with a reputation score between 40 and 60
2. WHEN an agent completes a successful transaction, THE System SHALL increase the agent's reputation by 1 to 5 points
3. WHEN an agent's transaction fails, THE System SHALL decrease the agent's reputation by 2 to 10 points
4. WHEN an agent betrays an alliance, THE System SHALL decrease the agent's reputation by 15 to 25 points
5. WHEN an agent builds reputation through the build_reputation action, THE System SHALL increase reputation by 3 to 8 points
6. THE System SHALL clamp reputation scores between 0 and 100
7. THE System SHALL use reputation scores to influence transaction success probabilities

### Requirement 5: Alliance Management

**User Story:** As a system operator, I want agents to form and break alliances, so that complex social dynamics emerge in the simulation.

#### Acceptance Criteria

1. WHEN an agent executes a form_alliance action with another agent, THE System SHALL create an alliance record linking the two agents
2. THE System SHALL store alliance formation timestamp and participating agent identifiers
3. WHEN an agent executes a betray_alliance action, THE System SHALL remove the alliance record
4. THE System SHALL apply reputation penalties to the betraying agent
5. THE System SHALL notify both agents in an alliance when the alliance is formed or broken
6. THE System SHALL allow agents to be in multiple simultaneous alliances

### Requirement 6: Blockchain-Style Ledger

**User Story:** As a system operator, I want transactions recorded in a blockchain-style ledger, so that the system demonstrates compatibility with high-performance chain architectures.

#### Acceptance Criteria

1. THE Ledger SHALL record every transaction with fields: from_agent, to_agent, amount, action_type, timestamp, success_status, block_number
2. THE Ledger SHALL group transactions into blocks every 30 seconds
3. WHEN a block is finalized, THE Ledger SHALL assign it a sequential block number and timestamp
4. THE Ledger SHALL maintain an immutable append-only transaction history
5. THE Ledger SHALL provide query capabilities for transactions by agent, by block, and by time range

### Requirement 7: Leaderboard and Rankings

**User Story:** As a user, I want to see agent rankings, so that I can quickly identify the most successful agents in the simulation.

#### Acceptance Criteria

1. THE System SHALL maintain a leaderboard ranking agents by wallet balance (richest agents)
2. THE System SHALL maintain a leaderboard ranking agents by reputation score (most trusted agents)
3. THE System SHALL maintain a leaderboard ranking agents by transaction count (most active agents)
4. THE System SHALL update all leaderboards after each decision cycle completes
5. THE System SHALL return the top 10 agents for each leaderboard category

### Requirement 8: Live Dashboard Interface

**User Story:** As a user, I want a live dashboard with dark futuristic aesthetics, so that I can monitor the simulation in real-time with an engaging visual experience.

#### Acceptance Criteria

1. THE Dashboard SHALL display a table of all agents showing name, wallet balance, reputation score, role, and personality
2. THE Dashboard SHALL display a live activity feed showing recent transactions and actions in reverse chronological order
3. THE Dashboard SHALL display three leaderboards: richest agents, highest reputation agents, and most active agents
4. WHERE network graph visualization is implemented, THE Dashboard SHALL display agent interactions as nodes and edges
5. THE Dashboard SHALL use a dark color scheme with neon accents (cyan, purple, green)
6. THE Dashboard SHALL auto-refresh data every 2 to 5 seconds without full page reload
7. WHEN new activity occurs, THE Dashboard SHALL highlight or animate the new entries

### Requirement 9: API Endpoints for Dashboard

**User Story:** As a frontend developer, I want RESTful API endpoints, so that the dashboard can fetch simulation data efficiently.

#### Acceptance Criteria

1. THE System SHALL provide a GET /api/agents endpoint returning all agent states
2. THE System SHALL provide a GET /api/activity endpoint returning recent transactions and actions (last 50 entries)
3. THE System SHALL provide a GET /api/leaderboards endpoint returning all three leaderboard rankings
4. THE System SHALL provide a GET /api/ledger endpoint returning recent blocks and transactions
5. THE System SHALL provide a GET /api/stats endpoint returning aggregate statistics (total transactions, total credits in circulation, average reputation)
6. THE System SHALL respond to all API requests within 200 milliseconds under normal load
7. THE System SHALL include CORS headers to allow cross-origin requests from the frontend

### Requirement 10: Configuration and Initialization

**User Story:** As a system operator, I want configurable initialization parameters, so that I can adjust the simulation for different scenarios.

#### Acceptance Criteria

1. THE System SHALL read configuration from environment variables including: agent_count, initial_balance, decision_cycle_interval, llm_provider, llm_api_key
2. THE System SHALL validate all required environment variables at startup
3. IF required environment variables are missing, THEN THE System SHALL log descriptive errors and exit gracefully
4. THE System SHALL provide default values for optional configuration parameters
5. THE System SHALL seed agents with diverse personalities and roles based on configuration
6. THE System SHALL initialize the economy with a configurable total credit supply distributed among agents

### Requirement 11: Logging and Observability

**User Story:** As a system operator, I want comprehensive logging, so that I can debug issues and understand simulation behavior.

#### Acceptance Criteria

1. THE System SHALL log all agent decisions with timestamp, agent name, chosen action, and reasoning
2. THE System SHALL log all transactions with full details (sender, receiver, amount, success/failure)
3. THE System SHALL log all LLM API calls including request payload and response
4. THE System SHALL log system errors with stack traces
5. THE System SHALL support configurable log levels (debug, info, warn, error)
6. THE System SHALL write logs to both console and file with rotation
7. WHEN running in production mode, THE System SHALL default to info level logging

### Requirement 12: Deployment and Production Readiness

**User Story:** As a developer, I want clear deployment instructions and production-ready code, so that the project can be demonstrated reliably at a hackathon.

#### Acceptance Criteria

1. THE System SHALL include a README with setup instructions, environment variable documentation, and local run commands
2. THE System SHALL include deployment instructions for backend (Render) and frontend (Vercel)
3. THE System SHALL use environment variables for all sensitive configuration (API keys, secrets)
4. THE System SHALL include a .env.example file with all required variables documented
5. THE System SHALL include seed data for demo purposes with pre-configured agents
6. THE System SHALL gracefully handle API rate limits and network failures
7. THE System SHALL include health check endpoints for monitoring (GET /health)

