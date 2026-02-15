# SHADOWNET

Autonomous multi-agent shadow economy simulator - a production-ready hackathon project demonstrating advanced multi-agent coordination, economic simulation, and real-time visualization.

## Overview

SHADOWNET simulates a low-trust digital economy where 12-20 AI agents with unique identities operate autonomously, making independent decisions using LLMs, transacting with simulated currency, forming alliances, and competing for wealth and reputation.

## Features

- 🤖 Autonomous AI agents with unique personalities and roles
- 💰 Simulated economy with transactions and reputation system
- 🤝 Dynamic alliance formation and betrayal mechanics
- 🌑 **Shadow Economy**: Grudges, revenge, blacklists, and vendetta tracking
- 🗡️ **Agent Memory**: Agents remember betrayals and seek revenge
- 🚫 **Blacklist System**: Agents refuse to deal with enemies
- 💀 **Drama Feed**: Real-time feed of betrayals, revenge, and conflicts
- 📊 Blockchain-style transaction ledger
- 🎨 Dark futuristic dashboard interface with real-time updates
- 📈 Live leaderboards and activity feed
- 🔄 3-second polling for real-time data
- ⚡ Property-based testing with 22+ correctness properties

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI or Gemini API key

### Backend Installation

1. Clone the repository
2. Install backend dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```
LLM_PROVIDER=openai
LLM_API_KEY=your_api_key_here
```

### Frontend Installation

Install frontend dependencies:
```bash
npm run frontend:install
```

Or manually:
```bash
cd frontend
npm install
cd ..
```

### Running Locally

1. Start the backend server (from root directory):
```bash
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm run frontend:dev
```

Or manually:
```bash
cd frontend
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Production Build

Backend:
```bash
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Configuration

See `.env.example` for all available configuration options.

### Required Variables

- `LLM_PROVIDER`: AI provider (`openai` or `gemini`)
- `LLM_API_KEY`: Your API key

### Optional Variables (with defaults)

- `AGENT_COUNT`: Number of agents (12-20, default: 15)
- `INITIAL_BALANCE`: Starting credits per agent (default: 1000)
- `DECISION_CYCLE_MIN`: Min decision cycle time in ms (default: 5000)
- `DECISION_CYCLE_MAX`: Max decision cycle time in ms (default: 10000)
- `BLOCK_INTERVAL`: Block finalization interval in ms (default: 30000)
- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level (default: info)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)

## Project Structure

```
shadownet/
├── src/
│   ├── api/          # Express server and routes
│   ├── models/       # TypeScript interfaces and types
│   ├── services/     # Business logic services
│   ├── utils/        # Utilities (config, logger)
│   └── index.ts      # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API client
│   │   └── styles/      # CSS theme
│   └── index.html       # Entry HTML
├── tests/            # Test files
├── logs/             # Log files (generated)
└── dist/             # Compiled output (generated)
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/agents` - Get all agent states
- `GET /api/activity` - Get recent transactions
- `GET /api/drama` - **NEW**: Get recent shadow events (betrayals, revenge)
- `GET /api/agents/:id/grudges` - **NEW**: Get agent's grudges and threat level
- `GET /api/leaderboards` - Get agent rankings
- `GET /api/ledger` - Get recent blocks
- `GET /api/stats` - Get aggregate statistics (includes shadow stats)

## Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository: `https://github.com/let-the-dreamers-rise/SHADOWNET`
3. Configure build settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Root Directory: Leave blank (uses repository root)
4. Add environment variables in Render dashboard:
   - `LLM_PROVIDER=gemini` (or `openai`)
   - `LLM_API_KEY=your_gemini_api_key_here`
   - `FRONTEND_URL=https://your-app.vercel.app` (add after frontend deployment)
   - `NODE_VERSION=18` (optional, ensures correct Node version)
5. Deploy and wait for build to complete!
6. Copy your Render URL (e.g., `https://shadownet.onrender.com`)

### Frontend Deployment (Vercel)

**Option 1: Vercel CLI**
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Run: `vercel`
4. Follow prompts to deploy
5. Set environment variable in Vercel dashboard:
   - `VITE_API_URL=https://your-render-url.onrender.com/api`

**Option 2: GitHub Integration (Recommended)**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository: `let-the-dreamers-rise/SHADOWNET`
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-render-url.onrender.com/api`
6. Deploy!

**Important**: After frontend deployment, go back to Render and update the `FRONTEND_URL` environment variable with your Vercel URL for CORS.

## Demo

Once deployed, your SHADOWNET dashboard will show:
- Real-time agent activity and transactions
- **Shadow Events Feed** with betrayals, revenge, and conflicts
- **Shadow Statistics** showing grudges, blacklists, and threat levels
- Live leaderboards (richest, most trusted, most active)
- Agent table with wallet balances and reputation scores
- Activity feed with success/failure indicators
- Aggregate statistics

The simulation runs continuously with agents making autonomous decisions every 5-10 seconds. Agents remember betrayals, hold grudges, seek revenge, and maintain blacklists - creating emergent dramatic narratives in the shadow economy.

## Shadow Economy

SHADOWNET features a dark, emergent shadow economy where:
- **Agents remember betrayals** and form grudges
- **Revenge mechanics** drive dramatic confrontations
- **Blacklists** prevent agents from dealing with enemies
- **Threat levels** track dangerous agents
- **Drama events** create real-time narrative arcs

See [SHADOW_FEATURES.md](SHADOW_FEATURES.md) for detailed documentation.

## License

MIT
