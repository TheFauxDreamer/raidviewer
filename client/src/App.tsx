import { useState, useCallback } from 'react';
import { searchPlayer, getProfile, getActivityHistory, getPGCR, getLinkedProfiles, getD1Profile, getD1ActivityHistory, getD1PGCR, BungieProfile, RaidActivity, FireteamMember } from '../utils/bungieApi';
import { getRaidName, getRaidOrigin, CLASS_NAMES } from '../utils/raidDefinitions';
import RaidTimeline from './RaidTimeline';
import RaidMemories from './RaidMemories';

type ViewMode = 'timeline' | 'memories';

export default function App() {
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [profiles, setProfiles] = useState<BungieProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BungieProfile | null>(null);
  const [raids, setRaids] = useState<RaidActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

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

      // --- Destiny 2 raids ---
      for (const char of characters) {
        setProgress(`Loading D2 raids for ${CLASS_NAMES[char.classType] || 'Character'}...`);

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

            if (!directorHash || raidName.startsWith('Unknown')) continue;

            const isCompleted = act.values?.completed?.basic?.value === 1 ||
                                act.values?.completionReason?.basic?.value === 0;

            allRaids.push({
              instanceId: act.activityDetails.instanceId,
              period: act.period,
              activityHash: act.activityDetails.referenceId,
              activityName: raidName,
              directorActivityHash: directorHash,
              origin: getRaidOrigin(directorHash),
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
              isFirstClear: false,
            });
          }

          page++;
          if (page > 20) hasMore = false;
        }
      }

      // --- Destiny 1 raids (via linked profiles) ---
      try {
        const linked = await getLinkedProfiles(profile.membershipType, profile.membershipId);
        const d1Profiles = linked.Response?.profiles?.filter((p: any) =>
          p.membershipType === 1 || p.membershipType === 2
        ) || [];

        for (const d1p of d1Profiles) {
          setProgress(`Loading D1 raids...`);

          try {
            const d1Profile = await getD1Profile(d1p.membershipType, d1p.membershipId);
            const d1Chars = d1Profile.Response?.data?.characters || [];

            for (const d1Char of d1Chars) {
              const charId = d1Char.characterBase?.characterId;
              if (!charId) continue;

              let page = 0;
              let hasMore = true;

              while (hasMore) {
                const history = await getD1ActivityHistory(
                  d1p.membershipType,
                  d1p.membershipId,
                  charId,
                  page,
                  250
                );

                if (!history.Response?.data?.activities || history.Response.data.activities.length === 0) {
                  hasMore = false;
                  break;
                }

                for (const act of history.Response.data.activities) {
                  // D1 uses activityHash directly (not directorActivityHash)
                  const activityHash = act.activityHash || 0;
                  const raidName = getRaidName(activityHash);

                  if (!activityHash || raidName.startsWith('Unknown')) continue;

                  const isCompleted = act.values?.completed?.basic?.value === 1 ||
                                      act.values?.completionReason?.basic?.value === 0;

                  allRaids.push({
                    instanceId: act.activityDetails?.instanceId || '',
                    period: act.period,
                    activityHash: activityHash,
                    activityName: raidName,
                    directorActivityHash: activityHash,
                    origin: getRaidOrigin(activityHash),
                    mode: 4,
                    isCompleted,
                    kills: act.values?.kills?.basic?.value || 0,
                    deaths: act.values?.deaths?.basic?.value || 0,
                    assists: act.values?.assists?.basic?.value || 0,
                    timePlayedSeconds: act.values?.timePlayedSeconds?.basic?.value || 0,
                    completionReason: act.values?.completionReason?.basic?.value || -1,
                    standing: act.values?.standing?.basic?.value || 0,
                    playerCount: act.values?.playerCount?.basic?.value || 0,
                    fireteamMembers: [],
                    isFirstClear: false,
                  });
                }

                page++;
                if (page > 20) hasMore = false;
              }
            }
          } catch {
            // D1 profile may not exist for this linked account — skip silently
          }
        }
      } catch {
        // Linked profiles may fail — skip D1 data
      }

      // Sort oldest-first to find the true first clear of each raid
      allRaids.sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());

      const firstClearMap = new Map<string, boolean>();
      for (const raid of allRaids) {
        if (raid.isCompleted && !firstClearMap.has(raid.activityName)) {
          raid.isFirstClear = true;
          firstClearMap.set(raid.activityName, true);
        }
      }

      // Sort back to newest-first for display
      allRaids.sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());

      setRaids(allRaids);
      setProgress('');
    } catch (e: any) {
      setError(e.message || 'Failed to load raid history');
    }
    setLoading(false);
  }, []);

  const handleLoadFireteam = useCallback(async (instanceId: string, origin?: string) => {
    try {
      // Use D1 PGCR endpoint for D1 raids
      const pgcr = origin === 'd1'
        ? await getD1PGCR(instanceId)
        : await getPGCR(instanceId);

      const entries = pgcr.Response?.entries || pgcr.Response?.data?.entries || [];

      const members: FireteamMember[] = entries.map((entry: any) => ({
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
        <h1>Destiny 2 Raid Viewer</h1>
        <p className="subtitle">Your complete raid history in chronological order</p>
      </header>

      <main className="app-main">
        {!selectedProfile ? (
          <div className="search-section">
            <div className="search-card">
              <h2>Look up a player</h2>
              <p className="search-hint">
                Enter a Bungie name (e.g., Guardian#1234)
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
                  <h3>Select platform:</h3>
                  {profiles.map((p) => (
                    <button
                      key={`${p.membershipType}-${p.membershipId}`}
                      className="profile-btn"
                      onClick={() => handleSelectProfile(p)}
                    >
                      <span className="platform-badge">
                        {p.membershipType === 1 ? 'Xbox' :
                         p.membershipType === 2 ? 'PlayStation' :
                         p.membershipType === 3 ? 'Steam' :
                         p.membershipType === 4 ? 'Battle.net' :
                         p.membershipType === 5 ? 'Stadia' :
                         p.membershipType === 10 ? 'Epic' :
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
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <button onClick={handleBack} className="back-btn">← Back</button>
              <h2>
                {selectedProfile.displayName}#{selectedProfile.bungieGlobalDisplayNameCode}
                <span className="raid-count">{raids.length} raids</span>
              </h2>
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                  onClick={() => setViewMode('timeline')}
                >
                  Timeline
                </button>
                <button
                  className={`toggle-btn ${viewMode === 'memories' ? 'active' : ''}`}
                  onClick={() => setViewMode('memories')}
                >
                  Memories
                </button>
              </div>
            </div>

            {loading && progress && <div className="loading-bar">{progress}</div>}

            {viewMode === 'timeline' ? (
              <RaidTimeline
                raids={raids}
                onLoadFireteam={handleLoadFireteam}
              />
            ) : (
              <RaidMemories
                raids={raids}
                playerName={`${selectedProfile.displayName}#${selectedProfile.bungieGlobalDisplayNameCode}`}
                onLoadFireteam={handleLoadFireteam}
              />
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Not affiliated with Bungie. {' '}
          <a href="https://www.bungie.net/en/Application" target="_blank" rel="noopener noreferrer">
            Get an API key
          </a>
        </p>
      </footer>
    </div>
  );
}
