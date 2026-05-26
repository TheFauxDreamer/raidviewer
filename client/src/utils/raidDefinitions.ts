// Destiny 2 Raid activity hashes and names
// These are the directorActivityHash values for each raid

export interface RaidDefinition {
  hash: number;
  name: string;
  releaseDate: string;
  origin: 'd2' | 'd1-reprised' | 'd1';
}

export const RAID_DEFINITIONS: Record<number, RaidDefinition> = {
  // Leviathan
  2693136601: { hash: 2693136601, name: 'Leviathan', releaseDate: '2017-09-13', origin: 'd2' },
  2449714930: { hash: 2449714930, name: 'Leviathan, Eater of Worlds', releaseDate: '2017-12-08', origin: 'd2' },
  3089205900: { hash: 3089205900, name: 'Leviathan, Spire of Stars', releaseDate: '2018-05-11', origin: 'd2' },

  // Last Wish
  2122313384: { hash: 2122313384, name: 'Last Wish', releaseDate: '2018-09-14', origin: 'd2' },

  // Scourge of the Past
  548750096: { hash: 548750096, name: 'Scourge of the Past', releaseDate: '2018-12-07', origin: 'd2' },

  // Crown of Sorrow
  3333172150: { hash: 3333172150, name: 'Crown of Sorrow', releaseDate: '2019-06-04', origin: 'd2' },

  // Garden of Salvation
  3458480158: { hash: 3458480158, name: 'Garden of Salvation', releaseDate: '2019-10-05', origin: 'd2' },

  // Deep Stone Crypt
  910380154: { hash: 910380154, name: 'Deep Stone Crypt', releaseDate: '2020-11-21', origin: 'd2' },

  // Vault of Glass (D1 reprised)
  3881495763: { hash: 3881495763, name: 'Vault of Glass', releaseDate: '2021-05-22', origin: 'd1-reprised' },

  // Vow of the Disciple
  1441982566: { hash: 1441982566, name: 'Vow of the Disciple', releaseDate: '2022-03-05', origin: 'd2' },

  // King's Fall (D1 reprised)
  1374392663: { hash: 1374392663, name: "King's Fall", releaseDate: '2022-08-26', origin: 'd1-reprised' },

  // Root of Nightmares
  2381413764: { hash: 2381413764, name: 'Root of Nightmares', releaseDate: '2023-03-10', origin: 'd2' },

  // Crota's End (D1 reprised)
  417231112: { hash: 417231112, name: "Crota's End", releaseDate: '2023-09-01', origin: 'd1-reprised' },

  // Salvation's Edge
  2192824679: { hash: 2192824679, name: "Salvation's Edge", releaseDate: '2024-06-07', origin: 'd2' },

  // --- Destiny 1 raids (original D1 activity hashes) ---
  // Vault of Glass (D1 original)
  2659248071: { hash: 2659248071, name: 'Vault of Glass', releaseDate: '2014-09-16', origin: 'd1' },
  // Crota's End (D1 original)
  156253474: { hash: 156253474, name: "Crota's End", releaseDate: '2014-12-09', origin: 'd1' },
  // King's Fall (D1 original)
  1733556769: { hash: 1733556769, name: "King's Fall", releaseDate: '2015-09-18', origin: 'd1' },
  // Wrath of the Machine
  2164432138: { hash: 2164432138, name: 'Wrath of the Machine', releaseDate: '2016-09-23', origin: 'd1' },
};

export function getRaidName(directorActivityHash: number): string {
  const def = RAID_DEFINITIONS[directorActivityHash];
  return def ? def.name : `Unknown Raid (${directorActivityHash})`;
}

export function getRaidOrigin(directorActivityHash: number): 'd2' | 'd1-reprised' | 'd1' | 'unknown' {
  const def = RAID_DEFINITIONS[directorActivityHash];
  return def ? def.origin : 'unknown';
}

export function getRaidReleaseDate(directorActivityHash: number): string {
  const def = RAID_DEFINITIONS[directorActivityHash];
  return def ? def.releaseDate : '';
}

export function getRaidSlug(raidName: string): string {
  return raidName
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const CLASS_NAMES: Record<number, string> = {
  0: 'Titan',
  1: 'Hunter',
  2: 'Warlock',
};

export const CLASS_EMOJIS: Record<number, string> = {
  0: '🛡️',
  1: '🔪',
  2: '✨',
};
