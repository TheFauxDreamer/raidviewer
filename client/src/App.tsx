import { useState, useCallback } from 'react';
import { searchPlayer, getProfile, getActivityHistory, getPGCR, BungieProfile, RaidActivity, FireteamMember } from '../utils/bungieApi';
import { getRaidName, getRaidIcon, CLASS_NAMES, CLASS_EMOJIS } from '../utils/raidDefinitions';
import RaidTimeline from './RaidTimeline';

export default function App() {
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [profiles, setProfiles] = useState<BungieProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BungieProfile | null>(null);
  const [raids, setRaids] = useState<RaidActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const handleSearch = useCallback(async () => {
    if (!searchName.trim() || !searchCode.trim()) return;
    setLoading(true);
    setError('');
    setProfiles([]);
    setSelectedProfile(null);
    setRaids([]);

    try {
      const code = parseInt(searchCode, 10);
      if (isNaN(code)) {
        setError('Please enter a valid Bungie name code (e.g., 1234)');
        setLoading(false);
        return;
      }
      const results = await searchPlayer(searchName.trim(), code);
      if (results.length === 0) {
        setError('No players found. Check the name and code.');
      } else {
        setProfiles(results);
      }
    } catch (e: any) {
      setError(e.message || 'Search failed');
    }
    setLoading(false);
  }, [searchName, searchCode]);

  const handleSelectProfile = useCallback(async (profile: BungieProfile) => {
    setSelectedProfile(profile);
    setRaids([]);
    setLoading(true);
    setError('');
    setProgress('Fetching characters...');

    try {
      const { characters } = await getProfile(profile.membershipType, profile.membershipId);
      if (characters.length === 0) {
        setError('No characters found on this account.');
        setLoading(false);
        return;
      }

      const allRaids: RaidActivity[] = [];
      const firstClearMap = new Map<string, boolean>(); // raidName -> already seen?

      for (const char of characters) {
        setProgress(`Loading raids for ${CLASS_NAMES[char.classType] || 'Character'}...`);

        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const history = await getActivityHistory(
            profile.membershipType,
            profile.membershipId,
            char.characterId,
            page,
            250
          );

          if (!history.Response?.activities || history.Response.activities.length === 0) {
            hasMore = false;
            break;
          }

          for (const act of history.Response.activities) {
            const directorHash = act.activityDetails?.directorActivityHash || 0;
            const raidName = getRaidName(directorHash);

            // Only include known raids
            if (!directorHash || raidName.startsWith('Unknown')) continue;

            const isCompleted = act.values?.completed?.basic?.value === 1 ||
                                act.values?.completionReason?.basic?.value === 0;

            // Determine if this is the first clear of this raid
            const isFirstClear = isCompleted && !firstClearMap.has(raidName);
            if (isFirstClear) {
              firstClearMap.set(raidName, true);
            }

            const raidEntry: RaidActivity = {
              instanceId: act.activityDetails.instanceId,
              period: act.period,
              activityHash: act.activityDetails.referenceId,
              activityName: raidName,
              directorActivityHash: directorHash,
              mode: act.activityDetails.mode,
              isCompleted,
              kills: act.values?.kills?.basic?.value || 0,
              deaths: act.values?.deaths?.basic?.value || 0,
              assists: act.values?.assists?.basic?.value || 0,
              timePlayedSeconds: act.values?.timePlayedSeconds?.basic?.value || 0,
              completionReason: act.values?.completionReason?.basic?.value || -1,
              standing: act.values?.standing?.basic?.value || 0,
              playerCount: act.values?.playerCount?.basic?.value || 0,
              fireteamMembers: [],
              isFirstClear,
            };

            allRaids.push(raidEntry);
          }

          page++;
          // Safety: don't fetch too many pages
          if (page > 20) hasMore = false;
        }
      }

      // Sort by date, newest first
      allRaids.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());

      setRaids(allRaids);
      setProgress('');
    } catch (e: any) {
      setError(e.message || 'Failed to load raid history');
    }
    setLoading(false);
  }, []);

  const handleLoadFireteam = useCallback(async (instanceId: string) => {
    try {
      const pgcr = await getPGCR(instanceId);
      if (!pgcr.Response?.entries) return null;

      const members: FireteamMember[] = pgcr.Response.entries.map((entry: any) => ({
        displayName: entry.player?.destinyUserInfo?.displayName || entry.player?.destinyUserInfo?.bungieGlobalDisplayName || 'Unknown',
        bungieGlobalDisplayNameCode: entry.player?.destinyUserInfo?.bungieGlobalDisplayNameCode || 0,
        membershipId: entry.player?.destinyUserInfo?.membershipId || '',
        membershipType: entry.player?.destinyUserInfo?.membershipType || 0,
        characterClass: CLASS_NAMES[entry.player?.classType] || 'Unknown',
        lightLevel: entry.player?.lightLevel || 0,
        kills: entry.values?.kills?.basic?.value || 0,
        deaths: entry.values?.deaths?.basic?.value || 0,
        assists: entry.values?.assists?.basic?.value || 0,
        completed: entry.values?.completed?.basic?.value === 1,
        timePlayedSeconds: entry.values?.timePlayedSeconds?.basic?.value || 0,
        emblemIcon: entry.player?.destinyUserInfo?.iconPath || '',
      }));

      return members;
    } catch {
      return null;
    }
  }, []);

  const handleBack = () => {
    setSelectedProfile(null);
    setRaids([]);
    setProfiles([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo-icon">⚔️</span>
          Destiny 2 Raid Viewer
        </h1>
        <p className="subtitle">Your complete raid history, chronologically ordered</p>
      </header>

      <main className="app-main">
        {!selectedProfile ? (
          <div className="search-section">
            <div className="search-card">
              <h2>Find Your Guardian</h2>
              <p className="search-hint">
                Enter your Bungie name exactly as it appears in-game (e.g., Guardian#1234)
              </p>
              <div className="search-inputs">
                <input
                  type="text"
                  placeholder="Bungie Name"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input"
                />
                <span className="search-separator">#</span>
                <input
                  type="text"
                  placeholder="1234"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input search-code"
                  maxLength={5}
                />
                <button onClick={handleSearch} disabled={loading} className="search-btn">
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {error && <div className="error-msg">{error}</div>}

              {profiles.length > 0 && (
                <div className="profile-list">
                  <h3>Select your platform:</h3>
                  {profiles.map((p) => (
                    <button
                      key={`${p.membershipType}-${p.membershipId}`}
                      className="profile-btn"
                      onClick={() => handleSelectProfile(p)}
                    >
                      <span className="platform-badge">
                        {p.membershipType === 1 ? '🎮 Xbox' :
                         p.membershipType === 2 ? '🎮 PSN' :
                         p.membershipType === 3 ? '💻 Steam' :
                         p.membershipType === 4 ? '🎮 Battle.net' :
                         p.membershipType === 5 ? '🎮 Stadia' :
                         p.membershipType === 10 ? '🎮 Epic' :
                         `Platform ${p.membershipType}`}
                      </span>
                      <span className="profile-name">
                        {p.displayName}#{p.bungieGlobalDisplayNameCode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="info-card">
              <h3>How it works</h3>
              <ol>
                <li>Enter your Bungie name (the one shown in-game)</li>
                <li>Select your platform</li>
                <li>We fetch ALL your raid completions across all characters</li>
                <li>Raids are shown chronologically with first-time clear flags 🏆</li>
                <li>Click any raid to see detailed stats & fireteam members</li>
              </ol>
              <p className="setup-note">
                <strong>Setup:</strong> You need a Bungie API key. Copy <code>server/.env.example</code> to{' '}
                <code>server/.env</code> and add your key from{' '}
                <a href="https://www.bungie.net/en/Application" target="_blank" rel="noopener noreferrer">
                  bungie.net/en/Application
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <button onClick={handleBack} className="back-btn">← Back to Search</button>
              <h2>
                {selectedProfile.displayName}#{selectedProfile.bungieGlobalDisplayNameCode}
                <span className="raid-count">{raids.length} raids found</span>
              </h2>
            </div>

            {loading && progress && <div className="loading-bar">{progress}</div>}

            <RaidTimeline
              raids={raids}
              onLoadFireteam={handleLoadFireteam}
            />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Destiny 2 Raid Viewer · Not affiliated with Bungie ·{' '}
          <a href="https://www.bungie.net/en/Application" target="_blank" rel="noopener noreferrer">
            Get API Key
          </a>
        </p>
      </footer>
    </div>
  );
}
