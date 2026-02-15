import React, { useState, useEffect } from 'react';
import StatsPanel from './StatsPanel';
import AgentsTable from './AgentsTable';
import ActivityFeed from './ActivityFeed';
import Leaderboards from './Leaderboards';
import DramaFeed from './DramaFeed';
import { getAgents, getActivity, getLeaderboards, getStats, getDrama } from '../services/api';
import { Agent, LeaderboardsData, Stats, DramaEvent } from '../types';

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  action: string;
  success: boolean;
  timestamp: number;
}

const Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [drama, setDrama] = useState<DramaEvent[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardsData>({
    richest: [],
    mostTrusted: [],
    mostActive: [],
  });
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0,
    totalCredits: 0,
    averageReputation: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalAlliances: 0,
    totalBetrayals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      const [agentsData, activityData, dramaData, leaderboardsData, statsData] = await Promise.all([
        getAgents(),
        getActivity(),
        getDrama(),
        getLeaderboards(),
        getStats(),
      ]);

      setAgents(agentsData);
      setActivity(activityData);
      setDrama(dramaData);
      setLeaderboards(leaderboardsData);
      setStats(statsData);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to connect to backend. Make sure the server is running.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading pulse">Loading SHADOWNET...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header>
        <h1>⬢ SHADOWNET ⬢</h1>
        {error && <div className="error">{error}</div>}
        <StatsPanel stats={stats} />
      </header>
      <div className="grid">
        <DramaFeed drama={drama} />
        <AgentsTable agents={agents} />
        <ActivityFeed activity={activity} agents={agents} />
        <Leaderboards data={leaderboards} />
      </div>
    </div>
  );
};

export default Dashboard;
