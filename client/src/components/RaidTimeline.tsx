import { useState, useCallback } from 'react';
import { RaidActivity, FireteamMember } from '../utils/bungieApi';
import { getRaidIcon, CLASS_EMOJIS } from '../utils/raidDefinitions';

interface Props {
  raids: RaidActivity[];
  onLoadFireteam: (instanceId: string) => Promise<FireteamMember[] | null>;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatKD(kills: number, deaths: number): string {
  if (deaths === 0) return kills > 0 ? '∞' : '0.00';
  return (kills / deaths).toFixed(2);
}

export default function RaidTimeline({ raids, onLoadFireteam }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fireteams, setFireteams] = useState<Record<string, FireteamMember[]>>({});
  const [loadingFireteam, setLoadingFireteam] = useState<string | null>(null);

  const handleExpand = useCallback(async (instanceId: string) => {
    if (expandedId === instanceId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(instanceId);

    if (!fireteams[instanceId]) {
      setLoadingFireteam(instanceId);
      const members = await onLoadFireteam(instanceId);
      if (members) {
        setFireteams((prev) => ({ ...prev, [instanceId]: members }));
      }
      setLoadingFireteam(null);
    }
  }, [expandedId, fireteams, onLoadFireteam]);

  if (raids.length === 0) {
    return (
      <div className="empty-state">
        <p>No raid completions found for this account.</p>
        <p className="empty-hint">Make sure you've completed raids on this character.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {raids.map((raid, idx) => {
        const isExpanded = expandedId === raid.instanceId;
        const isLoadingFt = loadingFireteam === raid.instanceId;
        const ftMembers = fireteams[raid.instanceId];

        return (
          <div
            key={raid.instanceId}
            className={`timeline-entry ${raid.isCompleted ? 'completed' : 'incomplete'} ${raid.isFirstClear ? 'first-clear' : ''}`}
          >
            <div className="timeline-marker">
              <div className="marker-dot" />
              {idx < raids.length - 1 && <div className="marker-line" />}
            </div>

            <div className="timeline-card" onClick={() => handleExpand(raid.instanceId)}>
              <div className="card-header">
                <span className="raid-icon">{getRaidIcon(raid.directorActivityHash)}</span>
                <div className="card-title-group">
                  <h3 className="raid-name">{raid.activityName}</h3>
                  <span className="raid-date">{formatDate(raid.period)}</span>
                </div>
                <div className="card-badges">
                  {raid.isFirstClear && (
                    <span className="badge first-clear-badge" title="First time clearing this raid!">
                      🏆 First Clear!
                    </span>
                  )}
                  {raid.isCompleted ? (
                    <span className="badge completed-badge">✅ Clear</span>
                  ) : (
                    <span className="badge incomplete-badge">❌ Incomplete</span>
                  )}
                </div>
              </div>

              <div className="card-stats">
                <div className="stat">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{formatDuration(raid.timePlayedSeconds)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">K/D</span>
                  <span className="stat-value">{formatKD(raid.kills, raid.deaths)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Kills</span>
                  <span className="stat-value">{raid.kills.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Deaths</span>
                  <span className="stat-value">{raid.deaths.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Assists</span>
                  <span className="stat-value">{raid.assists.toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Fireteam</span>
                  <span className="stat-value">{raid.playerCount}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="card-details" onClick={(e) => e.stopPropagation()}>
                  <h4>Fireteam</h4>
                  {isLoadingFt ? (
                    <p className="loading-text">Loading fireteam details...</p>
                  ) : ftMembers && ftMembers.length > 0 ? (
                    <div className="fireteam-grid">
                      {ftMembers.map((member, mi) => (
                        <div key={mi} className={`fireteam-member ${member.completed ? '' : 'did-not-finish'}`}>
                          <div className="member-header">
                            <span className="member-class">
                              {CLASS_EMOJIS[member.membershipType] || '👤'} {member.characterClass}
                            </span>
                            <span className="member-name">
                              {member.displayName}#{member.bungieGlobalDisplayNameCode}
                            </span>
                            {member.completed ? (
                              <span className="member-status completed">✅</span>
                            ) : (
                              <span className="member-status incomplete">❌</span>
                            )}
                          </div>
                          <div className="member-stats">
                            <span>K: {member.kills.toLocaleString()}</span>
                            <span>D: {member.deaths.toLocaleString()}</span>
                            <span>A: {member.assists.toLocaleString()}</span>
                            <span>K/D: {formatKD(member.kills, member.deaths)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="loading-text">Could not load fireteam data.</p>
                  )}
                </div>
              )}

              <div className="card-expand-hint">
                {isExpanded ? '▲ Click to collapse' : '▼ Click for fireteam details'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
