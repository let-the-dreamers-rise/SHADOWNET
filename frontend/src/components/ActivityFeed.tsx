import React, { useEffect, useRef } from 'react';

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  action: string;
  success: boolean;
  timestamp: number;
}

interface Agent {
  id: string;
  name: string;
}

interface ActivityFeedProps {
  activity: Transaction[];
  agents?: Agent[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity, agents = [] }) => {
  const prevActivityRef = useRef<Transaction[]>([]);
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());

  // Create a map of agent IDs to names for quick lookup
  const agentNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach(agent => map.set(agent.id, agent.name));
    return map;
  }, [agents]);

  const getAgentName = (id: string) => {
    return agentNameMap.get(id) || id.substring(0, 8);
  };

  useEffect(() => {
    const prevIds = new Set(prevActivityRef.current.map(t => t.id));
    const currentIds = new Set(activity.map(t => t.id));
    const newTransactionIds = new Set(
      [...currentIds].filter(id => !prevIds.has(id))
    );
    
    setNewIds(newTransactionIds);
    prevActivityRef.current = activity;

    if (newTransactionIds.size > 0) {
      const timer = setTimeout(() => setNewIds(new Set()), 3000);
      return () => clearTimeout(timer);
    }
  }, [activity]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatAction = (action: string) => {
    if (!action) return 'UNKNOWN';
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const getActivityMessage = (tx: Transaction) => {
    const fromName = getAgentName(tx.from);
    const toName = getAgentName(tx.to);
    
    if (!tx.action) {
      return `${fromName} → ${toName}: ${tx.amount} credits`;
    }
    if (tx.action === 'hire') {
      return `${fromName} hired ${toName} for ${tx.amount} credits`;
    } else if (tx.action === 'trade' || tx.action === 'trade_resources') {
      return `${fromName} traded with ${toName} for ${tx.amount} credits`;
    } else if (tx.action === 'risky_deal') {
      return `${fromName} attempted risky deal with ${toName} for ${tx.amount} credits`;
    } else if (tx.action === 'invest') {
      return `${fromName} invested ${tx.amount} credits`;
    } else {
      return `${fromName} → ${toName}: ${tx.amount} credits (${formatAction(tx.action)})`;
    }
  };

  return (
    <div className="panel">
      <h2>Activity Feed</h2>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {activity.length === 0 ? (
          <div className="loading">No activity yet...</div>
        ) : (
          activity.slice(0, 50).map((tx) => (
            <div
              key={tx.id}
              className={`activity-item ${newIds.has(tx.id) ? 'new' : ''} ${
                tx.success ? 'success' : 'failure'
              }`}
            >
              <div>{getActivityMessage(tx)}</div>
              <div style={{ marginTop: '4px', fontSize: '11px' }}>
                <span style={{ color: tx.success ? 'var(--accent-green)' : '#ff4444' }}>
                  {tx.success ? '✓ SUCCESS' : '✗ FAILED'}
                </span>
                <span className="timestamp"> • {formatTimestamp(tx.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
