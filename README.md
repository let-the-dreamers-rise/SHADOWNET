# ⬢ SHADOWNET ⬢

**An Autonomous Multi-Agent Economy Simulation with LLM-Powered Decision Making**

> *Where AI agents trade, betray, and seek revenge in the shadows of a decentralized economy*

---

## 🎯 What Makes SHADOWNET Special

SHADOWNET isn't just another agent simulation - it's a **living, breathing shadow economy** where AI agents make real decisions, form alliances, and hold grudges. Built for the **Moltiverse Hackathon Agent Track**, SHADOWNET demonstrates true emergent behavior through:

### 🌑 The Shadow Economy
- **Grudges & Vendettas**: Agents remember betrayals and seek revenge
- **Blacklists**: Agents refuse to deal with enemies
- **Threat Levels**: Track how dangerous each agent becomes
- **Drama Feed**: Watch betrayals, revenge, and conflicts unfold in real-time

### 🤖 True AI Decision Making
- **LLM-Powered Agents**: Every decision made by Google Gemini 2.0 Flash
- **Unique Personalities**: 15 agents with distinct traits (Ruthless, Cautious, Greedy, etc.)
- **Emergent Behavior**: No scripted actions - agents truly think and adapt
- **Zero Cost**: Uses free Gemini API tier

### 📊 Real-Time Visualization
- **Live Dashboard**: Watch the economy evolve second-by-second
- **Agent Leaderboards**: Richest, most trusted, most active
- **Activity Feed**: Every transaction as it happens
- **Shadow Stats**: Grudges, blacklists, threat levels

---

## 🚀 Live Demo

**Frontend**: [https://shadownet-three.vercel.app/](https://shadownet-three.vercel.app/)  

### Try It Now
1. Visit the live demo
2. Watch agents make LLM-powered decisions in real-time
3. See grudges form when betrayals happen
4. Track revenge attempts in the Drama Feed

---

## ✨ Key Features

### 🎭 Agent Personalities
Each agent has a unique personality that influences their decisions:
- **Ruthless**: Maximizes profit, betrays easily
- **Cautious**: Avoids risk, builds trust slowly
- **Greedy**: Takes big risks for big rewards
- **Loyal**: Values alliances over profit
- **Strategic**: Plans long-term, calculates carefully

### 💰 Economic Actions
Agents can perform various actions:
- **Trade Resources**: Safe, low-reward exchanges
- **Risky Deals**: High stakes, high reward
- **Form Alliances**: Boost trust and cooperation
- **Betray Allies**: Break alliances for profit (creates grudges!)
- **Seek Revenge**: Attack agents who wronged them

### 🌑 Shadow Features
The dark side of the economy:
- **Grudge System**: Intensity 0-100, decays over time
- **Revenge Mechanics**: 30% chance to attempt revenge with 2x stakes
- **Blacklist Enforcement**: Agents refuse blacklisted enemies
- **Threat Tracking**: Monitor dangerous agents
- **Drama Events**: Betrayals, revenge, conflicts logged

---

## 🏗️ Architecture

```
SHADOWNET
├── Backend (Node.js + Express)
│   ├── AgentManager: Manages 15 AI agents
│   ├── DecisionEngine: LLM-powered decision making
│   ├── EconomyEngine: Transaction processing
│   ├── ShadowMemory: Grudges, blacklists, drama
│   ├── AllianceManager: Agent relationships
│   └── Ledger: Blockchain-style transaction log
│
└── Frontend (React + TypeScript)
    ├── Dashboard: Real-time overview
    ├── AgentsTable: Live agent stats
    ├── ActivityFeed: Transaction stream
    ├── DramaFeed: Shadow events
    └── Leaderboards: Top performers
```

---

## 🛠️ Tech Stack

**Backend**
- Node.js + TypeScript
- Express.js
- Google Gemini 2.0 Flash API
- Winston (logging)

**Frontend**
- React 18
- TypeScript
- Vite
- Axios
- CSS3 (custom cyberpunk theme)

**Deployment**
- Backend: Render
- Frontend: Vercel
- Zero cost infrastructure

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key (free tier)

### 1. Clone & Install
```bash
git clone https://github.com/let-the-dreamers-rise/SHADOWNET.git
cd SHADOWNET
npm install
cd frontend && npm install && cd ..
```

### 2. Configure Environment
```bash
# Backend (.env)
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.0-flash-001
AGENT_COUNT=15
INITIAL_BALANCE=1000
PORT=3000

# Frontend (frontend/.env)
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Locally
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Visit `http://localhost:5173` to see SHADOWNET in action!

---

## 🎮 How It Works

### Decision Cycle
1. **LLM Query**: Each agent's state sent to Gemini
2. **AI Decision**: LLM chooses action based on personality
3. **Execution**: Action processed by EconomyEngine
4. **Shadow Logic**: Betrayals create grudges, trigger revenge
5. **Update**: Agent state and relationships updated
6. **Repeat**: Every 5-10 seconds

### Shadow Economy Flow
```
Betrayal → Grudge Created → Blacklist Added → Threat Level ↑
                ↓
         Revenge Attempt (30% chance)
                ↓
         Success → Grudge Intensity ↓
         Failure → Grudge Intensity ↑
```

---

## 📊 API Endpoints

```
GET  /api/health          - Health check
GET  /api/agents          - All agents with stats
GET  /api/activity        - Recent transactions
GET  /api/leaderboards    - Top agents by category
GET  /api/stats           - Aggregate statistics
GET  /api/drama           - Shadow economy events
GET  /api/ledger          - Transaction blocks
GET  /api/agents/:id/grudges - Agent's grudges
```

---

## 🎯 Why SHADOWNET Wins

### 1. True Emergent Behavior
Unlike scripted simulations, SHADOWNET agents make real decisions using LLMs. Every action is unpredictable and authentic.

### 2. Unique Shadow Economy
The grudge/revenge system creates dramatic, engaging narratives. Agents don't just trade - they remember, plot, and strike back.

### 3. Zero Cost, Maximum Impact
Runs entirely on free tiers (Gemini API, Render, Vercel). No blockchain gas fees, no expensive infrastructure.

### 4. Production Ready
- Comprehensive error handling
- Retry logic for API failures
- Credit supply conservation
- Real-time updates
- Responsive UI

### 5. Extensible Architecture
Clean, modular codebase with:
- Full TypeScript
- Comprehensive tests
- Clear documentation
- Easy to extend

---

## 📈 Stats & Metrics

- **15 AI Agents** with unique personalities
- **Real-time LLM decisions** every 5-10 seconds
- **Shadow economy** with grudges, revenge, blacklists
- **Transaction logging** with blockchain-style ledger
- **Live dashboard** with 3-second refresh
- **Zero cost** infrastructure

---

## 🔮 Future Enhancements

- [ ] Agent memory persistence
- [ ] Multi-agent conversations
- [ ] Alliance wars (group conflicts)
- [ ] Economic cycles (boom/bust)
- [ ] Agent evolution (learning from history)
- [ ] Monad blockchain integration
- [ ] NFT agent avatars
- [ ] Governance system

---

## 🤝 Contributing

SHADOWNET is open source! Contributions welcome:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🏆 Built For

**Moltiverse Hackathon - Agent Track**

SHADOWNET demonstrates the power of autonomous AI agents in creating emergent, engaging, and unpredictable economic simulations.

---

## 👥 Team

Built by **let-the-dreamers-rise**

---

## 🙏 Acknowledgments

- Google Gemini API for LLM capabilities
- Moltiverse for hosting the hackathon
- The open source community

---

<div align="center">

### ⬢ Enter the Shadows ⬢

**[Live Demo](https://shadownet-three.vercel.app/)** 

</div>
