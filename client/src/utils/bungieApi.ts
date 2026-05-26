// Calls the Netlify serverless function at /.netlify/functions/bungie-api
// In dev mode (Vite), the proxy in vite.config.ts forwards /api/* to the function
const API_BASE = '/api';

export interface BungieProfile {
  membershipType: number;
  membershipId: string;
  displayName: string;
  bungieGlobalDisplayNameCode: number;
  iconPath: string;
  crossSaveOverride: number;
}

export interface CharacterInfo {
  characterId: string;
  classType: number;
  lightLevel: number;
  emblemBackgroundPath: string;
}

export interface RaidActivity {
  instanceId: string;
  period: string; // ISO date
  activityHash: number;
  activityName: string;
  directorActivityHash: number;
  origin: 'd2' | 'd1-reprised' | 'd1' | 'unknown';
  activityType: 'raid' | 'dungeon' | 'unknown';
  mode: number;
  isCompleted: boolean;
  kills: number;
  deaths: number;
  assists: number;
  timePlayedSeconds: number;
  completionReason: number;
  standing: number;
  playerCount: number;
  fireteamMembers: FireteamMember[];
  isFirstClear: boolean;
}

export interface FireteamMember {
  displayName: string;
  bungieGlobalDisplayNameCode: number;
  membershipId: string;
  membershipType: number;
  characterClass: string;
  lightLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  completed: boolean;
  timePlayedSeconds: number;
  emblemIcon: string;
}

export async function searchPlayer(
  displayName: string,
  displayNameCode: number
): Promise<BungieProfile[]> {
  const res = await fetch(
    `${API_BASE}?action=searchPlayer&displayName=${encodeURIComponent(displayName)}&displayNameCode=${displayNameCode}`
  );
  const data = await res.json();
  if (data.Response && data.Response.length > 0) {
    return data.Response.map((p: any) => ({
      membershipType: p.membershipType,
      membershipId: p.membershipId,
      displayName: p.displayName || p.bungieGlobalDisplayName || '',
      bungieGlobalDisplayNameCode: p.bungieGlobalDisplayNameCode || displayNameCode,
      iconPath: p.iconPath || '',
      crossSaveOverride: p.crossSaveOverride || 0,
    }));
  }
  return [];
}

export async function getProfile(
  membershipType: number,
  membershipId: string
): Promise<{ characters: CharacterInfo[] }> {
  const res = await fetch(
    `${API_BASE}?action=profile&membershipType=${membershipType}&membershipId=${membershipId}&components=200`
  );
  const data = await res.json();
  const chars: CharacterInfo[] = [];
  if (data.Response?.characters?.data) {
    for (const [id, char] of Object.entries(data.Response.characters.data) as any) {
      chars.push({
        characterId: id,
        classType: char.classType,
        lightLevel: char.light,
        emblemBackgroundPath: char.emblemBackgroundPath || '',
      });
    }
  }
  return { characters: chars };
}

export async function getActivityHistory(
  membershipType: number,
  membershipId: string,
  characterId: string,
  page: number = 0,
  count: number = 250,
  mode: number = 4
): Promise<any> {
  const res = await fetch(
    `${API_BASE}?action=activityHistory&membershipType=${membershipType}&membershipId=${membershipId}&characterId=${characterId}&count=${count}&mode=${mode}&page=${page}`
  );
  return res.json();
}

export async function getPGCR(instanceId: string): Promise<any> {
  const res = await fetch(`${API_BASE}?action=pgcr&instanceId=${instanceId}`);
  return res.json();
}

// --- Destiny 1 API ---

export async function getLinkedProfiles(
  membershipType: number,
  membershipId: string
): Promise<any> {
  const res = await fetch(
    `${API_BASE}?action=linkedProfiles&membershipType=${membershipType}&membershipId=${membershipId}`
  );
  return res.json();
}

export async function getD1Profile(
  membershipType: number,
  membershipId: string
): Promise<any> {
  const res = await fetch(
    `${API_BASE}?action=d1Profile&membershipType=${membershipType}&membershipId=${membershipId}`
  );
  return res.json();
}

export async function getD1ActivityHistory(
  membershipType: number,
  membershipId: string,
  characterId: string,
  page: number = 0,
  count: number = 250
): Promise<any> {
  const res = await fetch(
    `${API_BASE}?action=d1ActivityHistory&membershipType=${membershipType}&membershipId=${membershipId}&characterId=${characterId}&count=${count}&page=${page}`
  );
  return res.json();
}

export async function getD1PGCR(instanceId: string): Promise<any> {
  const res = await fetch(`${API_BASE}?action=d1Pgcr&instanceId=${instanceId}`);
  return res.json();
}
