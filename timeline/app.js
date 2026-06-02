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
  currentSlide: 0,
  currentView: 'timeline',
};

// Name cache: hash → string
const nameCache = {};

// Fireteam cache: instanceId → entries[]
const fireteamCache = {};

// ── Helpers ────────────────────────────────────────────────────────────────

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
    // Get characters
    const profileData = await apiFetch(
      `/Destiny2/${state.membershipType}/Profile/${state.membershipId}/?components=200`
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
    const seen = new Set();
    const allActivities = [];

    for (const char of chars) {
      const charId = char.characterId;
      const className = ({ 0: 'Titan', 1: 'Hunter', 2: 'Warlock' })[char.classType] || 'Guardian';

      // Fetch raids
      showStatus(`Scanning raids for ${className}...`, 'info', true);
      const raids = await fetchAllPages(4, charId);
      raids.forEach(a => {
        if (seen.has(a.activityDetails.instanceId)) return;
        seen.add(a.activityDetails.instanceId);
        a._type = 'raid';
        a._characterId = charId;
        allActivities.push(a);
      });

      // Fetch dungeons
      showStatus(`Scanning dungeons for ${className}...`, 'info', true);
      const dungeons = await fetchAllPages(82, charId);
      dungeons.forEach(a => {
        if (seen.has(a.activityDetails.instanceId)) return;
        seen.add(a.activityDetails.instanceId);
        a._type = 'dungeon';
        a._characterId = charId;
        allActivities.push(a);
      });

      // Fetch story missions
      showStatus(`Scanning story missions for ${className}...`, 'info', true);
      const stories = await fetchAllPages(2, charId);
      stories.forEach(a => {
        if (seen.has(a.activityDetails.instanceId)) return;
        seen.add(a.activityDetails.instanceId);
        a._type = 'story';
        a._characterId = charId;
        allActivities.push(a);
      });
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
      const name = nameCache[refId] || 'Unknown Activity';
      milestones.push({
        refId,
        name,
        type: act._type,
        instanceId: act.activityDetails.instanceId,
        period: act.period,
        values: act.values || {},
        characterId: act._characterId,
        starred: isImportantStory(name, refId),
        artwork: getArtwork(name),
        flavour: getFlavour(name),
      });
    }

    // Sort by date
    milestones.sort((a, b) => new Date(a.period) - new Date(b.period));

    state.milestones = milestones;

    // Update summary
    const raidCount = milestones.filter(m => m.type === 'raid').length;
    const dungeonCount = milestones.filter(m => m.type === 'dungeon').length;
    const storyCount = milestones.filter(m => m.type === 'story').length;

    document.getElementById('sumTotal').textContent = milestones.length;
    document.getElementById('sumRaids').textContent = raidCount;
    document.getElementById('sumDungeons').textContent = dungeonCount;
    document.getElementById('sumStories').textContent = storyCount;
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
  while (true) {
    const data = await apiFetch(
      `/Destiny2/${state.membershipType}/Account/${state.membershipId}/Character/${charId}/Stats/Activities/` +
      `?count=250&mode=${mode}&page=${page}`
    );
    if (data.ErrorCode !== 1) break;
    const acts = data.Response?.activities || [];
    all.push(...acts);
    if (acts.length < 250) break;
    page++;
  }
  return all;
}

async function resolveNames(hashes) {
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

async function prefetchFireteams(milestones) {
  for (const m of milestones) {
    if (fireteamCache[m.instanceId] !== undefined) continue;
    try {
      const data = await apiFetch(`/Destiny2/Stats/PostGameCarnageReport/${m.instanceId}/`);
      if (data.ErrorCode !== 1) { fireteamCache[m.instanceId] = []; continue; }
      fireteamCache[m.instanceId] = data.Response?.entries || [];
    } catch { fireteamCache[m.instanceId] = []; }
  }
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

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════════════════════

function renderTimeline() {
  const container = document.getElementById('timelineView');
  container.style.display = 'block';
  container.innerHTML = '';

  if (!state.milestones.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon">◈</div><p>No milestones found</p></div>';
    return;
  }

  state.milestones.forEach((m, i) => {
    const node = document.createElement('div');
    const typeClass = m.starred ? 'important' : m.type;
    node.className = `timeline-node ${typeClass}`;
    node.style.animationDelay = Math.min(i * 0.02, 0.5) + 's';

    const period = new Date(m.period);
    const dateStr = period.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = period.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    const typeLabel = m.type === 'raid' ? 'Raid' : m.type === 'dungeon' ? 'Dungeon' : 'Story';
    const typeClassLabel = m.starred ? 'important' : m.type;

    const kills = Math.round(m.values?.kills?.basic?.value || 0);
    const deaths = Math.round(m.values?.deaths?.basic?.value || 0);
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? '∞' : '—';
    const duration = formatDuration(m.values?.activityDurationSeconds?.basic?.value || 0);

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

// ── Keyboard navigation for slideshow ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (state.currentView !== 'slideshow') return;
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'ArrowRight') nextSlide();
});
