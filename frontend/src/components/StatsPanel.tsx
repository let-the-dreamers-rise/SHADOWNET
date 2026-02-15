import React from 'react';

interface Stats {
  totalAgents: number;
  totalCredits: number;
  averageReputation: number;
  totalTransactions: number;
  activeAlliances?: number;
  shadowStats?: {
    totalGrudges: number;
    totalBlacklisted: number;
    avgThreatLevel: number;
    recentDramaCount: number;
  };
}

interface StatsPanelProps {
  stats: Stats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="label">Total Agents</div>
        <div className="value">{stats.totalAgents || 0}</div>
      </div>
      <div className="stat-card">
        <div className="label">Total Credits</div>
        <div className="value">{stats.totalCredits?.toFixed(0) || 0}</div>
      </div>
      <div className="stat-card">
        <div className="label">Avg Reputation</div>
        <div className="value">{stats.averageReputation?.toFixed(1) || 0}</div>
      </div>
      <div className="stat-card">
        <div className="label">Total Transactions</div>
        <div className="value">{stats.totalTransactions || 0}</div>
      </div>
      {stats.shadowStats && (
        <>
          <div className="stat-card shadow-stat">
            <div className="label">🗡️ Active Grudges</div>
            <div className="value">{stats.shadowStats.totalGrudges}</div>
          </div>
          <div className="stat-card shadow-stat">
            <div className="label">🚫 Blacklisted</div>
            <div className="value">{stats.shadowStats.totalBlacklisted}</div>
          </div>
          <div className="stat-card shadow-stat">
            <div className="label">⚠️ Avg Threat</div>
            <div className="value">{stats.shadowStats.avgThreatLevel}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPanel;
