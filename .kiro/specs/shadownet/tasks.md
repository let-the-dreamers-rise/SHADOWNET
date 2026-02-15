# Implementation Plan: SHADOWNET

## Overview

This implementation plan breaks down the SHADOWNET autonomous multi-agent economy simulator into discrete, incremental coding tasks. The approach follows a bottom-up strategy: building core data structures and utilities first, then implementing the economic engine and agent systems, followed by the simulation orchestrator, API layer, and finally the frontend dashboard. Each task builds on previous work, ensuring no orphaned code and enabling early validation through testing.

## Tasks

- [x] 1. Project setup and core infrastructure
  - Initialize Node.js TypeScript project with proper tsconfig
  - Set up Express server with CORS and error handling middleware
  - Configure environment variable loading with dotenv
  - Set up Winston logger with console and file transports
  - Create project folder structure (src/models, src/services, src/api, src/utils)
  - Add Jest and fast-check for testing
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.5, 12.3_

- [x] 1.1 Write unit tests for configuration validation
  - Test missing required environment variables
  - Test default value application
  - Test invalid value handling
  - _Requirements: 10.2, 10.3, 10.4_

- [ ] 2. Implement core data models and types
  - [x] 2.1 Create TypeScript interfaces for Agent, Transaction, Alliance, Block, ActionLog
    - Define all type definitions in src/models/types.ts
    - Include ActionType union type and all enums
    - _Requirements: 1.2, 3.1, 5.1, 6.1_
  
  - [x] 2.2 Create utility functions for agent generation
    - Implement generateUniqueNames() function
    - Implement generateAgents() with personality and role distribution
    - Ensure diverse personality and role assignment
    - _Requirements: 1.1, 1.2, 10.5_
  
  - [x] 2.3 Write property test for agent initialization
    - **Property 1: Agent Initialization Completeness**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 2.4 Write property test for agent diversity
    - **Property 21: Agent Diversity at Initialization**
    - **Validates: Requirements 10.5**

- [ ] 3. Implement AgentManager service
  - [x] 3.1 Create AgentManager class with Map-based storage
    - Implement initializeAgents(), getAgent(), getAllAgents()
    - Implement updateAgent() and logAction()
    - Implement getLeaderboard() with sorting by wallet, reputation, activity
    - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.5_
  
  - [x] 3.2 Write property test for action logging
    - **Property 2: Action Logging Consistency**
    - **Validates: Requirements 1.4**
  
  - [x] 3.3 Write property test for leaderboard sorting
    - **Property 19: Leaderboard Sorting Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**
  
  - [x] 3.4 Write unit tests for AgentManager edge cases
    - Test getAgent() with invalid ID
    - Test updateAgent() with non-existent agent
    - Test leaderboard with empty agent list
    - _Requirements: 1.3, 7.5_

- [ ] 4. Implement AllianceManager service
  - [x] 4.1 Create AllianceManager class
    - Implement formAlliance(), breakAlliance()
    - Implement areAllied(), getAgentAlliances()
    - Track alliance active status
    - _Requirements: 5.1, 5.2, 5.3, 5.6_
  
  - [x] 4.2 Write property test for alliance formation
    - **Property 13: Alliance Formation Creates Record**
    - **Validates: Requirements 5.1, 5.2**
  
  - [x] 4.3 Write property test for alliance betrayal
    - **Property 14: Alliance Betrayal Removes Record**
    - **Validates: Requirements 5.3, 5.4**
  
  - [x] 4.4 Write property test for multiple alliances
    - **Property 15: Multiple Alliance Support**
    - **Validates: Requirements 5.6**

- [ ] 5. Implement EconomyEngine service
  - [x] 5.1 Create EconomyEngine class with transaction processing
    - Implement validateTransaction() with balance checks
    - Implement calculateSuccessProbability() using reputation formula
    - Implement transferCredits() with atomic wallet updates
    - Implement processTransaction() with probabilistic success/failure
    - Implement updateReputations() with action-specific changes
    - Implement getRecentTransactions()
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 5.2 Write property test for transaction validation
    - **Property 4: Transaction Validation**
    - **Validates: Requirements 3.1, 3.2**
  
  - [x] 5.3 Write property test for credit conservation
    - **Property 5: Credit Conservation**
    - **Validates: Requirements 3.3**
  
  - [x] 5.4 Write property test for probability bounds
    - **Property 6: Transaction Probability Bounds**
    - **Validates: Requirements 3.4**
  
  - [x] 5.5 Write property test for probabilistic fairness
    - **Property 7: Probabilistic Transaction Fairness**
    - **Validates: Requirements 3.5**
  
  - [x] 5.6 Write property test for failed transaction rollback
    - **Property 8: Failed Transaction Rollback**
    - **Validates: Requirements 3.6**
  
  - [x] 5.7 Write property test for reputation bounds
    - **Property 10: Reputation Bounds Invariant**
    - **Validates: Requirements 4.6**
  
  - [x] 5.8 Write property test for reputation change bounds
    - **Property 11: Reputation Change Bounds**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
  
  - [x] 5.9 Write property test for reputation influence on probability
    - **Property 12: Reputation Influences Probability**
    - **Validates: Requirements 4.7**
  
  - [x] 5.10 Write unit tests for edge cases
    - Test transaction with zero amount
    - Test transaction from agent to itself
    - Test reputation clamping at boundaries (0 and 100)
    - _Requirements: 3.1, 4.6_

- [x] 6. Checkpoint - Core services validation
  - Run all tests to ensure AgentManager, AllianceManager, and EconomyEngine work correctly
  - Verify credit conservation and reputation bounds hold
  - Ask user if any questions or issues arise

- [ ] 7. Implement Ledger service
  - [x] 7.1 Create Ledger class with block management
    - Implement addTransaction() to pending pool
    - Implement finalizeBlock() with sequential block numbering
    - Implement getTransactionsByAgent(), getBlock(), getRecentBlocks()
    - Ensure append-only immutability
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [x] 7.2 Write property test for transaction recording
    - **Property 9: Transaction Recording Completeness**
    - **Validates: Requirements 3.7, 6.1**
  
  - [x] 7.3 Write property test for block sequentiality
    - **Property 16: Block Number Sequentiality**
    - **Validates: Requirements 6.3**
  
  - [x] 7.4 Write property test for ledger immutability
    - **Property 17: Ledger Immutability**
    - **Validates: Requirements 6.4**
  
  - [x] 7.5 Write property test for query correctness
    - **Property 18: Ledger Query Correctness**
    - **Validates: Requirements 6.5**

- [ ] 8. Implement DecisionEngine with LLM integration
  - [x] 8.1 Create DecisionEngine class
    - Implement buildPrompt() with agent context and personality
    - Implement makeDecision() with OpenAI/Gemini API integration
    - Implement parseResponse() to extract structured JSON decision
    - Implement retryWithBackoff() with exponential backoff (3 attempts)
    - Implement getFallbackDecision() returning safe 'save' action
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 8.2 Write property test for decision context completeness
    - **Property 3: Decision Context Completeness**
    - **Validates: Requirements 2.2**
  
  - [x] 8.3 Write unit tests for LLM integration
    - Test successful LLM response parsing
    - Test retry logic with simulated failures
    - Test fallback decision on complete failure
    - Test all action types are supported
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [ ] 9. Implement SimulationOrchestrator
  - [-] 9.1 Create SimulationOrchestrator class
    - Inject all service dependencies (AgentManager, DecisionEngine, EconomyEngine, AllianceManager, Ledger)
    - Implement start() and stop() methods
    - Implement executeCycle() to process all agents
    - Implement executeAgentAction() to dispatch actions to appropriate services
    - Implement scheduleNextCycle() with random 5-10 second delay
    - Add block finalization timer (every 30 seconds)
    - _Requirements: 2.1, 2.4, 3.3, 5.1, 5.3, 6.2_
  
  - [x] 9.2 Write integration tests for simulation flow
    - Test full decision cycle execution
    - Test action dispatching for each action type
    - Test that transactions are logged to ledger
    - Test that alliances are created and broken correctly
    - _Requirements: 2.1, 2.4, 3.7, 5.1, 5.3_

- [ ] 10. Checkpoint - Backend core complete
  - Run all tests including integration tests
  - Manually test simulation orchestrator with mock LLM
  - Verify agents make decisions and economy functions correctly
  - Ask user if any questions or issues arise

- [ ] 11. Implement REST API endpoints
  - [x] 11.1 Create Express routes in src/api/routes.ts
    - Implement GET /api/agents endpoint
    - Implement GET /api/activity endpoint with limit parameter
    - Implement GET /api/leaderboards endpoint
    - Implement GET /api/ledger endpoint
    - Implement GET /api/stats endpoint with aggregate calculations
    - Implement GET /health endpoint
    - Add CORS middleware configuration
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 12.7_
  
  - [x] 11.2 Write API endpoint tests using Supertest
    - Test each endpoint returns correct data structure
    - Test CORS headers are present
    - Test health check endpoint
    - Test activity feed chronological order
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 12.7_
  
  - [x] 11.3 Write property test for activity feed ordering
    - **Property 20: Activity Feed Chronological Order**
    - **Validates: Requirements 8.2**

- [ ] 12. Create server entry point and initialization
  - [x] 12.1 Create src/index.ts with server startup
    - Load and validate environment variables
    - Initialize all services with configuration
    - Initialize agents with credit supply conservation
    - Start simulation orchestrator
    - Start Express server
    - Add graceful shutdown handlers
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 12.6_
  
  - [x] 12.2 Write property test for credit supply conservation
    - **Property 22: Credit Supply Conservation at Initialization**
    - **Validates: Requirements 10.6**
  
  - [x] 12.3 Write unit tests for initialization
    - Test environment variable validation
    - Test graceful error handling for missing config
    - Test seed data loading
    - _Requirements: 10.2, 10.3, 12.5_

- [x] 13. Create seed data and demo configuration
  - Create seed data file with pre-configured agent names and personalities
  - Create .env.example with all required variables documented
  - Test local server startup with seed data
  - _Requirements: 12.4, 12.5_

- [x] 14. Checkpoint - Backend complete and tested
  - Run full test suite
  - Start server locally and verify all API endpoints work
  - Test simulation runs continuously with LLM integration
  - Ask user if any questions or issues arise

- [x] 15. Initialize React frontend project
  - Create React app with TypeScript using Vite
  - Set up project structure (src/components, src/services, src/styles)
  - Configure Axios for API calls
  - Create API client service in src/services/api.ts
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 16. Implement dark futuristic theme
  - Create src/styles/theme.css with CSS variables
  - Define color palette (dark backgrounds, cyan/purple/green accents)
  - Create base styles for panels, tables, and typography
  - Add animations for new activity entries
  - _Requirements: 8.5, 8.7_

- [x] 17. Implement Dashboard components
  - [x] 17.1 Create StatsPanel component
    - Display total agents, total credits, average reputation, total transactions
    - Use data from /api/stats endpoint
    - _Requirements: 9.5_
  
  - [x] 17.2 Create AgentsTable component
    - Display all agents in a table with name, wallet, reputation, role, personality
    - Sort by wallet balance by default
    - Apply dark theme styling
    - _Requirements: 8.1, 9.1_
  
  - [x] 17.3 Create ActivityFeed component
    - Display recent transactions in reverse chronological order
    - Show transaction details (from, to, amount, action, success/failure)
    - Highlight new entries with animation
    - Limit to 50 most recent entries
    - _Requirements: 8.2, 8.7, 9.2_
  
  - [x] 17.4 Create Leaderboards component
    - Display three leaderboard panels side by side
    - Show top 10 richest, most trusted, and most active agents
    - Apply dark theme styling with neon accents
    - _Requirements: 8.3, 9.3_
  
  - [x] 17.5 Create main Dashboard container component
    - Fetch data from all API endpoints
    - Set up polling interval (3 seconds)
    - Manage state for agents, activity, leaderboards, stats
    - Compose all child components in grid layout
    - Handle loading and error states
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 9.1, 9.2, 9.3, 9.5_

- [ ] 18. Optional: Implement NetworkGraph component
  - Use D3.js or vis.js to visualize agent interactions
  - Display agents as nodes, transactions/alliances as edges
  - Update graph in real-time as new interactions occur
  - _Requirements: 8.4_

- [x] 19. Implement error handling and connection status
  - Add connection lost overlay when API calls fail
  - Implement automatic retry for failed requests
  - Display error messages for API failures
  - _Requirements: 12.6_

- [x] 20. Checkpoint - Frontend complete
  - Test all components render correctly
  - Verify data updates in real-time
  - Test responsive layout and dark theme
  - Ask user if any questions or issues arise

- [ ] 21. Create comprehensive README
  - Write project overview and features
  - Document environment variables with descriptions
  - Write local setup instructions (backend and frontend)
  - Write deployment instructions for Render (backend) and Vercel (frontend)
  - Include demo credentials and seed data information
  - Add screenshots or demo video link
  - _Requirements: 12.1, 12.2, 12.4_

- [ ] 22. Prepare for deployment
  - [ ] 22.1 Configure backend for Render deployment
    - Create render.yaml or configure via dashboard
    - Set environment variables in Render
    - Test health check endpoint
    - _Requirements: 12.2, 12.7_
  
  - [ ] 22.2 Configure frontend for Vercel deployment
    - Create vercel.json with build configuration
    - Set API base URL environment variable
    - Test production build locally
    - _Requirements: 12.2_
  
  - [ ] 22.3 Deploy and verify
    - Deploy backend to Render
    - Deploy frontend to Vercel
    - Test full application in production
    - Verify LLM integration works in production
    - _Requirements: 12.2, 12.6_

- [ ] 23. Final polish and demo preparation
  - Add visual polish suggestions (loading spinners, hover effects, transitions)
  - Test demo flow with seed data
  - Prepare demo script highlighting key features
  - Verify all requirements are met
  - _Requirements: 12.5_

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities to address issues
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: data models → services → orchestrator → API → frontend
- LLM integration should be tested with mock responses initially, then with real API calls
- Frontend polling interval (3 seconds) balances real-time feel with API load
- Optional NetworkGraph component can be added after core functionality is complete for extra visual impact

