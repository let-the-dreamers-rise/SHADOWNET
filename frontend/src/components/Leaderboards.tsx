import React from 'react';
import { Agent, LeaderboardsData } from '../types';

interface LeaderboardsProps {
  data: LeaderboardsData;
}

const Leaderboards: React.FC<LeaderboardsProps> = ({ data }) => {
  const renderLeaderboard = (
    title: string,
    agents: Agent[],
    valueKey: 'wallet' | 'reputation' | 'memory',
    color: string
  ) => {
    return (
      <div className="panel">
        <h2>{title}</h2>
        <div>
          {agents.length === 0 ? (
            <div className="loading">No data yet...</div>
          ) : (
            agents.map((agent, index) => (
              <div key={agent.id} className="leaderboard-item">
                <div>
                  <span className="rank">#{index + 1}</span>
                  <span>{agent.name}</span>
                </div>
                <div className="value" style={{ color }}>
                  {valueKey === 'wallet'
                    ? agent.wallet.toFixed(0)
                    : valueKey === 'reputation'
                    ? agent.reputation.toFixed(0)
                    : agent.memory?.length || 0}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderLeaderboard(
        'Richest Agents',
        data.richest || [],
        'wallet',
        'var(--accent-green)'
      )}
      {renderLeaderboard(
        'Most Trusted',
        data.mostTrusted || [],
        'reputation',
        'var(--accent-purple)'
      )}
      {renderLeaderboard(
        'Most Active',
        data.mostActive || [],
        'memory',
        'var(--accent-cyan)'
      )}
    </>
  );
};

export default Leaderboards;
