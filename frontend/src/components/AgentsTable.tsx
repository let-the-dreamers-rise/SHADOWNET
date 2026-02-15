import React from 'react';
import { Agent } from '../types';

interface AgentsTableProps {
  agents: Agent[];
}

const AgentsTable: React.FC<AgentsTableProps> = ({ agents }) => {
  const sortedAgents = [...agents].sort((a, b) => b.wallet - a.wallet);

  return (
    <div className="panel">
      <h2>Agents ({agents.length})</h2>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Wallet</th>
              <th>Reputation</th>
              <th>Role</th>
              <th>Personality</th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent) => (
              <tr key={agent.id}>
                <td>{agent.name}</td>
                <td style={{ color: 'var(--accent-green)' }}>
                  {agent.wallet.toFixed(0)}
                </td>
                <td style={{ color: 'var(--accent-purple)' }}>
                  {agent.reputation.toFixed(0)}
                </td>
                <td>{agent.role}</td>
                <td>{agent.personality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentsTable;
