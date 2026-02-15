# SHADOWNET - Moltiverse Hackathon Submission

## 🌑 Project Overview

SHADOWNET is an autonomous multi-agent shadow economy simulator where AI agents with unique personalities operate in a low-trust digital economy, making independent decisions, forming alliances, betraying each other, and seeking revenge.

## 🎯 What Makes This Special

### Core Innovation: Emergent Shadow Economy
Unlike typical multi-agent simulations, SHADOWNET agents have **memory and emotions**:
- **Remember betrayals** and form lasting grudges
- **Seek revenge** on enemies who wronged them
- **Maintain blacklists** and refuse to deal with enemies
- **Develop threat levels** based on their actions
- **Create dramatic narratives** through emergent behavior

### Why This Wins
1. **Weird & Creative** ✅ - Agents hold grudges, seek revenge, create drama
2. **Actually Works** ✅ - Full-stack implementation with 22+ property-based tests
3. **Pushes Boundaries** ✅ - Emergent agent psychology and social dynamics
4. **A2A Coordination** ✅ - Alliances, betrayals, coordinated revenge

## 🚀 Key Features

### Shadow Economy Mechanics
- **Grudge System**: Agents remember who betrayed them (intensity 0-100)
- **Revenge Mechanics**: 30% chance to attempt revenge with 2x stakes
- **Blacklist Enforcement**: Agents refuse to trade with blacklisted enemies
- **Threat Levels**: Track dangerous agents (0-100 scale)
- **Drama Events**: Real-time feed of betrayals, revenge, conflicts

### Technical Excellence
- **Property-Based Testing**: 22+ correctness properties validated
- **Credit Conservation**: Mathematically proven economic invariants
- **Reputation System**: Probabilistic transaction success
- **Blockchain-Style Ledger**: Immutable transaction history
- **Real-Time Dashboard**: 3-second polling with live updates

### Agent Personalities
- **Greedy**: Hoard wealth, high betrayal risk
- **Loyal**: Stick with allies, low betrayal risk
- **Chaotic**: Unpredictable, random betrayals
- **Strategic**: Calculated decisions, optimal betrayal timing

### Agent Roles
- **Broker**: Facilitate deals, earn commissions
- **Trader**: Frequent transactions, resource exchanges
- **Researcher**: Long-term investments, reputation building
- **Fixer**: Handle risky deals, high risk tolerance

## 📊 Dashboard Features

### Main View
- **Shadow Events Feed**: Live betrayals, revenge, conflicts
- **Shadow Statistics**: Grudges, blacklists, threat levels
- **Agent Table**: All agents with wallets, reputation, roles
- **Activity Feed**: Real-time transactions with success/failure
- **Leaderboards**: Richest, most trusted, most active

### Dark Futuristic Theme
- Cyberpunk aesthetic with neon accents
- Animated drama events
- Color-coded severity levels
- Pulsing critical events

## 🎬 Demo Highlights

### Emergent Behaviors to Watch
1. **Vendetta Chains**: A betrays B → B seeks revenge → A retaliates
2. **Reputation Spirals**: Betrayers become isolated as blacklists spread
3. **Alliance Instability**: Fear of betrayal makes alliances fragile
4. **Dramatic Arcs**: Individual agents develop story arcs

### Example Scenario
```
1. Agent "Shadow" betrays alliance with "Ghost"
2. Ghost forms grudge (intensity: 85)
3. Ghost blacklists Shadow
4. Ghost attempts revenge transaction (2x amount)
5. If successful: Grudge intensity drops to 45
6. Drama event logged: "Ghost got REVENGE on Shadow"
```

## 🛠️ Technical Stack

### Backend
- **Node.js + TypeScript**: Type-safe server
- **Express**: REST API
- **OpenAI/Gemini**: LLM-powered agent decisions
- **Winston**: Structured logging
- **Jest + fast-check**: Property-based testing

### Frontend
- **React + TypeScript**: Type-safe UI
- **Vite**: Fast build tool
- **Axios**: API client with retry logic
- **CSS Variables**: Dark theme system

## 📈 Statistics

- **Lines of Code**: ~3000+ (backend + frontend)
- **Test Coverage**: 22+ property-based tests + unit tests
- **API Endpoints**: 8 (including 2 shadow endpoints)
- **Agent Count**: 12-20 (configurable)
- **Decision Cycle**: 5-10 seconds
- **Block Interval**: 30 seconds

## 🎯 Hackathon Fit

### Agent Track (No Token Required)
- ✅ Working agent system
- ✅ Interesting autonomous behavior
- ✅ Clear demo and documentation
- ✅ Pushes boundaries of agent coordination

### Bonus Points
- ✅ A2A coordination (alliances, betrayals)
- ✅ Emergent behavior (grudges, revenge)
- ✅ Community dynamics (blacklists, threat levels)
- ✅ Weird and creative (shadow economy psychology)

## 🚀 Quick Start

```bash
# Backend
npm install
cp .env.example .env
# Add your LLM API key to .env
npm run dev

# Frontend (new terminal)
npm run frontend:install
npm run frontend:dev

# Open http://localhost:5173
```

## 📝 Documentation

- **README.md**: Setup and deployment instructions
- **SHADOW_FEATURES.md**: Detailed shadow economy documentation
- **ARCHITECTURE.md**: System architecture and design
- **QUICKSTART.md**: 5-minute quick start guide

## 🎥 Demo Flow

1. Start backend and frontend
2. Watch agents make autonomous decisions
3. See betrayals appear in drama feed
4. Notice grudges forming in shadow stats
5. Watch revenge attempts in activity feed
6. Track threat levels rising
7. Observe blacklist enforcement

## 💡 What Makes This Win

### 1. Truly Autonomous Agents
Not just random actions - agents have:
- Memory of past interactions
- Emotional responses (grudges)
- Strategic decision-making
- Social dynamics (blacklists)

### 2. Emergent Narratives
The shadow economy creates stories:
- Rise and fall of powerful agents
- Betrayal and revenge arcs
- Alliance formation and collapse
- Reputation spirals

### 3. Production Quality
- Comprehensive testing
- Clean architecture
- Full documentation
- Real-time dashboard
- Error handling
- Graceful degradation

### 4. Hackathon-Ready
- Works out of the box
- Clear demo path
- Impressive visuals
- Memorable concept
- Easy to understand

## 🏆 Competitive Advantages

vs. Other Agent Projects:
- ✅ **Memory & Psychology**: Agents remember and react emotionally
- ✅ **Emergent Drama**: Unpredictable narratives emerge naturally
- ✅ **Visual Impact**: Dark theme with dramatic event feed
- ✅ **Technical Rigor**: Property-based testing proves correctness
- ✅ **Complete Package**: Backend + Frontend + Tests + Docs

## 📞 Contact & Links

- **GitHub**: [Your repo URL]
- **Demo**: [Deployed URL if available]
- **Video**: [Demo video if available]

## 🎬 Submission Checklist

- ✅ Working agent system
- ✅ Autonomous decision-making
- ✅ A2A coordination
- ✅ Emergent behavior
- ✅ Real-time visualization
- ✅ Comprehensive documentation
- ✅ Clean code with tests
- ✅ Easy to run locally
- ✅ Memorable concept
- ✅ Production quality

---

**Built for Moltiverse Hackathon - Agent Track**
**Ship early, win early** 🦞
**Truly embodying the shadows** 🌑
