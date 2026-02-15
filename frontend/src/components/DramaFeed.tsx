import React from 'react';

interface DramaEvent {
  type: 'betrayal' | 'revenge' | 'alliance_war' | 'blacklist' | 'vendetta_complete';
  timestamp: number;
  agent: string;
  target?: string;
  description: string;
  severity: number;
}

interface DramaFeedProps {
  drama: DramaEvent[];
}

const DramaFeed: React.FC<DramaFeedProps> = ({ drama }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'betrayal':
        return '🗡️';
      case 'revenge':
        return '⚔️';
      case 'alliance_war':
        return '⚡';
      case 'blacklist':
        return '🚫';
      case 'vendetta_complete':
        return '✓';
      default:
        return '💀';
    }
  };

  const getSeverityClass = (severity: number) => {
    if (severity >= 8) return 'severity-critical';
    if (severity >= 6) return 'severity-high';
    if (severity >= 4) return 'severity-medium';
    return 'severity-low';
  };

  return (
    <div className="panel drama-feed">
      <h2>🌑 SHADOW EVENTS</h2>
      <div className="drama-list">
        {drama.length === 0 ? (
          <div className="empty">No drama yet... the calm before the storm</div>
        ) : (
          drama.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className={`drama-event ${getSeverityClass(event.severity)} fade-in`}
            >
              <span className="drama-icon">{getEventIcon(event.type)}</span>
              <div className="drama-content">
                <div className="drama-description">{event.description}</div>
                <div className="drama-meta">
                  <span className="drama-type">{event.type.replace('_', ' ')}</span>
                  <span className="drama-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DramaFeed;
