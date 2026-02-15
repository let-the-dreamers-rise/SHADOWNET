# SHADOWNET Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Backend Dependencies
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# For OpenAI:
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-openai-key-here

# For Gemini:
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-key-here
```

### Step 3: Install Frontend Dependencies
```bash
npm run frontend:install
```

### Step 4: Start the Backend
Open a terminal and run:
```bash
npm run dev
```

You should see:
```
[INFO] SHADOWNET server starting...
[INFO] Initialized 15 agents
[INFO] Server listening on port 3000
[INFO] Simulation started
```

### Step 5: Start the Frontend
Open a NEW terminal and run:
```bash
npm run frontend:dev
```

You should see:
```
VITE ready in XXX ms
Local: http://localhost:5173/
```

### Step 6: Open the Dashboard
Open your browser to: **http://localhost:5173**

You should see the SHADOWNET dashboard with:
- ⬢ SHADOWNET header with stats
- Agents table showing all agents
- Activity feed with live transactions
- Three leaderboards (richest, most trusted, most active)

## 🎯 What to Expect

The simulation runs automatically:
- Agents make decisions every 5-10 seconds
- Transactions appear in the activity feed
- Leaderboards update in real-time
- Dashboard refreshes every 3 seconds

## 🧪 Testing

Run the test suite:
```bash
npm test
```

This runs 22+ property-based tests and numerous unit tests to verify correctness.

## 🐛 Troubleshooting

### Backend won't start
- Check that your API key is valid in `.env`
- Ensure port 3000 is not in use
- Check logs in `logs/shadownet.log`

### Frontend won't connect
- Ensure backend is running on port 3000
- Check `frontend/.env` has correct `VITE_API_URL`
- Check browser console for errors

### No agent activity
- Verify your LLM API key is working
- Check `logs/error.log` for API errors
- Ensure you have sufficient API credits

## 📊 Demo Features

Try these to showcase the system:
1. Watch the activity feed for live transactions
2. See agents rise and fall in the leaderboards
3. Notice reputation changes after successful/failed deals
4. Observe alliance formations in the activity feed
5. Track total credits conservation in stats panel

## 🚢 Deployment

See README.md for full deployment instructions to Render (backend) and Vercel (frontend).

## 💡 Tips

- The simulation is deterministic with the same seed
- Agents have different personalities (greedy, loyal, chaotic, strategic)
- Agents have different roles (broker, trader, researcher, fixer)
- Reputation affects transaction success probability
- Failed transactions don't transfer credits (rollback)
- Alliances can be formed and broken (betrayal)

Enjoy exploring SHADOWNET! 🌐
