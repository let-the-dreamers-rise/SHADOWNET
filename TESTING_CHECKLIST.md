# 🧪 SHADOWNET Testing Checklist

## Before Submission

### Backend Tests
```bash
# Run all tests
npm test

# Expected: All tests pass (22+ property tests + unit tests)
```

### Build Tests
```bash
# Backend build
npm run build

# Frontend build
cd frontend
npm run build
cd ..

# Expected: No TypeScript errors
```

### Local Demo
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
npm run frontend:dev

# Open: http://localhost:5173
```

## Shadow Features Checklist

### ✅ Drama Feed
- [ ] Drama feed appears on dashboard
- [ ] Shows "🌑 SHADOW EVENTS" header
- [ ] Initially shows "No drama yet..." message
- [ ] Updates when betrayals occur

### ✅ Shadow Stats
- [ ] Stats panel shows shadow statistics
- [ ] "🗡️ Active Grudges" displays
- [ ] "🚫 Blacklisted" displays
- [ ] "⚠️ Avg Threat" displays

### ✅ Betrayal Mechanics
- [ ] Watch for betrayal in activity feed
- [ ] Check drama feed for betrayal event
- [ ] Verify grudge count increases
- [ ] Verify blacklist count increases

### ✅ Revenge Mechanics
- [ ] Wait for revenge attempt (may take time)
- [ ] Look for "REVENGE" in drama feed
- [ ] Check activity feed for 2x amount transaction
- [ ] Verify grudge intensity decreases

### ✅ Blacklist Enforcement
- [ ] Look for "blacklist_enforced" in logs
- [ ] Check that transaction was refused
- [ ] Verify no credits transferred

## API Endpoint Tests

### Test Drama Endpoint
```bash
# Get recent drama
curl http://localhost:3000/api/drama

# Expected: JSON with drama events array
```

### Test Shadow Stats
```bash
# Get stats with shadow data
curl http://localhost:3000/api/stats

# Expected: JSON with shadowStats object
```

### Test Agent Grudges
```bash
# Get grudges for an agent (replace AGENT_ID)
curl http://localhost:3000/api/agents/AGENT_ID/grudges

# Expected: JSON with grudges array and threat level
```

## Visual Checks

### Dashboard Layout
- [ ] Drama feed appears at top (spans 2 columns)
- [ ] Shadow stats show purple/dark styling
- [ ] Drama events have icons (🗡️, ⚔️, etc.)
- [ ] Severity colors work (red for critical)

### Animations
- [ ] New drama events fade in
- [ ] Critical events pulse red
- [ ] Hover effects work on drama events

### Theme
- [ ] Dark background maintained
- [ ] Purple accents for shadow features
- [ ] Neon glow effects on shadow stats
- [ ] Readable text contrast

## Behavior Verification

### Grudge Formation
1. Wait for betrayal event
2. Check drama feed for "BETRAYED" message
3. Verify grudge count increased
4. Check logs for "🗡️ BETRAYAL" message

### Revenge Execution
1. Wait for agent with grudge to act
2. Look for "⚔️ REVENGE" in logs
3. Check drama feed for revenge event
4. Verify grudge intensity decreased

### Blacklist Enforcement
1. Wait for blacklisted pair interaction
2. Check logs for "🚫 REFUSES to deal"
3. Verify transaction failed
4. Check drama feed (may not always log)

## Performance Checks

### Memory Usage
```bash
# Check Node.js memory
# Should be < 200MB for 15 agents
```

### Response Times
- [ ] API responses < 100ms
- [ ] Dashboard updates every 3 seconds
- [ ] No lag in UI updates

### Stability
- [ ] Run for 5+ minutes without crashes
- [ ] No memory leaks
- [ ] Logs show continuous cycles
- [ ] Frontend stays connected

## Edge Cases

### No Drama Scenario
- [ ] Empty drama feed shows "No drama yet..."
- [ ] Shadow stats show zeros initially
- [ ] No errors in console

### High Drama Scenario
- [ ] Drama feed scrolls properly
- [ ] Old events removed (limit 20)
- [ ] Performance stays good

### Agent Isolation
- [ ] Blacklisted agents can't transact
- [ ] High-threat agents avoided
- [ ] Grudges persist across cycles

## Documentation Checks

### Files Present
- [ ] README.md (updated with shadow features)
- [ ] SHADOW_FEATURES.md (detailed docs)
- [ ] HACKATHON_SUBMISSION.md (submission guide)
- [ ] WHAT_MAKES_THIS_WIN.md (pitch doc)
- [ ] ARCHITECTURE.md (system design)
- [ ] QUICKSTART.md (5-min guide)

### Code Comments
- [ ] ShadowMemory.ts has clear comments
- [ ] SimulationOrchestrator.ts has shadow comments
- [ ] API routes documented

## Pre-Submission Final Checks

### Code Quality
- [ ] No console.errors in browser
- [ ] No TypeScript errors
- [ ] All tests passing
- [ ] Clean git status

### Demo Readiness
- [ ] .env.example has all variables
- [ ] README has clear setup steps
- [ ] QUICKSTART works in 5 minutes
- [ ] Demo shows shadow features

### Submission Materials
- [ ] GitHub repo is public
- [ ] README has demo instructions
- [ ] Screenshots/video (optional but recommended)
- [ ] Submission form filled out

## Quick Demo Script

### For Judges (2-minute demo)
```
1. Open dashboard
   → "See the dark SHADOWNET theme"

2. Point to shadow stats
   → "These track grudges, blacklists, threat levels"

3. Point to drama feed
   → "This shows betrayals and revenge in real-time"

4. Wait for betrayal
   → "Watch - Agent X just betrayed Agent Y"
   → "See the grudge count increase"

5. Wait for revenge
   → "Now Agent Y is attempting revenge"
   → "Notice the 2x transaction amount"

6. Show activity feed
   → "All transactions logged with success/failure"

7. Show shadow stats
   → "Threat levels rising as betrayals increase"

8. Conclusion
   → "Agents remember, hold grudges, seek revenge"
   → "Emergent dramatic narratives in shadow economy"
```

## Troubleshooting

### Drama Feed Not Showing
- Check browser console for errors
- Verify API endpoint: `curl http://localhost:3000/api/drama`
- Check that orchestrator has shadowMemory

### No Betrayals Happening
- Wait longer (betrayals are random)
- Check agent personalities (chaotic betrays more)
- Verify alliances are forming first

### Shadow Stats All Zero
- Wait for simulation to run
- Check that betrayals are occurring
- Verify shadowMemory is initialized

### Frontend Not Updating
- Check 3-second polling is working
- Verify backend is running
- Check CORS settings

## Success Criteria

### Minimum Viable Demo
- ✅ Backend running without errors
- ✅ Frontend displays all components
- ✅ Drama feed visible (even if empty)
- ✅ Shadow stats visible
- ✅ At least one betrayal occurs in 5 minutes

### Ideal Demo
- ✅ Multiple betrayals visible
- ✅ At least one revenge attempt
- ✅ Blacklist enforcement logged
- ✅ Threat levels > 0
- ✅ Dramatic narrative emerging

### Winning Demo
- ✅ Vendetta chain visible
- ✅ Multiple revenge events
- ✅ High threat agents isolated
- ✅ Clear emergent behavior
- ✅ Judge says "wow, that's cool"

---

**Once all checks pass, you're ready to submit!** 🚀
