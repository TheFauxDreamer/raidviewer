import { useState, useCallback } from 'react';
import { searchPlayer, getProfile, getActivityHistory, getPGCR, getLinkedProfiles, getD1Profile, getD1ActivityHistory, getD1PGCR, BungieProfile, RaidActivity, FireteamMember } from './utils/bungieApi';
import { getRaidName, getRaidOrigin, CLASS_NAMES } from './utils/raidDefinitions';
import RaidTimeline from './components/RaidTimeline';
import RaidMemories from './components/RaidMemories';

type ViewMode = 'timeline' | 'memories';

const PLATFORM_NAMES: Record<number, string> = {
  1: 'Xbox',
  2: 'PlayStation',
  3: 'Steam',
  4: 'Battle.net',
  5: 'Stadia',
  10: 'Epic',
};

interface SelectableProfile {
  membershipType: number;
  membershipId: string;
  displayName: string;
  bungieGlobalDisplayNameCode: number;
  iconPath: string;
  platformName: string;
  game: 'd2' | 'd1';
  profileKey: string;
}

function parseBungieName(input: string): { name: string; code: number } | null {
  const trimmed = input.trim();
  const hashIndex = trimmed.lastIndexOf('#');
  if (hashIndex === -1) {
    return { name: trimmed, code: 0 };
  }
  const name = trimmed.substring(0, hashIndex).trim();
  const codeStr = trimmed.substring(hashIndex + 1).trim();
  const code = parseInt(codeStr, 10);
  if (!name || isNaN(code)) return null;
  return { name, code };
}

function getEmblemUrl(iconPath: string): string {
  if (!iconPath) return '';
  return `https://www.bungie.net${iconPath}`;
}

function profileKey(mt: number, mid: string): string {
  return `${mt}-${mid}`;
}

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [selectableProfiles, setSelectableProfiles] = useState<SelectableProfile[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [raids, setRaids] = useState<RaidActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [discoveringLinked, setDiscoveringLinked] = useState(false);
  const [activeSearchName, setActiveSearchName] = useState('');

  const handleSearch = useCallback(async () => {
    const parsed = parseBungieName(searchInput);
    if (!parsed) {
      setError('Enter a Bungie name like "Guardian#1234"');
      return;
    }
    if (parsed.code === 0) {
      setError('Include the 4-digit code after # (e.g., Guardian#1234)');
      return;
    }

    setLoading(true);
    setError('');
    setSelectableProfiles([]);
    setSelectedKeys(new Set());
    setRaids([]);

    try {
      const results = await searchPlayer(parsed.name, parsed.code);
      if (results.length === 0) {
        setError('No players found. Check the spelling and code.');
        setLoading(false);
        return;
      }

      // Build initial selectable list from D2 search results
      const initial: SelectableProfile[] = results.map((p) => ({
        membershipType: p.membershipType,
        membershipId: p.membershipId,
        displayName: p.displayName,
        bungieGlobalDisplayNameCode: p.bungieGlobalDisplayNameCode,
        iconPath: p.iconPath,
        platformName: PLATFORM_NAMES[p.membershipType] || `Platform ${p.membershipType}`,
        game: 'd2' as const,
        profileKey: profileKey(p.membershipType, p.membershipId),
      }));

      setSelectableProfiles(initial);
      setActiveSearchName(`${parsed.name}#${parsed.code}`);
      setLoading(false);

      // Discover linked D1 profiles for each D2 result
      setDiscoveringLinked(true);
      const allProfiles = [...initial];
      const seenKeys = new Set(initial.map(p => p.profileKey));

      for (const p of results) {
        try {
          const linked = await getLinkedProfiles(p.membershipType, p.membershipId);
          const d1Linked = (linked.Response?.profiles || []).filter(
            (lp: any) => (lp.membershipType === 1 || lp.membershipType === 2)
          );
          for (const d1p of d1Linked) {
            const key = profileKey(d1p.membershipType, d1p.membershipId);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              allProfiles.push({
                membershipType: d1p.membershipType,
                membershipId: d1p.membershipId,
                displayName: d1p.displayName || parsed.name,
                bungieGlobalDisplayNameCode: d1p.bungieGlobalDisplayNameCode || parsed.code,
                iconPath: d1p.iconPath || '',
                platformName: PLATFORM_NAMES[d1p.membershipType] || `Platform ${d1p.membershipType}`,
                game: 'd1' as const,
                profileKey: key,
              });
            }
          }
        } catch {
          // skip profiles that fail
        }
      }

      setSelectableProfiles(allProfiles);
      setDiscoveringLinked(false);
    } catch (e: any) {
      setError(e.message || 'Search failed');
      setLoading(false);
    }
  }, [searchInput]);

  const toggleProfile = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleViewRaids = useCallback(async () => {
    if (selectedKeys.size === 0) {
      setError('Select at least one profile.');
      return;
    }

    setRaids([]);
    setLoading(true);
    setError('');
    setProgress('Fetching raids...');

    const allRaids: RaidActivity[] = [];
    const selected = selectableProfiles.filter(p => selectedKeys.has(p.profileKey));

    try {
      for (const sp of selected) {
        if (sp.game === 'd2') {
          // --- Destiny 2 raids ---
          const { characters } = await getProfile(sp.membershipType, sp.membershipId);
          for (const char of characters) {
            setProgress(`Loading D2 raids (${sp.platformName}, ${CLASS_NAMES[char.classType] || 'Character'})...`);

            let page = 0;
            let hasMore = true;
            while (hasMore) {
              const history = await getActivityHistory(
                sp.membershipType, sp.membershipId, char.characterId, page, 250
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
        } else {
          // --- Destiny 1 raids ---
          setProgress(`Loading D1 raids (${sp.platformName})...`);
          try {
            const d1Profile = await getD1Profile(sp.membershipType, sp.membershipId);
            const d1Chars = d1Profile.Response?.data?.characters || [];
            for (const d1Char of d1Chars) {
              const charId = d1Char.characterBase?.characterId;
              if (!charId) continue;
              let page = 0;
              let hasMore = true;
              while (hasMore) {
                const history = await getD1ActivityHistory(
                  sp.membershipType, sp.membershipId, charId, page, 250
                );
                if (!history.Response?.data?.activities || history.Response.data.activities.length === 0) {
                  hasMore = false;
                  break;
                }
                for (const act of history.Response.data.activities) {
                  const activityHash = act.activityHash || 0;
                  const raidName = getRaidName(activityHash);
                  if (!activityHash || raidName.startsWith('Unknown')) continue;
                  const isCompleted = act.values?.completed?.basic?.value === 1 ||
                                      act.values?.completionReason?.basic?.value === 0;
                  allRaids.push({
                    instanceId: act.activityDetails?.instanceId || '',
                    period: act.period,
                    activityHash,
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
            // D1 profile may not exist
          }
        }
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
  }, [selectedKeys, selectableProfiles]);

  const handleLoadFireteam = useCallback(async (instanceId: string, origin?: string) => {
    try {
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
    setRaids([]);
    setSelectableProfiles([]);
    setSelectedKeys(new Set());
    setActiveSearchName('');
  };

  const hasResults = selectableProfiles.length > 0;
  const d2Profiles = selectableProfiles.filter(p => p.game === 'd2');
  const d1Profiles = selectableProfiles.filter(p => p.game === 'd1');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Destiny Raid Viewer</h1>
        <p className="subtitle">Your complete D1 & D2 raid history in chronological order</p>
      </header>

      <main className="app-main">
        {raids.length === 0 && !loading ? (
          <div className="search-section">
            <div className="search-card">
              <h2>Look up a player</h2>
              <p className="search-hint">
                Enter a Bungie name with its code (e.g., Guardian#1234)
              </p>
              <div className="search-inputs">
                <input
                  type="text"
                  placeholder="Guardian#1234"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input search-single"
                />
                <button onClick={handleSearch} disabled={loading} className="search-btn">
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {error && <div className="error-msg">{error}</div>}

              {hasResults && (
                <div className="profile-selection">
                  <div className="profile-selection-header">
                    <h3>Select profiles to include</h3>
                    {discoveringLinked && (
                      <span className="discovering-hint">Discovering linked D1 accounts...</span>
                    )}
                  </div>
                  <p className="selection-hint">
                    Check all the accounts you want raid data from. D1 and D2 raids will be merged into one timeline.
                  </p>

                  {d2Profiles.length > 0 && (
                    <>
                      <h4 className="profile-group-label">Destiny 2</h4>
                      {d2Profiles.map((p) => {
                        const emblemUrl = getEmblemUrl(p.iconPath);
                        const checked = selectedKeys.has(p.profileKey);
                        return (
                          <label key={p.profileKey} className={`profile-checkbox ${checked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProfile(p.profileKey)}
                              className="checkbox-input"
                            />
                            {emblemUrl && (
                              <img src={emblemUrl} alt="" className="profile-emblem" loading="lazy" />
                            )}
                            <span className="profile-info">
                              <span className="profile-name">
                                {p.displayName}#{p.bungieGlobalDisplayNameCode}
                              </span>
                              <span className="profile-platform">{p.platformName}</span>
                            </span>
                          </label>
                        );
                      })}
                    </>
                  )}

                  {d1Profiles.length > 0 && (
                    <>
                      <h4 className="profile-group-label">Destiny 1 (linked)</h4>
                      {d1Profiles.map((p) => {
                        const emblemUrl = getEmblemUrl(p.iconPath);
                        const checked = selectedKeys.has(p.profileKey);
                        return (
                          <label key={p.profileKey} className={`profile-checkbox ${checked ? 'checked' : ''}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProfile(p.profileKey)}
                              className="checkbox-input"
                            />
                            {emblemUrl && (
                              <img src={emblemUrl} alt="" className="profile-emblem" loading="lazy" />
                            )}
                            <span className="profile-info">
                              <span className="profile-name">
                                {p.displayName}#{p.bungieGlobalDisplayNameCode}
                              </span>
                              <span className="profile-platform">{p.platformName}</span>
                            </span>
                            <span className="game-badge d1-badge">D1</span>
                          </label>
                        );
                      })}
                    </>
                  )}

                  <button
                    onClick={handleViewRaids}
                    disabled={selectedKeys.size === 0 || loading}
                    className="view-raids-btn"
                  >
                    {loading ? 'Loading...' : `View Raids (${selectedKeys.size} profile${selectedKeys.size !== 1 ? 's' : ''} selected)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <button onClick={handleBack} className="back-btn">← Back</button>
              <h2>
                {activeSearchName}
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
              <RaidTimeline raids={raids} onLoadFireteam={handleLoadFireteam} />
            ) : (
              <RaidMemories raids={raids} playerName={activeSearchName} onLoadFireteam={handleLoadFireteam} />
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
