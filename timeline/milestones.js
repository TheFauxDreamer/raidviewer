/* ═══════════════════════════════════════════════════════════════════════════
   Star Chart — Important Story Milestones & Artwork
   ═══════════════════════════════════════════════════════════════════════════

   This file defines:
   1. Which Destiny 2 story missions are "important" (highlighted in timeline)
   2. Artwork for each milestone (raids, dungeons, and important stories)

   Activities are matched by their display name as returned by the Bungie
   manifest (DestinyActivityDefinition.displayProperties.name).

   ── Adding artwork ───────────────────────────────────────────────────────
   Place images in the art/ directory, then add entries to MILESTONE_ARTWORK
   below.  The key is the exact English activity name, the value is the
   relative path from this file, e.g. 'art/last-wish.jpg'.

   Supported formats: jpg, png, webp, gif.

   ── How to find activity names ────────────────────────────────────────────
   1. Open the Star Chart, search your guardian, and let it load.
   2. Open the browser console (F12) and run:
        state.milestones.map(m => m.name)
   3. Copy the names you want to add artwork for into the map below.
   ═══════════════════════════════════════════════════════════════════════════ */

const IMPORTANT_STORY_MISSIONS = new Set([

  // ── The Red War (vanilla D2, vaulted) ───────────────────────────────────
  'Homecoming',
  'Adieu',
  'Spark',
  'Combustion',
  'Hope',
  'Riptide',
  'Utopia',
  'Looped',
  'Six',
  'Sacrilege',
  'Fury',
  'Payback',
  'Unbroken',
  'Larceny',
  '1AU',
  'Chosen',

  // ── Curse of Osiris (vaulted) ───────────────────────────────────────────
  'The Gateway',
  'A Deadly Trial',
  'Beyond Infinity',
  'Deep Storage',
  'Tree of Probabilities',
  'Hijacked',
  'A Garden World',
  'Omega',

  // ── Warmind (vaulted) ───────────────────────────────────────────────────
  'Ice and Shadow',
  'Pilgrimage',
  'Off-World Recovery',
  'Strange Terrain',
  'Will of the Thousands',

  // ── Forsaken ────────────────────────────────────────────────────────────
  'Last Call',
  'High Plains Blues',
  'Scorned',
  'The Rider',
  'The Trickster',
  'The Mad Bomber',
  'The Hangman',
  'The Mindbender',
  'The Rifleman',
  'Target: The Machinist',
  'Nothing Left to Say',
  'The Corrupted',

  // ── Shadowkeep ──────────────────────────────────────────────────────────
  'A Mysterious Disturbance',
  'In the Deep',
  'The Nightmare Cometh',
  'Ghosts of Our Past',
  'The Scarlet Keep',
  'Beyond',

  // ── Beyond Light ────────────────────────────────────────────────────────
  'Darkness\'s Doorstep',
  'The New Kell',
  'Rising Resistance',
  'The Warrior',
  'The Technocrat',
  'The Glassway',
  'The Kell of Darkness',

  // ── The Witch Queen ─────────────────────────────────────────────────────
  'The Arrival',
  'The Investigation',
  'The Ghosts',
  'The Communion',
  'The Mirror',
  'The Cunning',
  'The Last Chance',
  'The Ritual',

  // ── Lightfall ───────────────────────────────────────────────────────────
  'First Contact',
  'Under Siege',
  'Breakneck',
  'On the Verge',
  'No Time Left',
  'Headlong',
  'Desperate Measures',

  // ── The Final Shape ─────────────────────────────────────────────────────
  'Transmigration',
  'Temptation',
  'Exegesis',
  'Requiem',
  'Ascent',
  'Dissent',
  'Iconoclasm',

]);

/* ═══════════════════════════════════════════════════════════════════════════
   Milestone Artwork
   ═══════════════════════════════════════════════════════════════════════════

   Map of activity name → image path (relative to this file).
   Add entries below as you collect artwork.  Leave the map empty to start —
   the slideshow will show placeholder icons until artwork is added.

   Example:
     'Last Wish': 'art/last-wish.jpg',
     'Deep Stone Crypt': 'art/deep-stone-crypt.png',
     'Homecoming': 'art/homecoming.webp',
   ═══════════════════════════════════════════════════════════════════════════ */

const MILESTONE_ARTWORK = {

  // ── Raids ───────────────────────────────────────────────────────────────

  // ── Dungeons ────────────────────────────────────────────────────────────

  // ── Important Story Missions ────────────────────────────────────────────

};
