# 🌑 SHADOWNET Shadow Economy Features

## Overview

SHADOWNET now includes a dark, emergent shadow economy where agents remember betrayals, hold grudges, seek revenge, and maintain blacklists. This creates dramatic, unpredictable agent behavior that truly embodies the "shadow" in SHADOWNET.

## New Features

### 1. **Grudge System** 🗡️
- Agents remember who betrayed them
- Grudges have intensity levels (0-100)
- High-intensity grudges drive revenge behavior
- Grudges decay slowly over time

### 2. **Blacklist Enforcement** 🚫
- Agents refuse to trade with blacklisted enemies
- Betrayals automatically add agents to blacklists
- Failed deals can create blacklist entries
- Blacklists persist throughout the simulation

### 3. **Revenge Mechanics** ⚔️
- Agents with grudges have a 30% chance to attempt revenge
- Revenge transactions use double the normal amount
- Successful revenge reduces grudge intensity
- Failed revenge increases frustration

### 4. **Threat Levels** ⚠️
- Each agent has a threat level (0-100)
- Betrayals increase threat level
- High threat agents are more dangerous
- Visible in agent profiles

### 5. **Drama Events Feed** 💀
- Real-time feed of dramatic events
- Betrayals, revenge, alliance wars
- Severity ratings (1-10)
- Timestamped event log

### 6. **Shadow Statistics** 📊
- Total active grudges
- Total blacklisted relationships
- Average threat level across all agents
- Drama event count

## How It Works

### Betrayal Flow
```
1. Agent betrays alliance
2. ShadowMemory records betrayal
3. Victim gets high-intensity grudge (80-100)
4. Betrayer added to victim's blacklist
5. Betrayer's threat level increases
6. Drama event logged
```

### Revenge Flow
```
1. Agent has grudge against target
2. 30% chance to attempt revenge on interaction
3. Revenge transaction uses 2x amount
4. If successful:
   - Grudge intensity reduced by 40
   - Revenge drama event logged
5. If failed:
   - Grudge persists
   - Frustration builds
```

### Blacklist Enforcement
```
1. Agent attempts transaction
2. Check if target is blacklisted
3. If blacklisted:
   - Transaction refused
   - "Blacklist enforced" logged
4. If not blacklisted:
   - Transaction proceeds normally
```

## API Endpoints

### GET /api/drama
Returns recent dramatic events (betrayals, revenge, etc.)

**Query params:**
- `limit`: number of events (default: 20, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "betrayal",
      "timestamp": 1234567890,
      "agent": "agent-id",
      "target": "victim-id",
      "description": "Agent X BETRAYED Agent Y - alliance shattered",
      "severity": 9
    }
  ]
}
```

### GET /api/agents/:id/grudges
Returns grudges held by a specific agent

**Response:**
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "agent-id",
      "name": "Agent Name"
    },
    "threatLevel": 45,
    "grudges": [
      {
        "holder": "agent-id",
        "target": "target-id",
        "targetName": "Target Name",
        "reason": "betrayal",
        "intensity": 85,
        "formedAt": 1234567890,
        "revengeAttempts": 2
      }
    ]
  }
}
```

### GET /api/stats (enhanced)
Now includes shadow statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAgents": 15,
    "totalCredits": 15000,
    "averageReputation": 50.5,
    "totalTransactions": 234,
    "shadowStats": {
      "totalGrudges": 8,
      "totalBlacklisted": 12,
      "avgThreatLevel": 35,
      "recentDramaCount": 15
    }
  }
}
```

## Frontend Components

### DramaFeed Component
- Displays recent shadow events
- Color-coded by severity
- Animated entries
- Icons for event types

### Enhanced StatsPanel
- Shows shadow statistics
- Grudge count
- Blacklist count
- Average threat level

## Emergent Behaviors

The shadow economy creates emergent behaviors:

1. **Vendetta Chains**: Agent A betrays B, B seeks revenge on A, A retaliates
2. **Reputation Spirals**: Betrayers become isolated as blacklists spread
3. **Alliance Instability**: Fear of betrayal makes alliances fragile
4. **Risk Aversion**: Agents avoid dealing with high-threat agents
5. **Dramatic Arcs**: Individual agents develop story arcs (rise, betrayal, fall, revenge)

## Configuration

Shadow features are always active. Grudge decay happens every block finalization (30 seconds by default).

To adjust grudge intensity or revenge probability, modify:
- `src/services/ShadowMemory.ts` - grudge intensity ranges
- `src/services/SimulationOrchestrator.ts` - revenge probability (currently 30%)

## Demo Tips

To showcase shadow features:

1. Watch the Drama Feed for betrayals
2. Check shadow stats in the header
3. Notice agents refusing to trade (blacklist enforcement)
4. Look for revenge attempts in activity feed
5. Track individual agent grudges via API

## Technical Details

### Memory Management
- Grudges stored in Map<agentId, Grudge[]>
- Blacklists stored in Map<agentId, Set<targetId>>
- Drama events stored in array (limited to recent events)
- Threat levels stored in Map<agentId, number>

### Performance
- O(1) blacklist checks
- O(n) grudge lookups per agent
- Minimal memory overhead
- Grudge decay prevents unbounded growth

## Future Enhancements

Potential additions:
- Alliance wars (coordinated revenge)
- Reputation-based grudge intensity
- Forgiveness mechanics
- Grudge inheritance (allies inherit grudges)
- Shadow market (underground transactions)

---

**Built for the Moltiverse Hackathon** 🦞
**Truly embodying the shadows** 🌑
