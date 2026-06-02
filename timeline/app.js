/* ═══════════════════════════════════════════════════════════════════════════
   Star Chart — Destiny 2 Timeline & Slideshow
   ═══════════════════════════════════════════════════════════════════════════ */

const PLATFORM_NAMES = { 1: 'Xbox', 2: 'PSN', 3: 'Steam', 4: 'Blizzard', 5: 'Stadia', 6: 'Epic', 254: 'BungieNet', 0: 'None' };

// ── API proxy ──────────────────────────────────────────────────────────────
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

// ── State ──────────────────────────────────────────────────────────────────
let state = {
  membershipId: '',
  membershipType: '',
  displayName: '',
  displayNameCode: '',
  milestones: [],        // sorted array of first-clear milestone objects
  titles: [],            // completed title milestones
  currentSlide: 0,
  currentView: 'timeline',
};

// Name cache: hash → string
const nameCache = {};

// Fireteam cache: instanceId → entries[]
const fireteamCache = {};

// ── Helpers ────────────────────────────────────────────────────────────────

// ── Theme ──────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('starChart_theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('themeToggle').textContent = '☾';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? null : 'light';
  if (next) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('themeToggle').textContent = '☾';
    localStorage.setItem('starChart_theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeToggle').textContent = '☀';
    localStorage.setItem('starChart_theme', 'dark');
  }
}

// Call on load
initTheme();

function isActualClear(values) {
  const completed = (values?.completed?.basic?.value ?? 0) === 1;
  const completionReason = values?.completionReason?.basic?.value ?? 0;
  return completed && completionReason === 0;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) { const h = Math.floor(m / 60); return `${h}h ${m % 60}m`; }
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function showStatus(msg, type = 'info', loading = false) {
  const bar = document.getElementById('statusBar');
  bar.className = 'status-bar ' + type;
  document.getElementById('statusText').textContent = msg;
  document.getElementById('statusSpinner').style.display = loading ? 'block' : 'none';
  bar.style.display = 'flex';
}

function hideStatus() {
  document.getElementById('statusBar').style.display = 'none';
}

// ── Artwork (from milestones.js) ──────────────────────────────────────────
// Looks up artwork by activity name in the shared MILESTONE_ARTWORK map.
function getArtwork(name) {
  const path = MILESTONE_ARTWORK[name];
  return path || null;
}

// ── Flavour text (from milestones.js) ─────────────────────────────────────
// Looks up flavour text by activity name in the shared MILESTONE_FLAVOUR map.
function getFlavour(name) {
  return MILESTONE_FLAVOUR[name] || null;
}

// ── Important story missions (from milestones.js) ─────────────────────────
// Checks the shared IMPORTANT_STORY_MISSIONS set by activity name.
// Also falls back to checking by referenceId hash for edge cases.
function isImportantStory(name, refId) {
  if (IMPORTANT_STORY_MISSIONS.has(name)) return true;
  // Allow hash-based overrides for missions whose manifest name may differ
  if (IMPORTANT_STORY_MISSIONS.has(refId)) return true;
  return false;
}

// ── Search ─────────────────────────────────────────────────────────────────

async function search() {
  const raw = document.getElementById('searchInput').value.trim();
  if (!raw) return;

  document.getElementById('resultsList').style.display = 'none';
  document.getElementById('guardianHeader').style.display = 'none';
  document.getElementById('viewToggle').style.display = 'none';
  document.getElementById('summaryBar').style.display = 'none';
  document.getElementById('timelineView').style.display = 'none';
  document.getElementById('slideshowView').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
  showStatus('Searching for guardian...', 'info', true);

  const hi = raw.lastIndexOf('#');
  const hasCode = hi > 0 && /^\d{1,4}$/.test(raw.slice(hi + 1).trim());

  try {
    let results = [];

    if (hasCode) {
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
      let page = 0;
      while (page < 3) {
        const data = await apiPost(`/User/Search/GlobalName/${page}/`, { displayNamePrefix: raw });
        if (data.ErrorCode !== 1) break;
        const users = data.Response?.searchResults || [];
        for (const u of users) {
          const memberships = u.destinyMemberships || [];
          if (!memberships.length) continue;
          const primary = memberships.find(m => m.membershipType === m.crossSaveOverride) || memberships[0];
          results.push({
            ...primary,
            bungieGlobalDisplayName: u.bungieGlobalDisplayName,
            bungieGlobalDisplayNameCode: u.bungieGlobalDisplayNameCode,
            allMemberships: memberships,
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

    const platforms = (r.allMemberships || [r])
      .map(m => PLATFORM_NAMES[m.membershipType] || ('Platform ' + m.membershipType))
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(' · ');

    item.innerHTML = `
      <div class="result-emblem" id="${emblemId}">
        <div class="result-emblem-placeholder">◈</div>
        <img alt="emblem" />
      </div>
      <div style="flex:1; min-width:0;">
        <div class="result-name">${r.bungieGlobalDisplayName || r.displayName}<span class="result-code">${code}</span></div>
        <div class="result-platforms">${platforms}</div>
      </div>
    `;
    item.onclick = () => { list.style.display = 'none'; loadJourney(r); };
    list.appendChild(item);
  });

  list.style.display = 'block';

  // Fetch emblems in parallel
  results.forEach(r => {
    const emblemId = `emblem-${r.membershipType}-${r.membershipId}`;
    apiFetch(`/Destiny2/${r.membershipType}/Profile/${r.membershipId}/?components=200`)
      .then(data => {
        if (data.ErrorCode !== 1) return;
        const chars = Object.values(data.Response?.characters?.data || {});
        if (!chars.length) return;
        chars.sort((a, b) => new Date(b.dateLastPlayed) - new Date(a.dateLastPlayed));
        const emblemPath = chars[0].emblemPath;
        if (!emblemPath) return;
        const el = document.getElementById(emblemId);
        if (!el) return;
        const img = el.querySelector('img');
        img.onload = () => img.classList.add('loaded');
        img.src = 'https://www.bungie.net' + emblemPath;
      })
      .catch(() => {});
  });
}

// ── Load Journey ───────────────────────────────────────────────────────────

async function loadJourney(player) {
  showStatus('Loading guardian profile...', 'info', true);

  state.membershipId = player.membershipId;
  state.membershipType = player.membershipType;
  state.displayName = player.bungieGlobalDisplayName || player.displayName;
  state.displayNameCode = player.bungieGlobalDisplayNameCode;
  state.milestones = [];
  state.currentSlide = 0;

  // Show guardian header
  document.getElementById('guardianName').textContent = state.displayName;
  document.getElementById('guardianCode').textContent =
    '#' + String(state.displayNameCode).padStart(4, '0') +
    ' · ' + (PLATFORM_NAMES[state.membershipType] || '');
  document.getElementById('guardianHeader').style.display = 'block';
  document.getElementById('emptyState').style.display = 'none';

  try {
    // Get characters AND titles in one call (components 200 + 900)
    const profileData = await apiFetch(
      `/Destiny2/${state.membershipType}/Profile/${state.membershipId}/?components=200,900`
    );
    if (profileData.ErrorCode !== 1) {
      showStatus('Error loading profile: ' + (profileData.Message || 'unknown'), 'error', false);
      return;
    }

    const chars = Object.values(profileData.Response?.characters?.data || {});
    if (!chars.length) {
      showStatus('No characters found on this account.', 'error', false);
      return;
    }

    // Fetch all activities: mode 4 (Raid), mode 82 (Dungeon), mode 2 (Story)
    // Run all character/mode combinations in parallel for speed
    showStatus('Scanning activities...', 'info', true);
    const fetchTasks = [];
    for (const char of chars) {
      const charId = char.characterId;
      fetchTasks.push(
        fetchAllPages(4, charId).then(acts => acts.map(a => ({ ...a, _type: 'raid', _characterId: charId }))),
        fetchAllPages(82, charId).then(acts => acts.map(a => ({ ...a, _type: 'dungeon', _characterId: charId }))),
        fetchAllPages(2, charId).then(acts => acts.map(a => ({ ...a, _type: 'story', _characterId: charId }))),
      );
    }

    const results = await Promise.all(fetchTasks);
    const seen = new Set();
    const allActivities = [];
    for (const batch of results) {
      for (const a of batch) {
        if (seen.has(a.activityDetails.instanceId)) continue;
        seen.add(a.activityDetails.instanceId);
        allActivities.push(a);
      }
    }

    if (!allActivities.length) {
      hideStatus();
      document.getElementById('timelineView').innerHTML =
        '<div class="empty-state"><div class="icon">◈</div><p>No activities found</p></div>';
      document.getElementById('timelineView').style.display = 'block';
      return;
    }

    // Resolve activity names
    const uniqueHashes = [...new Set(allActivities.map(a => a.activityDetails.referenceId))];
    await resolveNames(uniqueHashes);

    // Find first completion for each unique activity (by referenceId)
    showStatus('Charting your journey...', 'info', true);

    const firstClears = new Map(); // refId → activity

    // Sort by date ascending so first encountered = earliest
    const sorted = [...allActivities].sort((a, b) => new Date(a.period) - new Date(b.period));

    for (const act of sorted) {
      if (!isActualClear(act.values || {})) continue;
      const refId = String(act.activityDetails.referenceId || '');
      if (!refId) continue;
      if (!firstClears.has(refId)) {
        firstClears.set(refId, act);
      }
    }

    // Build milestones array
    const milestones = [];
    for (const [refId, act] of firstClears) {
      const name = nameCache[refId];
      // Skip activities whose name couldn't be resolved
      if (!name || name === 'Unknown Activity') continue;

      const isImportant = isImportantStory(name, refId);

      // Always include raids and dungeons. Story missions must be in the
      // IMPORTANT_STORY_MISSIONS set — this is about the first time you
      // played through the game, not every replay.
      if (act._type === 'story' && !isImportant) continue;

      milestones.push({
        refId,
        name,
        type: act._type,
        instanceId: act.activityDetails.instanceId,
        period: act.period,
        values: act.values || {},
        characterId: act._characterId,
        starred: isImportant,
        artwork: getArtwork(name),
        flavour: getFlavour(name),
      });
    }

    // Sort by date
    milestones.sort((a, b) => new Date(a.period) - new Date(b.period));

    // ── Deduplicate by name ───────────────────────────────────────────────
    // Different difficulty variants (Normal/Legendary) have different
    // referenceId hashes but the same display name. Keep only the earliest
    // completion for each unique name.
    const seenNames = new Set();
    const deduped = [];
    for (const m of milestones) {
      if (seenNames.has(m.name)) continue;
      seenNames.add(m.name);
      deduped.push(m);
    }

    state.milestones = deduped;

    // ── Fetch completed titles (Seals) ────────────────────────────────────
    showStatus('Checking titles...', 'info', true);
    const titleMilestones = fetchTitlesFromProfile(profileData);
    state.titles = titleMilestones;

    // Update summary
    const raidCount = milestones.filter(m => m.type === 'raid').length;
    const dungeonCount = milestones.filter(m => m.type === 'dungeon').length;
    const storyCount = milestones.filter(m => m.type === 'story').length;
    const titleCount = titleMilestones.length;

    document.getElementById('sumTotal').textContent = milestones.length + titleCount;
    document.getElementById('sumRaids').textContent = raidCount;
    document.getElementById('sumDungeons').textContent = dungeonCount;
    document.getElementById('sumStories').textContent = storyCount;
    document.getElementById('sumTitles').textContent = titleCount;
    document.getElementById('summaryBar').style.display = 'flex';

    // Show view toggle
    document.getElementById('viewToggle').style.display = 'flex';

    hideStatus();

    // Render current view
    if (state.currentView === 'slideshow') {
      renderSlideshow();
    } else {
      renderTimeline();
    }

    // Pre-fetch fireteam data for all milestones
    prefetchFireteams(milestones);

  } catch (e) {
    console.error('loadJourney error:', e);
    showStatus('Failed to load journey. Check your connection.', 'error', false);
  }
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchAllPages(mode, charId) {
  const all = [];
  let page = 0;

  // Fetch first page to determine if there are more
  const firstData = await apiFetch(
    `/Destiny2/${state.membershipType}/Account/${state.membershipId}/Character/${charId}/Stats/Activities/` +
    `?count=250&mode=${mode}&page=0`
  );
  if (firstData.ErrorCode !== 1) return all;
  const firstActs = firstData.Response?.activities || [];
  all.push(...firstActs);
  if (firstActs.length < 250) return all;

  // More pages exist — fetch up to 7 more in parallel (max ~2000 activities per mode)
  const remainingPages = [1, 2, 3, 4, 5, 6, 7];
  const results = await Promise.all(
    remainingPages.map(p =>
      apiFetch(
        `/Destiny2/${state.membershipType}/Account/${state.membershipId}/Character/${charId}/Stats/Activities/` +
        `?count=250&mode=${mode}&page=${p}`
      )
    )
  );

  for (const data of results) {
    if (data.ErrorCode !== 1) break;
    const acts = data.Response?.activities || [];
    all.push(...acts);
    if (acts.length < 250) break;
  }

  return all;
}

async function resolveNames(hashes) {
  for (let i = 0; i < hashes.length; i += 16) {
    const batch = hashes.slice(i, i + 16).filter(h => !nameCache[h]);
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

async function prefetchFireteams(milestones) {
  for (const m of milestones) {
    if (m.type === 'title') continue; // titles have no fireteam
    if (fireteamCache[m.instanceId] !== undefined) continue;
    try {
      const data = await apiFetch(`/Destiny2/Stats/PostGameCarnageReport/${m.instanceId}/`);
      if (data.ErrorCode !== 1) { fireteamCache[m.instanceId] = []; continue; }
      fireteamCache[m.instanceId] = data.Response?.entries || [];
    } catch { fireteamCache[m.instanceId] = []; }
  }
}

// ── Title fetching ─────────────────────────────────────────────────────────
// Extracts completed Seals/Titles from an already-fetched profile response
// (components=900). No additional API calls needed.

function fetchTitlesFromProfile(profileData) {
  const titles = [];
  try {
    const recordSeals = profileData.Response?.profileRecords?.data?.recordSeals || {};

    for (const [sealHash, sealData] of Object.entries(recordSeals)) {
      if (!sealData.completed) continue;

      let titleName = sealData.title || '';
      if (!titleName) continue;

      const flavour = TITLE_FLAVOUR[titleName] || null;
      if (!flavour) continue;

      titles.push({
        refId: `title-${sealHash}`,
        name: titleName,
        type: 'title',
        instanceId: `title-${sealHash}`,
        period: sealData.completedDate || new Date().toISOString(),
        values: {},
        characterId: null,
        starred: true,
        artwork: null,
        flavour: flavour,
      });
    }
  } catch (e) {
    console.warn('Title parse error:', e);
  }
  return titles;
}

// ── View switching ─────────────────────────────────────────────────────────

function switchView(view) {
  state.currentView = view;
  document.getElementById('timelineViewBtn').classList.toggle('active', view === 'timeline');
  document.getElementById('slideshowViewBtn').classList.toggle('active', view === 'slideshow');

  if (view === 'timeline') {
    document.getElementById('slideshowView').style.display = 'none';
    renderTimeline();
  } else {
    document.getElementById('timelineView').style.display = 'none';
    state.currentSlide = 0;
    renderSlideshow();
  }
}

// ── Chapter helpers ────────────────────────────────────────────────────────

// Build a lookup: mission name → chapter id
const _chapterLookup = {};
(function buildChapterLookup() {
  for (const ch of MILESTONE_CHAPTERS) {
    for (const name of ch.missions) {
      _chapterLookup[name] = ch.id;
    }
  }
})();

function getChapterId(milestone) {
  // Titles don't belong to chapters
  if (milestone.type === 'title') return null;
  return _chapterLookup[milestone.name] || null;
}

function getChapterLabel(chapterId) {
  const ch = MILESTONE_CHAPTERS.find(c => c.id === chapterId);
  return ch ? ch.label : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════════════════════

function renderTimeline() {
  const container = document.getElementById('timelineView');
  container.style.display = 'block';
  container.innerHTML = '';

  // Combine milestones and titles, sorted by date
  const allItems = [...state.milestones, ...state.titles]
    .sort((a, b) => new Date(a.period) - new Date(b.period));

  if (!allItems.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">◈</div><p>No milestones found</p></div>';
    document.getElementById('chapterNav').style.display = 'none';
    return;
  }

  // ── Build chapter nav ──────────────────────────────────────────────────
  const navScroll = document.getElementById('chapterNavScroll');
  navScroll.innerHTML = '';

  // Determine which chapters have items
  const chapterHasItems = new Set();
  for (const m of allItems) {
    const cid = getChapterId(m);
    if (cid) chapterHasItems.add(cid);
  }

  // Render nav chips in chapter order
  for (const ch of MILESTONE_CHAPTERS) {
    const hasItems = chapterHasItems.has(ch.id);
    const chip = document.createElement('div');
    chip.className = 'chapter-chip' + (hasItems ? '' : ' empty');
    chip.textContent = ch.label;
    if (hasItems) {
      chip.onclick = () => {
        const header = document.getElementById('ch-' + ch.id);
        if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight active chip
        navScroll.querySelectorAll('.chapter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      };
    }
    navScroll.appendChild(chip);
  }
  document.getElementById('chapterNav').style.display = 'block';

  // ── Render timeline with chapter headers ───────────────────────────────
  let currentChapter = null;

  allItems.forEach((m, i) => {
    const chapterId = getChapterId(m);

    // Insert chapter header when entering a new chapter
    if (chapterId && chapterId !== currentChapter) {
      currentChapter = chapterId;
      const label = getChapterLabel(chapterId);
      if (label) {
        const header = document.createElement('div');
        header.id = 'ch-' + chapterId;
        header.className = 'chapter-header';
        header.innerHTML = `<span>${label}</span>`;
        container.appendChild(header);
      }
    }

    const node = document.createElement('div');
    const isTitle = m.type === 'title';
    const typeClass = isTitle ? 'title' : (m.starred ? 'important' : m.type);
    node.className = `timeline-node ${typeClass}`;
    node.style.animationDelay = Math.min(i * 0.02, 0.5) + 's';

    const period = new Date(m.period);
    const dateStr = period.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = period.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    let typeLabel, typeClassLabel;
    if (isTitle) {
      typeLabel = 'Title';
      typeClassLabel = 'title';
    } else {
      typeLabel = m.type === 'raid' ? 'Raid' : m.type === 'dungeon' ? 'Dungeon' : 'Story';
      typeClassLabel = m.starred ? 'important' : m.type;
    }

    const kills = Math.round(m.values?.kills?.basic?.value || 0);
    const deaths = Math.round(m.values?.deaths?.basic?.value || 0);
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '—';
    const duration = formatDuration(m.values?.activityDurationSeconds?.basic?.value || 0);

    if (isTitle) {
      node.innerHTML = `
        <div class="node-header">
          <div class="node-type title">🏆 Title</div>
          <div class="node-name">${m.name}</div>
          <div class="node-date">${dateStr}</div>
        </div>
        ${m.flavour ? `<div class="node-flavour">${m.flavour}</div>` : ''}
      `;
    } else {
      node.innerHTML = `
        <div class="node-header">
          <div class="node-type ${typeClassLabel}">${m.starred ? '★ Important' : typeLabel}</div>
          <div class="node-name">${m.name}</div>
          <div class="node-date">${dateStr} · ${timeStr}</div>
        </div>
        <div class="node-meta">
          <span>⏱ ${duration}</span>
          <span>⚔ ${kills} kills</span>
          <span>💀 ${deaths} deaths</span>
          <span>📊 ${kd} K/D</span>
        </div>
        ${m.flavour ? `<div class="node-flavour">${m.flavour}</div>` : ''}
        <div class="fireteam-panel">
          <div class="fireteam-loading"><div class="spinner"></div>Loading fireteam...</div>
        </div>
      `;
      node.onclick = () => toggleTimelineNode(node, m.instanceId);
    }

    container.appendChild(node);
  });
}

async function toggleTimelineNode(node, instanceId) {
  const isExpanded = node.classList.contains('expanded');
  // Collapse all others
  document.querySelectorAll('.timeline-node.expanded').forEach(el => el.classList.remove('expanded'));
  if (isExpanded) return;

  node.classList.add('expanded');
  const panel = node.querySelector('.fireteam-panel');

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
    renderFireteam(panel, entries);
  } catch (e) {
    panel.innerHTML = `<div class="fireteam-error">Failed to load fireteam: ${e.message}</div>`;
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

  const rows = sorted.map(e => {
    const info = e.player?.destinyUserInfo || {};
    const vals = e.values || {};
    const isMe = info.membershipId === state.membershipId;
    const name = (info.bungieGlobalDisplayName || info.displayName || 'Unknown') +
      (info.bungieGlobalDisplayNameCode
        ? '#' + String(info.bungieGlobalDisplayNameCode).padStart(4, '0')
        : '');
    const kills = Math.round((vals.kills?.basic?.value) || 0);
    const deaths = Math.round((vals.deaths?.basic?.value) || 0);
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '—';
    const done = isActualClear(vals);
    return `<div class="fireteam-member${isMe ? ' is-guardian' : ''}">
      <div class="member-name">${name}${isMe ? ' ◄' : ''}</div>
      <div class="member-stat"><div class="member-stat-val">${kills}</div><div class="member-stat-lbl">Kills</div></div>
      <div class="member-stat"><div class="member-stat-val">${deaths}</div><div class="member-stat-lbl">Deaths</div></div>
      <div class="member-stat"><div class="member-stat-val">${kd}</div><div class="member-stat-lbl">K/D</div></div>
      <div class="member-completed ${done ? 'ok' : 'dnf'}">${done ? 'Cleared' : 'DNF'}</div>
    </div>`;
  });

  panel.innerHTML = `
    <div class="fireteam-label">Fireteam · ${entries.length} guardian${entries.length !== 1 ? 's' : ''}</div>
    <div class="fireteam-grid">${rows.join('')}</div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDESHOW VIEW
// ═══════════════════════════════════════════════════════════════════════════

function renderSlideshow() {
  document.getElementById('slideshowView').style.display = 'block';
  document.getElementById('timelineView').style.display = 'none';

  if (!state.milestones.length) return;

  renderSlide(state.currentSlide);
  renderSlideDots();
}

function renderSlide(index) {
  if (index < 0 || index >= state.milestones.length) return;
  state.currentSlide = index;

  const m = state.milestones[index];
  const container = document.getElementById('slideContainer');
  container.className = 'slide active';

  const period = new Date(m.period);
  const dateStr = period.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = period.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const typeLabel = m.type === 'raid' ? 'Raid' : m.type === 'dungeon' ? 'Dungeon' : 'Story';
  const typeClassLabel = m.starred ? 'important' : m.type;

  const kills = Math.round(m.values?.kills?.basic?.value || 0);
  const deaths = Math.round(m.values?.deaths?.basic?.value || 0);
  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '—';
  const duration = formatDuration(m.values?.activityDurationSeconds?.basic?.value || 0);

  // Artwork section
  let artHtml;
  if (m.artwork) {
    artHtml = `<img src="${m.artwork}" class="loaded" alt="${m.name}" />`;
  } else {
    const icon = m.type === 'raid' ? '◆' : m.type === 'dungeon' ? '◈' : '○';
    artHtml = `
      <div class="slide-art-placeholder">
        <div class="icon">${icon}</div>
        <div class="hint">Add artwork to customize this slide</div>
      </div>
    `;
  }

  // Fireteam section
  let fireteamHtml = '';
  if (fireteamCache[m.instanceId] && fireteamCache[m.instanceId].length) {
    const entries = fireteamCache[m.instanceId];
    const sorted = [...entries].sort((a, b) => {
      const aIsMe = a.player?.destinyUserInfo?.membershipId === state.membershipId;
      const bIsMe = b.player?.destinyUserInfo?.membershipId === state.membershipId;
      if (aIsMe) return -1;
      if (bIsMe) return 1;
      return (b.score?.basic?.value || 0) - (a.score?.basic?.value || 0);
    });
    const rows = sorted.map(e => {
      const info = e.player?.destinyUserInfo || {};
      const vals = e.values || {};
      const isMe = info.membershipId === state.membershipId;
      const name = (info.bungieGlobalDisplayName || info.displayName || 'Unknown') +
        (info.bungieGlobalDisplayNameCode ? '#' + String(info.bungieGlobalDisplayNameCode).padStart(4, '0') : '');
      const ekills = Math.round((vals.kills?.basic?.value) || 0);
      const edeaths = Math.round((vals.deaths?.basic?.value) || 0);
      const ekd = edeaths > 0 ? (ekills / edeaths).toFixed(2) : ekills > 0 ? '∞' : '—';
      const done = isActualClear(vals);
      return `<div class="fireteam-member${isMe ? ' is-guardian' : ''}">
        <div class="member-name">${name}${isMe ? ' ◄' : ''}</div>
        <div class="member-stat"><div class="member-stat-val">${ekills}</div><div class="member-stat-lbl">Kills</div></div>
        <div class="member-stat"><div class="member-stat-val">${edeaths}</div><div class="member-stat-lbl">Deaths</div></div>
        <div class="member-stat"><div class="member-stat-val">${ekd}</div><div class="member-stat-lbl">K/D</div></div>
        <div class="member-completed ${done ? 'ok' : 'dnf'}">${done ? 'Cleared' : 'DNF'}</div>
      </div>`;
    });
    fireteamHtml = `
      <div class="slide-fireteam">
        <div class="fireteam-label">Fireteam · ${entries.length} guardian${entries.length !== 1 ? 's' : ''}</div>
        <div class="fireteam-grid">${rows.join('')}</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="slide-art">
      ${artHtml}
    </div>
    <div class="slide-info">
      <div class="slide-header">
        <div class="node-type ${typeClassLabel}">${m.starred ? '★ Important' : typeLabel}</div>
        <div class="slide-name">${m.name}</div>
        <div class="slide-date">${dateStr} · ${timeStr}</div>
      </div>
      <div class="slide-meta">
        <span>⏱ ${duration}</span>
        <span>⚔ ${kills} kills</span>
        <span>💀 ${deaths} deaths</span>
        <span>📊 ${kd} K/D</span>
      </div>
      ${m.flavour ? `<div class="slide-flavour">${m.flavour}</div>` : ''}
      ${fireteamHtml}
    </div>
  `;

  document.getElementById('slideCounter').textContent = `${index + 1} / ${state.milestones.length}`;
  renderSlideDots();
}

function renderSlideDots() {
  const dots = document.getElementById('slideDots');
  dots.innerHTML = state.milestones.map((m, i) => {
    const dotClass = m.type === 'raid' ? 'raid' : '';
    return `<div class="slide-dot ${dotClass} ${i === state.currentSlide ? 'active' : ''}" onclick="goToSlide(${i})"></div>`;
  }).join('');
}

function prevSlide() {
  if (state.currentSlide > 0) renderSlide(state.currentSlide - 1);
}

function nextSlide() {
  if (state.currentSlide < state.milestones.length - 1) renderSlide(state.currentSlide + 1);
}

function goToSlide(index) {
  renderSlide(index);
}

// ── Export ─────────────────────────────────────────────────────────────────

function exportData() {
  const allItems = [...state.milestones, ...state.titles]
    .sort((a, b) => new Date(a.period) - new Date(b.period));

  const rows = allItems.map(m => ({
    name: m.name,
    type: m.type,
    date: new Date(m.period).toISOString(),
    instanceId: m.instanceId,
    refId: m.refId,
    starred: m.starred,
    flavour: m.flavour || '',
    kills: Math.round(m.values?.kills?.basic?.value || 0),
    deaths: Math.round(m.values?.deaths?.basic?.value || 0),
    durationSeconds: m.values?.activityDurationSeconds?.basic?.value || 0,
  }));

  const payload = {
    exportedAt: new Date().toISOString(),
    guardian: state.displayName + '#' + String(state.displayNameCode).padStart(4, '0'),
    membershipId: state.membershipId,
    membershipType: state.membershipType,
    totalMilestones: state.milestones.length,
    totalTitles: state.titles.length,
    milestones: rows,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `starchart-${state.displayName}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Keyboard navigation for slideshow ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (state.currentView !== 'slideshow') return;
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'ArrowRight') nextSlide();
});
