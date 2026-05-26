// Destiny 2 Raid activity hashes and names
// These are the directorActivityHash values for each raid

export interface RaidDefinition {
  hash: number;
  name: string;
  releaseDate: string;
  icon: string;
}

export const RAID_DEFINITIONS: Record<number, RaidDefinition> = {
  // Leviathan
  2693136601: { hash: 2693136601, name: 'Leviathan', releaseDate: '2017-09-13', icon: '👑' },
  2449714930: { hash: 2449714930, name: 'Leviathan, Eater of Worlds', releaseDate: '2017-12-08', icon: '🌊' },
  3089205900: { hash: 3089205900, name: 'Leviathan, Spire of Stars', releaseDate: '2018-05-11', icon: '⭐' },

  // Last Wish
  2122313384: { hash: 2122313384, name: 'Last Wish', releaseDate: '2018-09-14', icon: '🐉' },

  // Scourge of the Past
  548750096: { hash: 548750096, name: 'Scourge of the Past', releaseDate: '2018-12-07', icon: '⚙️' },

  // Crown of Sorrow
  3333172150: { hash: 3333172150, name: 'Crown of Sorrow', releaseDate: '2019-06-04', icon: '👹' },

  // Garden of Salvation
  3458480158: { hash: 3458480158, name: 'Garden of Salvation', releaseDate: '2019-10-05', icon: '🌿' },

  // Deep Stone Crypt
  910380154: { hash: 910380154, name: 'Deep Stone Crypt', releaseDate: '2020-11-21', icon: '❄️' },

  // Vault of Glass
  3881495763: { hash: 3881495763, name: 'Vault of Glass', releaseDate: '2021-05-22', icon: '🛡️' },

  // Vow of the Disciple
  1441982566: { hash: 1441982566, name: 'Vow of the Disciple', releaseDate: '2022-03-05', icon: '🕯️' },

  // King's Fall
  1374392663: { hash: 1374392663, name: "King's Fall", releaseDate: '2022-08-26', icon: '💀' },

  // Root of Nightmares
  2381413764: { hash: 2381413764, name: 'Root of Nightmares', releaseDate: '2023-03-10', icon: '😱' },

  // Crota's End
  417231112: { hash: 417231112, name: "Crota's End", releaseDate: '2023-09-01', icon: '🗡️' },

  // Salvation's Edge
  2192824679: { hash: 2192824679, name: "Salvation's Edge", releaseDate: '2024-06-07', icon: '🔺' },
};

export function getRaidName(directorActivityHash: number): string {
  const def = RAID_DEFINITIONS[directorActivityHash];
  return def ? def.name : `Unknown Raid (${directorActivityHash})`;
}

export function getRaidIcon(directorActivityHash: number): string {
  const def = RAID_DEFINITIONS[directorActivityHash];
  return def ? def.icon : '❓';
}

export function getRaidReleaseDate(directorActivityHash: number): string {
  const def = RAID_DEFINITIONS[directorActivityHash];
  return def ? def.releaseDate : '';
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
