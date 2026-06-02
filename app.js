const CLASS_NAMES = { 0: 'Titan', 1: 'Hunter', 2: 'Warlock', 3: 'Unknown' };
const RACE_NAMES = { 0: 'Human', 1: 'Awoken', 2: 'Exo', 3: 'Unknown' };
const PLATFORM_NAMES = { 1: 'Xbox', 2: 'PSN', 3: 'Steam', 4: 'Blizzard', 5: 'Stadia', 6: 'Epic', 254: 'BungieNet', 0: 'None' };

// ── Destiny 1 Raid definitions ───────────────────────────────────────────────
// D1 uses mode 4 (Raid) for all raids. These are the known D1 raid names.
// We tag them with [D1] prefix to differentiate from D2 reprises.
const D1_RAID_NAMES = {
  // Vault of Glass (original D1 — different from D2 reprise)
  '3585877785': 'Vault of Glass',
  '3585877784': 'Vault of Glass',
  '1699791572': 'Vault of Glass',
  // Crota's End
  '1836893116': "Crota's End",
  '1836893119': "Crota's End",
  '1369718958': "Crota's End",
  // King's Fall (original D1 — different from D2 reprise)
  '1733556769': "King's Fall",
  '1733556770': "King's Fall",
  '1733556768': "King's Fall",
  // Wrath of the Machine
  '2204484102': 'Wrath of the Machine',
  '2204484101': 'Wrath of the Machine',
  '2204484100': 'Wrath of the Machine',
};

// D1 raids that were later reprised in D2 — same name, treated as unique via game tag
const D1_REPRISED_IN_D2 = new Set(["Vault of Glass", "King's Fall", "Crota's End"]);

// Shattered Throne (Forsaken, Sep 2018) launched as a Story mission (mode 2), not a Raid or
// Dungeon. The mode 82 (Dungeon) category didn't exist yet, and these earliest runs were never
// recorded under mode 4 (Raid) either — they only appear in the Story activity feed.
// We fetch mode 2 separately and filter by these hashes to capture those 2018 clears.
// Source: Bungie manifest / dungeon.report community research.
const SHATTERED_THRONE_HASHES = new Set([
  '2032534090', '2032534091', '2032534093',
]);

// Known D2 dungeon referenceIds that shipped BEFORE mode 82 (Dungeon) existed in the API
// but were recorded under mode 4 (Raid) rather than Story.
// Pit of Heresy (Shadowkeep, Oct 2019) falls into this category.
// We identify them by hash so they're correctly classified as dungeons in our UI.
// Source: Bungie manifest / dungeon.report community research.
const LEGACY_DUNGEON_HASHES = new Set([
  // Pit of Heresy (Shadowkeep, Oct 2019) — all difficulty variants
  '1375089621', '785700673', '1107532819',
]);

let state = {
  membershipId: '', membershipType: '',
  displayName: '', displayNameCode: '', characters: [], activeCharId: '',
  loadAllD2: false,         // true = fetch all D2 characters
  allPlatformMemberships: [], // all cross-save memberships for this player
  loadAllPlatforms: false,  // true = fetch history from every cross-save platform
  // D1 state
  d1MembershipId: '', d1MembershipType: '',
  d1Characters: [], d1ActiveCharId: '', d1CharacterName: '',
  d1Activities: [],
  loadAllD1: false,         // true = fetch all D1 characters
};
// Map charId -> class name (populated for both D1 and D2)
const charClassMap = {};

// Name cache: hash → string
const nameCache = {};

// A true raid/dungeon clear requires BOTH completed=1 (character stayed to the end)
// AND completionReason=0 (the objective was actually completed, not abandoned/wiped).
// completionReason > 0 means the player returned to orbit or the activity ended without success.
function isActualClear(values) {
  const completed       = (values?.completed?.basic?.value ?? 0) === 1;
  const completionReason = values?.completionReason?.basic?.value ?? 0;
  return completed && completionReason === 0;
}

// ── API proxy helpers ──────────────────────────────────────────────────────
// All requests go through the Netlify Function, which injects the API key
// server-side from the BUNGIE_API_KEY environment variable.

const PROXY = '/.netlify/functions/bungie-proxy';

function apiFetch(path) {
  return fetch(`${PROXY}?path=${encodeURIComponent(path)}`).then(r => r.json());
}

function apiPost(path, body) {
  return fetch(`${PROXY}?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json());
}

// D1 uses the same /Platform base as D2 — paths are /Destiny/... not /Destiny2/...
// The proxy already points to https://www.bungie.net/Platform so no prefix needed.
function d1ApiFetch(path) {
  return apiFetch(path);
}

// ── D1 Setup ─────────────────────────────────────────────────────────────────

async function lookupD1Characters() {
  const platform = document.getElementById('d1Platform').value;
  const displayName = document.getElementById('d1DisplayName').value.trim();
  const msgEl = document.getElementById('d1StatusMsg');
  const playerList = document.getElementById('d1PlayerList');
  msgEl.style.display = 'none';
  playerList.style.display = 'none';
  document.getElementById('d1CharSelect').style.display = 'none';

  if (!platform) {
    msgEl.textContent = 'Please select a platform (Xbox or PlayStation).';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.display = 'block';
    return;
  }
  if (!displayName) {
    msgEl.textContent = 'Please enter your gamertag or PSN ID.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.display = 'block';
    return;
  }

  msgEl.textContent = 'Searching for D1 guardian...';
  msgEl.style.color = 'var(--ghost)';
  msgEl.style.display = 'block';

  try {
    // Step 1: Search by display name to get membershipId(s)
    const searchData = await d1ApiFetch(`/Destiny/SearchDestinyPlayer/${platform}/${encodeURIComponent(displayName)}/`);

    if (searchData.ErrorCode !== 1) {
      msgEl.textContent = `D1 API error: ${searchData.Message || 'unknown error'}`;
      msgEl.style.color = 'var(--danger)';
      return;
    }

    const players = searchData.Response || [];
    if (!players.length) {
      msgEl.textContent = `No D1 guardian found for "${displayName}" on ${platform === '1' ? 'Xbox' : 'PlayStation'}. Check the name and platform.`;
      msgEl.style.color = 'var(--danger)';
      return;
    }

    msgEl.style.display = 'none';

    if (players.length === 1) {
      // Only one match — go straight to character select
      await loadD1AccountSummary(platform, players[0].membershipId, players[0].displayName);
    } else {
      // Multiple matches — show a pick list
      playerList.innerHTML = '';
      players.forEach(p => {
        const row = document.createElement('div');
        row.style.cssText = 'padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background 0.15s;font-family:Share Tech Mono,monospace;font-size:13px;color:var(--ghost);';
        row.textContent = p.displayName;
        const code = document.createElement('span');
        code.style.cssText = 'font-size:11px;color:var(--muted);';
        code.textContent = p.membershipId;
        row.appendChild(code);
        row.onmouseover = () => row.style.background = 'rgba(75,143,200,0.08)';
        row.onmouseout  = () => row.style.background = '';
        row.onclick = () => {
          playerList.style.display = 'none';
          loadD1AccountSummary(platform, p.membershipId, p.displayName);
        };
        playerList.appendChild(row);
      });
      playerList.style.display = 'block';
    }
  } catch (e) {
    msgEl.textContent = 'Search failed. The D1 API may be temporarily unavailable.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.display = 'block';
  }
}

async function loadD1AccountSummary(platform, membershipId, displayName) {
  const msgEl = document.getElementById('d1StatusMsg');
  msgEl.textContent = `Loading ${displayName}'s D1 profile...`;
  msgEl.style.color = 'var(--ghost)';
  msgEl.style.display = 'block';

  try {
    const data = await d1ApiFetch(`/Destiny/${platform}/Account/${membershipId}/Summary/`);

    if (data.ErrorCode !== 1 || !data.Response?.data) {
      msgEl.textContent = 'Could not load D1 profile. Try again.';
      msgEl.style.color = 'var(--danger)';
      return;
    }

    const account = data.Response.data;
    const chars = account.characters || [];
    if (!chars.length) {
      msgEl.textContent = 'No characters found on this D1 account.';
      msgEl.style.color = 'var(--danger)';
      return;
    }

    state.d1MembershipType = platform;
    state.d1MembershipId = membershipId;
    state.d1Characters = chars;

    // Render character picker
    const grid = document.getElementById('d1CharGrid');
    grid.innerHTML = '';
    chars.forEach(c => {
      const cls = CLASS_NAMES[c.characterBase?.classType] || 'Unknown';
      const light = c.characterBase?.powerLevel || c.characterLevel || '?';
      const race = RACE_NAMES[c.characterBase?.raceType] || '';
      const charId = c.characterBase?.characterId;
      const div = document.createElement('div');
      div.className = 'd1-char-option';
      div.dataset.charid = charId;
      div.innerHTML = `<div class="char-class ${cls.toLowerCase()}">${cls}</div>
        <div class="char-light">${light}</div>
        <div class="char-race">${race}</div>`;
      div.onclick = () => selectD1Char(charId, cls, displayName);
      grid.appendChild(div);
    });

    msgEl.style.display = 'none';
    document.getElementById('d1CharSelect').style.display = 'block';
    // Show "Load All" option if more than one D1 character
    document.getElementById('d1AllCharWrap').style.display =
      chars.length > 1 ? 'block' : 'none';
  } catch (e) {
    msgEl.textContent = 'Failed to load D1 profile.';
    msgEl.style.color = 'var(--danger)';
    msgEl.style.display = 'block';
  }
}

function selectD1Char(charId, cls, displayName) {
  state.loadAllD1 = false;
  state.d1ActiveCharId = String(charId);
  // Populate charClassMap for all D1 characters (keys as strings)
  state.d1Characters.forEach(c => {
    const cid = c.characterBase?.characterId;
    if (cid) charClassMap[String(cid)] = CLASS_NAMES[c.characterBase?.classType] || 'Unknown';
  });
  document.querySelectorAll('.d1-char-option').forEach(el => {
    el.classList.toggle('active', el.dataset.charid === charId);
  });
  const allBtn = document.getElementById('loadAllD1Btn');
  if (allBtn) allBtn.classList.remove('active');
  const platformName = PLATFORM_NAMES[parseInt(state.d1MembershipType)] || 'Unknown';
  document.getElementById('d1ConnectedText').textContent =
    `${displayName || 'D1 Guardian'} · ${cls} · ${platformName}`;
  document.getElementById('d1Connected').style.display = 'flex';
  document.getElementById('d1CharSelect').style.display = 'none';
  document.getElementById('d1StatusMsg').style.display = 'none';
  // Show profile section and load history regardless of D2
  showProfileSection();
  loadAllHistory();
}

function clearD1() {
  state.d1MembershipId = '';
  state.d1MembershipType = '';
  state.d1Characters = [];
  state.d1ActiveCharId = '';
  state.d1Activities = [];
  // Clear cached definitions so they don't bleed into a new D1 account lookup
  Object.keys(d1ActivityDefs).forEach(k => delete d1ActivityDefs[k]);
  state.loadAllD1 = false;
  document.getElementById('d1Platform').value = '';
  document.getElementById('d1DisplayName').value = '';
  document.getElementById('d1Connected').style.display = 'none';
  document.getElementById('d1CharSelect').style.display = 'none';
  document.getElementById('d1PlayerList').style.display = 'none';
  document.getElementById('d1StatusMsg').style.display = 'none';
  document.getElementById('sumD1Stat').style.display = 'none';
  if (state.activeCharId || state.d1ActiveCharId) loadAllHistory();
}

function clearD2() {
  state.membershipId = '';
  state.membershipType = '';
  state.displayName = '';
  state.displayNameCode = '';
  state.characters = [];
  state.activeCharId = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('resultsList').style.display = 'none';
  document.getElementById('d2Connected').style.display = 'none';
  document.getElementById('d2CharSection').style.display = 'none';
  document.getElementById('charTabs').innerHTML = '';
  state.loadAllD2 = false;
  // Update header to reflect D1-only state, or hide profile if nothing left
  if (state.d1ActiveCharId) {
    updateProfileHeader();
    loadAllHistory();
  } else {
    document.getElementById('profile-section').style.display = 'none';
  }
}

// ── D1 Activity Fetch ────────────────────────────────────────────────────────

// Accumulated D1 activity definitions from API (populated by fetchAllD1Pages)
// Shape: { [hashString]: { activityName, activityDescription, activityTypeHashName, ... } }
const d1ActivityDefs = {};

async function fetchAllD1Pages(mode, label, charId) {
  const all = [];
  let page = 0;
  // charId from d1Characters is stored as a string in characterBase.characterId
  // Ensure string comparison works correctly
  const charIdStr = String(charId);
  const d1Char = state.d1Characters.find(c =>
    String(c.characterBase?.characterId) === charIdStr
  );
  const cls = CLASS_NAMES[d1Char?.characterBase?.classType] || 'Guardian';
  while (true) {
    showStatus(`Scanning D1 ${label} (${cls})... page ${page + 1}`, 'info', true);
    let data;
    try {
      data = await d1ApiFetch(
        `/Destiny/Stats/ActivityHistory/${state.d1MembershipType}/${state.d1MembershipId}/${charIdStr}/` +
        `?count=250&mode=${mode}&page=${page}&definitions=true`
      );
    } catch (e) {
      console.warn(`D1 fetch error for char ${charIdStr} page ${page}:`, e);
      break;
    }

    if (!data || data.ErrorCode !== 1) {
      console.warn(`D1 API non-1 response for char ${charIdStr} page ${page}:`, data?.ErrorCode, data?.Message);
      break;
    }

    // D1 response shape with definitions=true:
    // data.Response.data.activities  (activities array)
    // data.Response.definitions.activities  (hash -> definition map)
    const resp = data.Response?.data || {};
    const acts = Array.isArray(resp.activities) ? resp.activities : [];

    // Merge activity definitions keyed by hash string
    const defs = data.Response?.definitions?.activities || {};
    Object.assign(d1ActivityDefs, defs);

    // Tag each activity with the character it came from
    acts.forEach(a => { a._characterId = charIdStr; });
    all.push(...acts);
    if (acts.length < 250) break;
    page++;
  }
  return all;
}

function resolveD1Name(act) {
  const refId = String(act.activityDetails?.referenceId || '');
  const dirHash = String(act.activityDetails?.directorActivityHash || '');

  // 1. Try API-returned definitions first (most accurate)
  const defByRef  = d1ActivityDefs[refId];
  const defByDir  = d1ActivityDefs[dirHash];
  const apiName   = defByRef?.activityName || defByDir?.activityName;
  if (apiName && apiName !== 'Unknown' && apiName.trim() !== '') return apiName;

  // 2. Fall back to our hardcoded D1 hash map
  if (D1_RAID_NAMES[refId])  return D1_RAID_NAMES[refId];
  if (D1_RAID_NAMES[dirHash]) return D1_RAID_NAMES[dirHash];

  // 3. Last resort
  return 'D1 Raid';
}

// Normalize D1 activity to a shape compatible with our renderer
function normalizeD1Activity(act) {
  const vals = act.values || {};
  return {
    _isD1: true,
    _characterId: act._characterId || null,
    period: act.period,
    activityDetails: {
      instanceId: act.activityDetails?.instanceId || act.activityDetails?.referenceId + '_' + act.period,
      referenceId: act.activityDetails?.referenceId,
      directorActivityHash: act.activityDetails?.directorActivityHash,
    },
    _d1Name: resolveD1Name(act),
    // D1 API does not reliably expose startingPhaseIndex — treat all D1 runs as full runs
    _isCheckpoint: false,
    values: {
      completed:               { basic: { value: vals.completed?.basic?.value ?? 0 } },
      completionReason:        { basic: { value: vals.completionReason?.basic?.value ?? 0 } },
      kills:                   { basic: { value: vals.kills?.basic?.value || 0 } },
      deaths:                  { basic: { value: vals.deaths?.basic?.value || 0 } },
      activityDurationSeconds: { basic: { value: vals.activityDurationSeconds?.basic?.value || 0 } },
      playerCount:             { basic: { value: vals.playerCount?.basic?.value || 1 } },
    },
  };
}

function showStatus(msg, type = 'info', loading = false) {
  const bar = document.getElementById('statusBar');
  bar.className = 'status-bar ' + type;
  document.getElementById('statusText').textContent = msg;
  document.getElementById('statusSpinner').style.display = loading ? 'block' : 'none';
  bar.style.display = 'flex';
}

function hideStatus() { document.getElementById('statusBar').style.display = 'none'; }

// ── Search ──────────────────────────────────────────────────────────────────

async function search() {
  const raw = document.getElementById('searchInput').value.trim();
  if (!raw) return;

  document.getElementById('resultsList').style.display = 'none';
  document.getElementById('profile-section').style.display = 'none';
  showStatus('Searching for guardian...', 'info', true);

  const hi = raw.lastIndexOf('#');
  const hasCode = hi > 0 && /^\d{1,4}$/.test(raw.slice(hi + 1).trim());

  try {
    // results: array of objects with { membershipId, membershipType,
    //   bungieGlobalDisplayName, bungieGlobalDisplayNameCode, allMemberships? }
    let results = [];

    if (hasCode) {
      // Exact match — returns one entry per platform; group them all so "All Platforms" works.
      const displayName = raw.slice(0, hi);
      const displayNameCode = parseInt(raw.slice(hi + 1)) || 0;
      const data = await apiPost('/Destiny2/SearchDestinyPlayerByBungieName/-1/', { displayName, displayNameCode });
      if (data.ErrorCode !== 1) { showStatus('Error: ' + (data.Message || 'API error'), 'error', false); return; }
      const allMbships = (data.Response || []).filter(m => m.membershipType !== 254 && m.membershipId);
      if (allMbships.length) {
        const primary = allMbships.find(m => m.membershipType === m.crossSaveOverride) || allMbships[0];
        results = [{ ...primary, allMemberships: allMbships }];
      }
    } else {
      // Prefix search — one entry per unique Bungie user
      let page = 0;
      while (page < 3) {
        const data = await apiPost(`/User/Search/GlobalName/${page}/`, { displayNamePrefix: raw });
        if (data.ErrorCode !== 1) break;
        const users = data.Response?.searchResults || [];
        for (const u of users) {
          const memberships = u.destinyMemberships || [];
          if (!memberships.length) continue;
          // Prefer the cross-save override membership, else the first one
          const primary = memberships.find(m => m.membershipType === m.crossSaveOverride)
                       || memberships[0];
          results.push({
            ...primary,
            bungieGlobalDisplayName:     u.bungieGlobalDisplayName,
            bungieGlobalDisplayNameCode: u.bungieGlobalDisplayNameCode,
            allMemberships:              memberships,
          });
        }
        if (users.length < 25) break;
        page++;
      }
    }

    if (!results.length) {
      showStatus('No guardians found. Try including the #code for an exact match.', 'error', false);
      return;
    }

    hideStatus();
    // Always show the list so the user can confirm or pick the right account
    renderResultsList(results);
  } catch (e) {
    showStatus('Request failed. Check your connection.', 'error', false);
  }
}

function renderResultsList(results) {
  const list = document.getElementById('resultsList');
  list.innerHTML = '';

  results.forEach(r => {
    const item = document.createElement('div');
    item.className = 'result-item';
    const code = r.bungieGlobalDisplayNameCode != null
      ? '#' + String(r.bungieGlobalDisplayNameCode).padStart(4, '0')
      : '';
    const emblemId = `emblem-${r.membershipType}-${r.membershipId}`;

    // Show all platforms this user plays on (cross-save aware)
    const platforms = (r.allMemberships || [r])
      .map(m => PLATFORM_NAMES[m.membershipType] || ('Platform ' + m.membershipType))
      .filter((v, i, a) => a.indexOf(v) === i) // dedupe
      .join(' · ');

    item.innerHTML = `
      <div class="result-emblem" id="${emblemId}">
        <div class="result-emblem-placeholder">◈</div>
        <img alt="emblem" />
      </div>
      <div style="flex:1; min-width:0; padding: 0 12px;">
        <div class="result-name">${r.bungieGlobalDisplayName || r.displayName}<span class="result-code">${code}</span></div>
        <div class="result-platforms">${platforms}</div>
      </div>
    `;
    item.onclick = () => { list.style.display = 'none'; loadProfile(r); };
    list.appendChild(item);
  });

  list.style.display = 'block';

  // Fetch emblems in parallel — update each card as they resolve
  results.forEach(r => {
    const emblemId = `emblem-${r.membershipType}-${r.membershipId}`;
    apiFetch(`/Destiny2/${r.membershipType}/Profile/${r.membershipId}/?components=200`)
      .then(data => {
        if (data.ErrorCode !== 1) return;
        const chars = Object.values(data.Response?.characters?.data || {});
        if (!chars.length) return;
        // Most recently played character
        chars.sort((a, b) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed));
        const emblemPath = chars[0].emblemPath;
        if (!emblemPath) return;
        const el = document.getElementById(emblemId);
        if (!el) return;
        const img = el.querySelector('img');
        img.onload = () => img.classList.add('loaded');
        img.src = 'https://www.bungie.net' + emblemPath;
      })
      .catch(() => {}); // silently skip if emblem fetch fails
  });
}

// ── Profile ─────────────────────────────────────────────────────────────────

function showProfileSection() {
  document.getElementById('profile-section').style.display = 'block';
  updateProfileHeader();
}

function updateProfileHeader() {
  const hasD2 = !!state.activeCharId;
  const hasD1 = !!state.d1ActiveCharId;
  const d1Name = document.getElementById('d1ConnectedText').textContent.split(' · ')[0];

  const platformLabel = state.loadAllPlatforms && state.allPlatformMemberships.length > 1
    ? state.allPlatformMemberships.map(m => PLATFORM_NAMES[m.membershipType] || '').filter(Boolean).join(' · ')
    : (PLATFORM_NAMES[state.membershipType] || '');

  if (hasD2 && hasD1) {
    document.getElementById('guardianName').textContent = state.displayName;
    document.getElementById('guardianCode').textContent =
      '#' + String(state.displayNameCode).padStart(4, '0') +
      ' · ' + platformLabel +
      '  +  D1: ' + d1Name;
  } else if (hasD2) {
    document.getElementById('guardianName').textContent = state.displayName;
    document.getElementById('guardianCode').textContent =
      '#' + String(state.displayNameCode).padStart(4, '0') + ' · ' + platformLabel;
  } else if (hasD1) {
    document.getElementById('guardianName').textContent = d1Name;
    document.getElementById('guardianCode').textContent =
      'Destiny 1 · ' + (PLATFORM_NAMES[parseInt(state.d1MembershipType)] || '');
  }

  // Show/hide D2 character tabs
  document.getElementById('d2CharSection').style.display = hasD2 ? 'block' : 'none';
}

async function loadProfile(player) {
  showStatus('Loading guardian profile...', 'info', true);
  state.membershipId = player.membershipId;
  state.membershipType = player.membershipType;
  state.displayName = player.bungieGlobalDisplayName || player.displayName;
  state.displayNameCode = player.bungieGlobalDisplayNameCode;
  // Store all cross-save memberships (exclude BungieNet=254 which has no Destiny data)
  state.allPlatformMemberships = (player.allMemberships || [player])
    .filter(m => m.membershipType !== 254 && m.membershipId);
  state.loadAllPlatforms = false;

  try {
    const data = await apiFetch(`/Destiny2/${state.membershipType}/Profile/${state.membershipId}/?components=100,200`);
    if (data.ErrorCode !== 1) { showStatus('Error loading profile: ' + (data.Message || 'unknown'), 'error', false); return; }

    const chars = data.Response.characters?.data;
    if (!chars) { showStatus('No characters found on this account.', 'error', false); return; }

    state.characters = Object.values(chars).sort((a, b) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed));

    renderCharTabs();
    // Show D2 connected badge
    document.getElementById('d2ConnectedText').textContent =
      state.displayName + ' · ' + (PLATFORM_NAMES[state.membershipType] || '');
    document.getElementById('d2Connected').style.display = 'flex';

    showProfileSection();
    hideStatus();

    if (state.characters.length) selectChar(state.characters[0].characterId);
  } catch (e) {
    showStatus('Failed to load profile.', 'error', false);
  }
}

function renderCharTabs() {
  const tabs = document.getElementById('charTabs');
  tabs.innerHTML = '';

  // Populate charClassMap for D2 characters
  state.characters.forEach(c => {
    charClassMap[c.characterId] = CLASS_NAMES[c.classType] || 'Unknown';
  });

  state.characters.forEach(c => {
    const cls = CLASS_NAMES[c.classType] || 'Unknown';
    const tab = document.createElement('div');
    tab.className = 'char-tab';
    tab.dataset.charid = c.characterId;
    tab.innerHTML = `
  <div class="char-class ${cls.toLowerCase()}">${cls}</div>
  <div class="char-light">${c.light}</div>
  <div class="char-race">${RACE_NAMES[c.raceType] || ''}</div>
`;
    tab.onclick = () => selectChar(c.characterId);
    tabs.appendChild(tab);
  });

  // "Load All Characters" button (only show if there are multiple characters)
  if (state.characters.length > 1) {
    const allBtn = document.createElement('div');
    allBtn.className = 'char-tab-all' + (state.loadAllD2 ? ' active' : '');
    allBtn.id = 'loadAllD2Btn';
    allBtn.innerHTML = `<span>⊕</span> All Characters`;
    allBtn.onclick = () => toggleLoadAllD2();
    tabs.appendChild(allBtn);
  }

  // "All Platforms" button — only shown when player has multiple cross-save memberships
  if (state.allPlatformMemberships.length > 1) {
    const platformNames = state.allPlatformMemberships
      .map(m => PLATFORM_NAMES[m.membershipType] || ('Platform ' + m.membershipType))
      .join(' · ');
    const platBtn = document.createElement('div');
    platBtn.className = 'char-tab-all' + (state.loadAllPlatforms ? ' active' : '');
    platBtn.id = 'loadAllPlatformsBtn';
    platBtn.title = platformNames;
    platBtn.innerHTML = `<span>⊕</span> All Platforms`;
    platBtn.onclick = () => toggleLoadAllPlatforms();
    tabs.appendChild(platBtn);
  }
}

function selectChar(charId) {
  state.loadAllD2 = false;
  state.loadAllPlatforms = false;
  state.activeCharId = charId;
  document.querySelectorAll('.char-tab').forEach(t => t.classList.toggle('active', t.dataset.charid === charId));
  const allBtn = document.getElementById('loadAllD2Btn');
  if (allBtn) allBtn.classList.remove('active');
  const platBtn = document.getElementById('loadAllPlatformsBtn');
  if (platBtn) platBtn.classList.remove('active');
  updateProfileHeader();
  loadAllHistory();
}

function toggleLoadAllD2() {
  state.loadAllD2 = !state.loadAllD2;
  if (state.loadAllD2) {
    // Deselect individual char tabs and platform toggle
    state.loadAllPlatforms = false;
    document.querySelectorAll('.char-tab').forEach(t => t.classList.remove('active'));
    const allBtn = document.getElementById('loadAllD2Btn');
    if (allBtn) allBtn.classList.add('active');
    const platBtn = document.getElementById('loadAllPlatformsBtn');
    if (platBtn) platBtn.classList.remove('active');
  } else {
    // Fall back to first character
    const allBtn = document.getElementById('loadAllD2Btn');
    if (allBtn) allBtn.classList.remove('active');
    if (state.characters.length) selectChar(state.characters[0].characterId);
    return;
  }
  loadAllHistory();
}

function toggleLoadAllPlatforms() {
  state.loadAllPlatforms = !state.loadAllPlatforms;
  const platBtn = document.getElementById('loadAllPlatformsBtn');
  if (platBtn) platBtn.classList.toggle('active', state.loadAllPlatforms);
  if (state.loadAllPlatforms) {
    // Deselect individual char tabs and the All Characters toggle
    state.loadAllD2 = false;
    state.activeCharId = '';
    document.querySelectorAll('.char-tab').forEach(t => t.classList.remove('active'));
    const allBtn = document.getElementById('loadAllD2Btn');
    if (allBtn) allBtn.classList.remove('active');
  } else {
    // Fall back to first character on primary platform
    if (state.characters.length) selectChar(state.characters[0].characterId);
    return;
  }
  loadAllHistory();
}

function toggleLoadAllD1() {
  state.loadAllD1 = !state.loadAllD1;
  const btn = document.getElementById('loadAllD1Btn');
  if (btn) btn.classList.toggle('active', state.loadAllD1);
  if (state.loadAllD1) {
    // Deselect any individually-selected D1 char so the UI is clear
    document.querySelectorAll('.d1-char-option').forEach(el => el.classList.remove('active'));
    // Populate charClassMap for all D1 chars now (in case no char was selected yet)
    state.d1Characters.forEach(c => {
      const cid = c.characterBase?.characterId;
      if (cid) charClassMap[String(cid)] = CLASS_NAMES[c.characterBase?.classType] || 'Unknown';
    });
    showProfileSection();
  }
  loadAllHistory();
}

// ── Fetch all raids + dungeons ───────────────────────────────────────────────

async function fetchAllPages(mode, label, charId, membershipType, membershipId) {
  // membershipType/membershipId default to the primary account in state
  const mType = membershipType || state.membershipType;
  const mId   = membershipId   || state.membershipId;
  const all = [];
  let page = 0;
  while (true) {
    showStatus(`Scanning ${label} (${charClassMap[charId] || 'character'})... page ${page + 1}`, 'info', true);
    const data = await apiFetch(
      `/Destiny2/${mType}/Account/${mId}/Character/${charId}/Stats/Activities/` +
      `?count=250&mode=${mode}&page=${page}`
    );
    if (data.ErrorCode !== 1) break;
    const acts = data.Response?.activities || [];
    // Tag each activity with the character and platform it came from
    acts.forEach(a => { a._characterId = charId; a._membershipType = mType; });
    all.push(...acts);
    if (acts.length < 250) break;
    page++;
  }
  return all;
}

async function resolveNames(hashes) {
  // Fetch in batches of 8 (parallel within each batch)
  for (let i = 0; i < hashes.length; i += 8) {
    const batch = hashes.slice(i, i + 8).filter(h => !nameCache[h]);
    if (!batch.length) continue;
    showStatus(`Resolving activity names (${i + batch.length} / ${hashes.length})...`, 'info', true);
    await Promise.all(batch.map(async hash => {
      try {
        const data = await apiFetch(`/Destiny2/Manifest/DestinyActivityDefinition/${hash}/`);
        nameCache[hash] = (data.ErrorCode === 1)
          ? (data.Response?.displayProperties?.name || 'Unknown Activity')
          : 'Unknown Activity';
      } catch { nameCache[hash] = 'Unknown Activity'; }
    }));
  }
}


async function loadAllHistory() {
  document.getElementById('activityList').innerHTML =
    '<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;width:24px;height:24px;border-width:2px"></div><p id="loadingMsg">Scanning history...</p></div>';
  document.getElementById('summaryBar').style.display = 'none';
  document.getElementById('filterBar').style.display = 'none';
  document.getElementById('activityCount').textContent = '';

  try {
    // ── Determine which D2 characters to fetch ───────────────────────────────
    let d2all = [];
    let d2RaidInstanceIds = new Set();

    // When loadAllPlatforms is on we fetch every cross-save membership; otherwise just primary.
    // Each membership may have its own set of characters — we collect them all.
    const membershipsToFetch = state.loadAllPlatforms && state.allPlatformMemberships.length
      ? state.allPlatformMemberships
      : [{ membershipId: state.membershipId, membershipType: state.membershipType }];

    // Build list of (charId, membershipType, membershipId) tuples to fetch from.
    // When loadAllPlatforms is on we pull characters from every platform; otherwise
    // we only use state.characters (already loaded for primary) and filter by selection.
    let charFetchList = []; // { charId, membershipType, membershipId }
    if (state.loadAllPlatforms) {
      for (const m of membershipsToFetch) {
        showStatus(`Loading characters from ${PLATFORM_NAMES[m.membershipType] || 'platform'}...`, 'info', true);
        try {
          const pData = await apiFetch(`/Destiny2/${m.membershipType}/Profile/${m.membershipId}/?components=200`);
          if (pData.ErrorCode === 1) {
            const chars = Object.values(pData.Response?.characters?.data || {});
            chars.forEach(c => {
              charClassMap[c.characterId] = CLASS_NAMES[c.classType] || 'Unknown';
              charFetchList.push({ charId: c.characterId, membershipType: m.membershipType, membershipId: m.membershipId });
            });
          }
        } catch (e) { /* skip platform on error */ }
      }
    } else {
      const d2CharIds = state.loadAllD2
        ? state.characters.map(c => c.characterId)
        : (state.activeCharId ? [state.activeCharId] : []);
      charFetchList = d2CharIds.map(cid => ({
        charId: cid,
        membershipType: state.membershipType,
        membershipId: state.membershipId,
      }));
    }

    if (charFetchList.length) {
      const charCount = charFetchList.length;
      showStatus(`Loading ${charCount} character${charCount > 1 ? 's' : ''}...`, 'info', true);

      // Fetch all characters, deduplicate by instanceId (shared activities appear on multiple chars).
      // We fetch three modes:
      //   mode 4  (Raid)    — standard raids, plus Pit of Heresy which predates mode 82
      //   mode 82 (Dungeon) — all dungeons released from Pit of Heresy onward (as a proper mode)
      //   mode 2  (Story)   — Shattered Throne (Sep 2018) launched as a Story mission before
      //                       the Dungeon mode category existed; those 2018 runs only appear here
      // Pit of Heresy mode-4 entries are reclassified via LEGACY_DUNGEON_HASHES.
      // Shattered Throne mode-2 entries are identified via SHATTERED_THRONE_HASHES.
      // instanceId is globally unique across platforms, so the seen-set handles cross-platform dedup.
      const seen = new Set();
      const allRaids = [], allDungeons = [];
      for (const { charId, membershipType, membershipId } of charFetchList) {
        const raids    = await fetchAllPages(4,  'raids',    charId, membershipType, membershipId);
        const dungeons = await fetchAllPages(82, 'dungeons', charId, membershipType, membershipId);
        const stories  = await fetchAllPages(2,  'story',    charId, membershipType, membershipId);
        raids.forEach(a => {
          if (seen.has(a.activityDetails.instanceId)) return;
          seen.add(a.activityDetails.instanceId);
          // Reclassify legacy dungeons that appear in the raid feed (e.g. Pit of Heresy)
          const refHash = String(a.activityDetails.referenceId || '');
          if (LEGACY_DUNGEON_HASHES.has(refHash)) {
            allDungeons.push(a);
          } else {
            allRaids.push(a);
          }
        });
        dungeons.forEach(a => {
          if (!seen.has(a.activityDetails.instanceId)) {
            seen.add(a.activityDetails.instanceId);
            allDungeons.push(a);
          }
        });
        // Pull Shattered Throne 2018 runs from the Story feed
        stories.forEach(a => {
          if (seen.has(a.activityDetails.instanceId)) return;
          const refHash = String(a.activityDetails.referenceId || '');
          if (!SHATTERED_THRONE_HASHES.has(refHash)) return;
          seen.add(a.activityDetails.instanceId);
          allDungeons.push(a);
        });
      }

      // Tag each D2 activity as a checkpoint run or not.
      //
      // The activity history endpoint (/Stats/Activities/) does NOT include
      // startingPhaseIndex or activityWasStartedFromBeginning — both of those
      // only appear on the PGCR, which requires a separate per-activity fetch.
      //
      // Strategy: mark _isCheckpoint = null (unknown) here. When a PGCR is
      // fetched (on card expand or first-clear prefetch), we update the flag
      // using activityWasStartedFromBeginning from the PGCR response.
      // The toggle filter treats null as "not a checkpoint" so unresolved
      // activities remain visible until their PGCR is loaded.
      d2all = [...allRaids, ...allDungeons].map(a => {
        a._isCheckpoint = null; // resolved lazily via PGCR
        return a;
      }).sort((a, b) => new Date(a.period) - new Date(b.period));

      // Resolve D2 names
      const uniqueHashes = [...new Set(d2all.map(a => a.activityDetails.referenceId))];
      await resolveNames(uniqueHashes);

      d2RaidInstanceIds = new Set(allRaids.map(r => r.activityDetails.instanceId));
      d2all.forEach(act => { act._isD1 = false; });
    }

    // ── Determine which D1 characters to fetch ───────────────────────────────
    let d1all = [];
    const d1CharIds = state.loadAllD1
      ? state.d1Characters.map(c => c.characterBase?.characterId).filter(Boolean).map(String)
      : (state.d1ActiveCharId ? [String(state.d1ActiveCharId)] : []);

    if (d1CharIds.length) {
      const charCount = d1CharIds.length;
      const charLabel = charCount > 1 ? `all ${charCount} D1 characters` : (charClassMap[d1CharIds[0]] || 'character');
      showStatus(`Loading ${charLabel}...`, 'info', true);

      const seenD1 = new Set();
      const rawD1 = [];
      for (const cid of d1CharIds) {
        const raids = await fetchAllD1Pages(4, 'raids', cid);
        raids.forEach(a => {
          const iid = a.activityDetails?.instanceId;
          if (iid && !seenD1.has(iid)) {
            seenD1.add(iid);
            rawD1.push(a);
          }
        });
      }
      d1all = rawD1.map(normalizeD1Activity);
      state.d1Activities = d1all;
    }

    // ── Combine & sort ───────────────────────────────────────────────────────
    const all = [...d2all, ...d1all].sort((a, b) => new Date(a.period) - new Date(b.period));

    if (!all.length) {
      hideStatus();
      document.getElementById('activityList').innerHTML =
        '<div class="empty-state"><div class="icon">◈</div><p>No raids or dungeons found</p></div>';
      return;
    }

    // ── First clears — D1 and D2 tracked separately ──────────────────────────
    // Key: "{game}:{name}" so a D1 King's Fall first clear doesn't prevent a D2 one
    const firstClearInstances = new Set();
    const seenCleared = new Set();

    all.forEach(act => {
      const isD1 = act._isD1;
      const name = isD1
        ? act._d1Name
        : (nameCache[act.activityDetails.referenceId] || ('hash:' + act.activityDetails.directorActivityHash));
      const gamePrefix = isD1 ? 'D1' : 'D2';
      const key = `${gamePrefix}:${name}`;
      const completed = isActualClear(act.values);
      if (completed && !seenCleared.has(key)) {
        firstClearInstances.add(act.activityDetails.instanceId);
        seenCleared.add(key);
      }
    });

    // Store raw data
    state.rawActivities = all;
    state.rawNameCache = { ...nameCache };

    // Build raid set: D2 raids + all D1 activities (D1 had no dungeons)
    const raidInstanceIds = new Set([
      ...d2RaidInstanceIds,
      ...d1all.map(a => a.activityDetails.instanceId),
    ]);

    // Show D1 clears stat only when both games are loaded (otherwise it's redundant)
    const bothGames = state.activeCharId && state.d1ActiveCharId;
    document.getElementById('sumD1Stat').style.display = bothGames ? '' : 'none';
    // Also update profile header whenever history reloads (char selection may have changed)
    updateProfileHeader();

    hideStatus();
    renderActivities(all, firstClearInstances, raidInstanceIds);
  } catch (e) {
    showStatus('Failed to load history. Check your API key.', 'error', false);
  }
}

// ── Solo filter ──────────────────────────────────────────────────────────────

let hideSolo = true;
let hideFailed = true;
let hideCheckpoint = false;
let activityTypeFilter = 'both';

function toggleSoloFilter() {
  hideSolo = !hideSolo;
  document.getElementById('soloToggleTrack').classList.toggle('on', hideSolo);
  if (state.renderedActivities) renderActivities(state.renderedActivities, state.renderedFirstClears, state.renderedRaidIds);
}

function toggleFailedFilter() {
  hideFailed = !hideFailed;
  document.getElementById('failedToggleTrack').classList.toggle('on', hideFailed);
  if (state.renderedActivities) renderActivities(state.renderedActivities, state.renderedFirstClears, state.renderedRaidIds);
}

function toggleCheckpointFilter() {
  hideCheckpoint = !hideCheckpoint;
  document.getElementById('checkpointToggleTrack').classList.toggle('on', hideCheckpoint);
  if (state.renderedActivities) renderActivities(state.renderedActivities, state.renderedFirstClears, state.renderedRaidIds);
}

function setActivityTypeFilter(val) {
  activityTypeFilter = val;
  if (state.renderedActivities) renderActivities(state.renderedActivities, state.renderedFirstClears, state.renderedRaidIds);
}

// Cache fetched fireteam data: instanceId → array of player entries
const fireteamCache = {};

async function toggleActivity(item, instanceId) {
  const isExpanded = item.classList.contains('expanded');
  // Collapse any other open item
  document.querySelectorAll('.activity-item.expanded').forEach(el => el.classList.remove('expanded'));
  if (isExpanded) return; // was open — just close it

  item.classList.add('expanded');
  const panel = item.querySelector('.fireteam-panel');

  if (fireteamCache[instanceId] !== undefined) {
    renderFireteam(panel, fireteamCache[instanceId]);
    return;
  }

  panel.innerHTML = '<div class="fireteam-loading"><div class="spinner"></div>Loading fireteam...</div>';

  try {
    const data = await apiFetch(`/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`);
    if (data.ErrorCode !== 1) throw new Error(data.Message || 'API error');
    const entries = data.Response?.entries || [];
    fireteamCache[instanceId] = entries;

    // Resolve _isCheckpoint from the PGCR now that we have it.
    // activityWasStartedFromBeginning = false → run started from a checkpoint.
    // Known caveats: unreliable for pre-Feb-2022 PGCRs and Last Wish runs.
    const wasFromBeginning = data.Response?.activityWasStartedFromBeginning;
    if (typeof wasFromBeginning === 'boolean') {
      const act = state.renderedActivities?.find(
        a => a.activityDetails?.instanceId === instanceId
      );
      if (act && act._isCheckpoint === null) {
        act._isCheckpoint = !wasFromBeginning;
        // Update the checkpoint badge on the rendered card without a full re-render
        const badge = item.querySelector('.checkpoint-badge');
        if (act._isCheckpoint && !badge) {
          const nameRow = item.querySelector('.act-name-row');
          if (nameRow) {
            const b = document.createElement('div');
            b.className = 'checkpoint-badge';
            b.textContent = 'Checkpoint';
            nameRow.appendChild(b);
          }
        } else if (!act._isCheckpoint && badge) {
          badge.remove();
        }
      }
    }

    renderFireteam(panel, entries);
  } catch (e) {
    panel.innerHTML = `<div class="fireteam-error">Failed to load fireteam: ${e.message}</div>`;
    fireteamCache[instanceId] = [];
  }
}

async function toggleD1Activity(item, instanceId) {
  const isExpanded = item.classList.contains('expanded');
  document.querySelectorAll('.activity-item.expanded').forEach(el => el.classList.remove('expanded'));
  if (isExpanded) return;

  item.classList.add('expanded');
  const panel = item.querySelector('.fireteam-panel');

  if (fireteamCache[instanceId] !== undefined) {
    renderFireteam(panel, fireteamCache[instanceId]);
    return;
  }

  panel.innerHTML = '<div class="fireteam-loading"><div class="spinner"></div>Loading fireteam...</div>';

  try {
    const data = await d1ApiFetch(`/Destiny/Stats/PostGameCarnageReport/${instanceId}/`);
    if (data.ErrorCode !== 1) throw new Error(data.Message || 'API error');
    // D1 PGCR shape: data.Response.data.entries
    const entries = data.Response?.data?.entries || data.Response?.entries || [];
    // Normalize D1 entries to match D2 shape for renderFireteam
    const normalized = entries.map(e => ({
      player: {
        destinyUserInfo: {
          membershipId: e.player?.destinyUserInfo?.membershipId,
          displayName: e.player?.destinyUserInfo?.displayName,
          bungieGlobalDisplayName: e.player?.destinyUserInfo?.displayName,
          bungieGlobalDisplayNameCode: null,
        }
      },
      score: e.score,
      values: e.values,
    }));
    fireteamCache[instanceId] = normalized;
    renderFireteam(panel, normalized);
  } catch (e) {
    panel.innerHTML = `<div class="fireteam-error">Fireteam data unavailable for D1 activity.</div>`;
    fireteamCache[instanceId] = [];
  }
}

function renderFireteam(panel, entries) {
  if (!entries.length) {
    panel.innerHTML = '<div class="fireteam-error">No fireteam data available.</div>';
    return;
  }

  const sorted = [...entries].sort((a, b) => {
    const aIsMe = a.player?.destinyUserInfo?.membershipId === state.membershipId;
    const bIsMe = b.player?.destinyUserInfo?.membershipId === state.membershipId;
    if (aIsMe) return -1;
    if (bIsMe) return 1;
    return (b.score?.basic?.value || 0) - (a.score?.basic?.value || 0);
  });

  const rows = sorted.map(function(e) {
    const info   = e.player && e.player.destinyUserInfo ? e.player.destinyUserInfo : {};
    const vals   = e.values || {};
    const isMe   = info.membershipId === state.membershipId;
    const name   = (info.bungieGlobalDisplayName || info.displayName || 'Unknown') +
                   (info.bungieGlobalDisplayNameCode
                     ? '#' + String(info.bungieGlobalDisplayNameCode).padStart(4, '0')
                     : '');
    const kills  = Math.round((vals.kills  && vals.kills.basic  && vals.kills.basic.value)  || 0);
    const deaths = Math.round((vals.deaths && vals.deaths.basic && vals.deaths.basic.value) || 0);
    const kd     = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '\u221e' : '\u2014';
    const done   = isActualClear(vals);
    return '<div class="fireteam-member' + (isMe ? ' is-guardian' : '') + '">' +
           '<div class="member-name">' + name + (isMe ? ' \u25c4' : '') + '</div>' +
           '<div class="member-stat"><div class="member-stat-val">' + kills + '</div><div class="member-stat-lbl">Kills</div></div>' +
           '<div class="member-stat"><div class="member-stat-val">' + deaths + '</div><div class="member-stat-lbl">Deaths</div></div>' +
           '<div class="member-stat"><div class="member-stat-val">' + kd + '</div><div class="member-stat-lbl">K/D</div></div>' +
           '<div class="member-completed ' + (done ? 'ok' : 'dnf') + '">' + (done ? 'Cleared' : 'DNF') + '</div>' +
           '</div>';
  });

  panel.innerHTML =
    '<div class="fireteam-label">Fireteam \u00b7 ' + entries.length + ' guardian' + (entries.length !== 1 ? 's' : '') + '</div>' +
    '<div class="fireteam-grid">' + rows.join('') + '</div>';
}

    // ── Download ─────────────────────────────────────────────────────────────────

function downloadData() {
  if (!state.rawActivities) return;

  const firstClearInstances = new Set();
  const seenCleared = new Set();
  [...state.rawActivities].forEach(act => {
    const hash = act.activityDetails.directorActivityHash;
    const completed = isActualClear(act.values);
    if (completed && !seenCleared.has(hash)) {
      firstClearInstances.add(act.activityDetails.instanceId);
      seenCleared.add(hash);
    }
  });

  const annotated = state.rawActivities.map(act => ({
    instanceId:            act.activityDetails.instanceId,
    referenceId:           act.activityDetails.referenceId,
    directorActivityHash:  act.activityDetails.directorActivityHash,
    activityName:          state.rawNameCache[act.activityDetails.referenceId] || 'Unknown',
    period:                act.period,
    completed:             isActualClear(act.values),
    markedAsFirstClear:    firstClearInstances.has(act.activityDetails.instanceId),
    durationSeconds:       act.values?.activityDurationSeconds?.basic?.value || 0,
    kills:                 act.values?.kills?.basic?.value || 0,
    deaths:                act.values?.deaths?.basic?.value || 0,
    raw:                   act,
  }));

  const payload = {
    exportedAt:   new Date().toISOString(),
    guardian:     state.displayName + '#' + String(state.displayNameCode).padStart(4, '0'),
    membershipId: state.membershipId,
    characterId:  state.activeCharId,
    totalRuns:    annotated.length,
    activities:   annotated,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `ghost-${state.displayName}-${state.activeCharId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Render ───────────────────────────────────────────────────────────────────

// ── Completion Counter ───────────────────────────────────────────────────────

let counterOpen = false;
let simplifiedMode = false;
function toggleCounterPanel() {
  counterOpen = !counterOpen;
  document.getElementById('counterPanel').classList.toggle('open', counterOpen);
}

function toggleSimplifiedMode() {
  simplifiedMode = !simplifiedMode;
  const track = document.getElementById('simplifiedToggleTrack');
  if (track) track.classList.toggle('on', simplifiedMode);
  if (state.renderedActivities) {
    renderActivities(state.renderedActivities, state.renderedFirstClears, state.renderedRaidIds);
  }
}

// Strip difficulty suffixes so variants of the same raid/dungeon collapse into one entry.
// e.g. "Leviathan: Normal" → "Leviathan"
//      "Leviathan, Eater of Worlds: Prestige" → "Leviathan, Eater of Worlds"
const DIFFICULTY_SUFFIXES = /:\s*(Normal|Prestige|Master|Legend|Guided Games|Heroic|Legendary|Standard|Eternity|Explorer)$/i;
function simplifyName(name) {
  return name.replace(DIFFICULTY_SUFFIXES, '').trim();
}

// Master lists of every raid/dungeon — used to show zero-clear entries in the counter panel.
// D1 raids (release order)
const D1_RAID_ROSTER = [
  "Vault of Glass (D1)",
  "Crota's End",
  "King's Fall (D1)",
  "Wrath of the Machine",
];
// D2 raids (release order)
const D2_RAID_ROSTER = [
  "Leviathan",
  "Eater of Worlds",
  "Spire of Stars",
  "Last Wish",
  "Scourge of the Past",
  "Crown of Sorrow",
  "Garden of Salvation",
  "Deep Stone Crypt",
  "Vault of Glass (D2)",
  "Vow of the Disciple",
  "King's Fall (D2)",
  "Root of Nightmares",
  "Crota's End (D2)",
  "Salvation's Edge",
];
// D2 dungeons (release order)
const D2_DUNGEON_ROSTER = [
  "The Shattered Throne",
  "Pit of Heresy",
  "Prophecy",
  "Grasp of Avarice",
  "Duality",
  "Spire of the Watcher",
  "Ghosts of the Deep",
  "Warlord's Ruin",
  "Ghost of the Deep",
  "Vesper's Host",
  "Heresy",
];

function renderCounterPanel(activities, raidInstanceIds) {
  const panel = document.getElementById('counterPanel');
  const body  = document.getElementById('counterBody');

  // Tally clears per canonical name, split by game+type
  const tally = { d1Raids: {}, d2Raids: {}, d2Dungeons: {} };

  activities.forEach(act => {
    if (!isActualClear(act.values)) return;
    // Checkpoint clears are tracked separately — the counter shows full-run clears only
    if (act._isCheckpoint) return;
    const isD1   = !!act._isD1;
    const isRaid = raidInstanceIds.has(act.activityDetails.instanceId);
    const rawName = isD1
      ? act._d1Name
      : (nameCache[act.activityDetails.referenceId] || 'Unknown Activity');
    // Append game tag for reprised raids so D1 and D2 versions are counted separately
    const isReprised = D1_REPRISED_IN_D2.has(rawName);
    const name = isReprised ? `${rawName} (${isD1 ? 'D1' : 'D2'})` : rawName;

    if (isD1) {
      tally.d1Raids[name] = (tally.d1Raids[name] || 0) + 1;
    } else if (isRaid) {
      tally.d2Raids[name] = (tally.d2Raids[name] || 0) + 1;
    } else {
      tally.d2Dungeons[name] = (tally.d2Dungeons[name] || 0) + 1;
    }
  });

  // Only show sections for games the user has actually loaded
  const showD1 = !!state.d1ActiveCharId || state.loadAllD1;
  const showD2 = !!state.activeCharId   || state.loadAllD2;

  if (!showD1 && !showD2) {
    panel.style.display = 'none';
    return;
  }

  // In simplified mode, merge difficulty variants into the base activity name.
  // e.g. "Leviathan: Normal" + "Leviathan: Prestige" → "Leviathan"
  function collapseTally(map) {
    if (!simplifiedMode) return map;
    const out = {};
    for (const [name, count] of Object.entries(map)) {
      const base = simplifyName(name);
      out[base] = (out[base] || 0) + count;
    }
    return out;
  }

  // Build simplified rosters (de-duplicate after stripping suffixes)
  function simplifyRoster(roster) {
    if (!simplifiedMode) return roster;
    const seen = new Set();
    return roster.map(n => simplifyName(n)).filter(n => { if (seen.has(n)) return false; seen.add(n); return true; });
  }

  const d1RaidTally     = collapseTally(tally.d1Raids);
  const d2RaidTally     = collapseTally(tally.d2Raids);
  const d2DungeonTally  = collapseTally(tally.d2Dungeons);
  const d1Roster        = simplifyRoster(D1_RAID_ROSTER);
  const d2RaidRoster    = simplifyRoster(D2_RAID_ROSTER);
  const d2DungeonRoster = simplifyRoster(D2_DUNGEON_ROSTER);

  // Seed every master-list entry at 0 so uncleared activities always appear
  if (showD1) d1Roster.forEach(n => { if (!(n in d1RaidTally))    d1RaidTally[n]    = 0; });
  if (showD2) {
    d2RaidRoster.forEach(n    => { if (!(n in d2RaidTally))    d2RaidTally[n]    = 0; });
    d2DungeonRoster.forEach(n => { if (!(n in d2DungeonTally)) d2DungeonTally[n] = 0; });
  }

  // Find global max (excluding zeros) for bar scaling
  const allCounts = [
    ...Object.values(d1RaidTally),
    ...Object.values(d2RaidTally),
    ...Object.values(d2DungeonTally),
  ];
  const maxCount = Math.max(...allCounts, 1);

  function makeRows(map, roster, fillClass) {
    // Preserve roster order; append any activity names from actual data not in the roster
    const rosterOrder = roster.filter(n => n in map);
    const extras = Object.keys(map).filter(n => !roster.includes(n));
    const ordered = [...rosterOrder, ...extras];
    return ordered.map(name => {
      const count = map[name] || 0;
      const pct = count > 0 ? Math.round((count / maxCount) * 100) : 0;
      return `<div class="counter-row${count === 0 ? ' uncleared' : ''}">
        <div class="counter-name" title="${name}">${name}</div>
        <div class="counter-bar-wrap">
          <div class="counter-bar-track">
            <div class="counter-bar-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
          <div class="counter-num${count === 0 ? ' zero' : ''}">${count === 0 ? '—' : count}</div>
        </div>
      </div>`;
    }).join('');
  }

  let html = '';

  if (showD1) {
    html += `<div class="counter-game-group">
      <div class="counter-game-label d1">Destiny 1</div>
      <div class="counter-type-group">
        <div class="counter-type-label">Raids</div>
        <div class="counter-rows">${makeRows(d1RaidTally, d1Roster, 'd1')}</div>
      </div>
    </div>`;
  }

  if (showD2) {
    html += `<div class="counter-game-group">
      <div class="counter-game-label d2">Destiny 2</div>
      <div class="counter-type-group">
        <div class="counter-type-label">Raids</div>
        <div class="counter-rows">${makeRows(d2RaidTally, d2RaidRoster, '')}</div>
      </div>
      <div class="counter-type-group">
        <div class="counter-type-label">Dungeons</div>
        <div class="counter-rows">${makeRows(d2DungeonTally, d2DungeonRoster, 'dungeon')}</div>
      </div>
    </div>`;
  }

  body.innerHTML = html;
  panel.style.display = 'block';
}

function renderActivities(activities, firstClearInstances, raidInstanceIds) {
  // Persist for re-render when filter toggles
  state.renderedActivities  = activities;
  state.renderedFirstClears = firstClearInstances;
  state.renderedRaidIds     = raidInstanceIds;

  // When simplified mode is on, recompute first clears keyed by simplified name so
  // difficulty variants (e.g. Leviathan: Normal / Leviathan: Prestige) share one
  // first-clear badge — whichever was completed first gets it, not both.
  if (simplifiedMode) {
    firstClearInstances = new Set();
    const seenSimple = new Set();
    activities.forEach(act => {
      if (!isActualClear(act.values)) return;
      const isD1 = act._isD1;
      const rawName = isD1
        ? act._d1Name
        : (nameCache[act.activityDetails.referenceId] || ('hash:' + act.activityDetails.directorActivityHash));
      const baseName = simplifyName(rawName);
      const key = (isD1 ? 'D1' : 'D2') + ':' + baseName;
      if (!seenSimple.has(key)) {
        firstClearInstances.add(act.activityDetails.instanceId);
        seenSimple.add(key);
      }
    });
  }

  // Apply filters
  let filtered = activities;
  if (hideSolo) {
    filtered = filtered.filter(act => {
      const isRaid = raidInstanceIds.has(act.activityDetails.instanceId);
      if (!isRaid) return true;
      const playerCount = act.values && act.values.playerCount
        ? act.values.playerCount.basic.value : 1;
      return playerCount >= 2;
    });
  }
  if (hideFailed) {
    filtered = filtered.filter(act => isActualClear(act.values));
  }
  if (hideCheckpoint) {
    // _isCheckpoint === null means PGCR not yet fetched — keep visible rather than hiding prematurely
    filtered = filtered.filter(act => act._isCheckpoint !== true);
  }
  if (activityTypeFilter === 'raids') {
    filtered = filtered.filter(act => raidInstanceIds.has(act.activityDetails.instanceId));
  } else if (activityTypeFilter === 'dungeons') {
    filtered = filtered.filter(act => !raidInstanceIds.has(act.activityDetails.instanceId));
  } else if (activityTypeFilter === 'd1') {
    filtered = filtered.filter(act => act._isD1);
  } else if (activityTypeFilter === 'd2') {
    filtered = filtered.filter(act => !act._isD1);
  }

  const list = document.getElementById('activityList');
  list.innerHTML = '';

  let totalClears = 0, totalFirstClears = 0, raidClears = 0, dungeonClears = 0, d1Clears = 0;

  // Compute once whether multiple platforms are represented in the filtered set
  const platformsInView = new Set(filtered.map(a => a._membershipType).filter(Boolean));

  filtered.forEach((act, i) => {
    const v = act.values || {};
    const details = act.activityDetails || {};
    const refHash = details.referenceId;
    const instId = details.instanceId;
    const isRaid = raidInstanceIds.has(instId);
    const isD1 = !!act._isD1;

    // Resolve name: D1 activities use pre-resolved _d1Name
    const rawName = isD1
      ? act._d1Name
      : (nameCache[refHash] || 'Unknown Activity');

    // For reprised raids, append game marker to disambiguate in the title
    const isReprised = D1_REPRISED_IN_D2.has(rawName);
    const name = isReprised ? `${rawName} (${isD1 ? 'D1' : 'D2'})` : rawName;

    const completed = isActualClear(v);
    const isCheckpoint = !!act._isCheckpoint;
    const isFirstClr = firstClearInstances.has(instId);
    const playerCount = v.playerCount ? v.playerCount.basic.value : 1;
    const deaths = Math.round(v.deaths?.basic?.value || 0);
    const isSoloDungeon = !isRaid && playerCount === 1 && completed;
    const isSoloFlawless = isSoloDungeon && deaths === 0;
    const duration = formatDuration(v.activityDurationSeconds?.basic?.value || 0);

    const period = new Date(act.period);
    const dateStr = period.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = period.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    const kills = Math.round(v.kills?.basic?.value || 0);
    // deaths already computed above for solo flawless check
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '—';

    if (completed) {
      totalClears++;
      if (isD1) d1Clears++;
      else if (isRaid) raidClears++; else dungeonClears++;
    }
    if (isFirstClr) totalFirstClears++;

    const resultClass = completed ? 'ok' : 'dnf';
    const resultLabel = completed ? 'Cleared' : 'DNF';

    const itemClass = [
      'activity-item',
      completed ? 'completed' : 'dnf',
      isFirstClr ? 'first-clear' : ''
    ].join(' ').trim();

    const item = document.createElement('div');
    item.className = itemClass;
    item.style.animationDelay = Math.min(i * 0.015, 0.5) + 's';

    // Type badge: D1 activities are always raids; D2 can be raid or dungeon
    const typeBadgeClass = isRaid ? 'raid' : 'dungeon';
    const typeBadgeLabel = isD1 ? 'D1 Raid' : (isRaid ? 'Raid' : 'Dungeon');

    // Class badge — only shown when multiple characters are loaded
    const showingMultipleChars = state.loadAllD2 || state.loadAllD1 ||
      (state.loadAllD2 && state.loadAllD1);
    const actCharId = act._characterId;
    const actClass = actCharId ? (charClassMap[actCharId] || 'Unknown') : null;
    const classBadgeHtml = (showingMultipleChars && actClass)
      ? `<div class="class-badge ${actClass.toLowerCase()}"><span class="class-badge-icon" data-class="${actClass.toLowerCase()}"></span>${actClass}</div>`
      : '';

    // Platform badge — only shown when activities span multiple platforms
    const showPlatformBadge = !isD1 && state.loadAllPlatforms && platformsInView.size > 1;
    const platformName = PLATFORM_NAMES[act._membershipType] || '';
    const platformBadgeHtml = (showPlatformBadge && platformName)
      ? `<div class="platform-badge">${platformName}</div>`
      : '';

    item.innerHTML = `
  <div class="act-main">
    <div class="act-name-row">
      <div class="act-name">${name}</div>
      <div class="act-type-badge ${typeBadgeClass}">${typeBadgeLabel}</div>
      <div class="game-badge ${isD1 ? 'd1' : 'd2'}">${isD1 ? 'D1' : 'D2'}</div>
      ${classBadgeHtml}
      ${platformBadgeHtml}
      ${isFirstClr ? '<div class="first-clear-badge">First Clear</div>' : ''}
      ${isSoloFlawless ? '<div class="solo-flawless-badge">Solo Flawless</div>' : isSoloDungeon ? '<div class="solo-badge">Solo</div>' : ''}
      ${isCheckpoint ? '<div class="checkpoint-badge">Checkpoint</div>' : ''}
    </div>
    <div class="act-meta">
      <span>${dateStr} · ${timeStr}</span>
      <span>⏱ ${duration}</span>
    </div>
  </div>
  <div class="act-stats">
    <div class="stat-item">
      <div class="stat-val">${kills}</div>
      <div class="stat-lbl">Kills</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${deaths}</div>
      <div class="stat-lbl">Deaths</div>
    </div>
    <div class="stat-item">
      <div class="stat-val">${kd}</div>
      <div class="stat-lbl">K/D</div>
    </div>
    <div class="act-result ${resultClass}">${resultLabel}</div>
    <div class="activity-expand-icon">▼</div>
  </div>
  <div class="fireteam-panel"></div>
`;

    // D1 activities: fireteam expand uses D1 PGCR endpoint
    if (isD1) {
      item.onclick = () => toggleD1Activity(item, instId);
    } else {
      item.onclick = () => toggleActivity(item, instId);
    }
    list.appendChild(item);
  });

  // Pre-fetch fireteam data for every first-clear so it's cached and ready.
  // Runs silently in the background — no UI changes until the user expands the card.
  filtered.forEach(act => {
    const instId  = act.activityDetails.instanceId;
    const isD1    = !!act._isD1;
    if (!firstClearInstances.has(instId)) return;
    if (fireteamCache[instId] !== undefined) return; // already cached

    if (isD1) {
      d1ApiFetch(`/Destiny/Stats/PostGameCarnageReport/${instId}/`).then(data => {
        if (data.ErrorCode !== 1) { fireteamCache[instId] = []; return; }
        const entries = data.Response?.data?.entries || data.Response?.entries || [];
        fireteamCache[instId] = entries.map(e => ({
          player: {
            destinyUserInfo: {
              membershipId: e.player?.destinyUserInfo?.membershipId,
              displayName:  e.player?.destinyUserInfo?.displayName,
              bungieGlobalDisplayName:     e.player?.destinyUserInfo?.displayName,
              bungieGlobalDisplayNameCode: null,
            }
          },
          score:  e.score,
          values: e.values,
        }));
      }).catch(() => { fireteamCache[instId] = []; });
    } else {
      apiFetch(`/Destiny2/Stats/PostGameCarnageReport/${instId}/`).then(data => {
        if (data.ErrorCode !== 1) { fireteamCache[instId] = []; return; }
        fireteamCache[instId] = data.Response?.entries || [];
      }).catch(() => { fireteamCache[instId] = []; });
    }
  });

  const multiChar = state.loadAllD2 || state.loadAllD1;
  const charSuffix = multiChar ? ' across all characters' : '';
  document.getElementById('activityCount').textContent = `${filtered.length} runs${charSuffix}`;
  document.getElementById('sumTotal').textContent = filtered.length;
  document.getElementById('sumClears').textContent = totalClears;
  document.getElementById('sumFirstClears').textContent = totalFirstClears;
  document.getElementById('sumRaids').textContent = raidClears;
  document.getElementById('sumDungeons').textContent = dungeonClears;
  document.getElementById('sumD1').textContent = d1Clears;
  document.getElementById('summaryBar').style.display = 'flex';
  document.getElementById('filterBar').style.display = 'flex';

  // Render the per-activity completion counter
  renderCounterPanel(activities, raidInstanceIds);

  // Show/hide filter options based on what games are loaded
  const d1Only = state.d1ActiveCharId && !state.activeCharId;
  const d2Only = state.activeCharId && !state.d1ActiveCharId;
  const sel = document.getElementById('activityTypeSelect');
  sel.querySelector('option[value="dungeons"]').style.display = d1Only ? 'none' : '';
  sel.querySelector('option[value="d1"]').style.display    = d2Only ? 'none' : '';
  sel.querySelector('option[value="d2"]').style.display    = d1Only ? 'none' : '';
  sel.querySelector('option[value="both"]').textContent    = d1Only ? 'All Raids' : 'Both';
  // Reset to 'both' if current filter is now invalid
  if ((d1Only && (activityTypeFilter === 'dungeons' || activityTypeFilter === 'd2')) ||
      (d2Only && activityTypeFilter === 'd1')) {
    activityTypeFilter = 'both';
    sel.value = 'both';
  }
}

// ── Fireteam expand ───────────────────────────────────────────────────────────

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) { const h = Math.floor(m / 60); return `${h}h ${m % 60}m`; }
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
