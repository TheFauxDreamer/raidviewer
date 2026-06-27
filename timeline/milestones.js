/* ═══════════════════════════════════════════════════════════════════════════
   Star Chart — Important Story Milestones, Flavour Text & Artwork
   ═══════════════════════════════════════════════════════════════════════════

   This file defines:
   1. Which Destiny 2 story missions are "important" (highlighted in timeline)
   2. Flavour text for each milestone (displayed as a quote/summary)
   3. Artwork for each milestone (raids, dungeons, and important stories)

   Activities are matched by their display name as returned by the Bungie
   manifest (DestinyActivityDefinition.displayProperties.name).

   Source: https://www.destinypedia.com/Story
   ═══════════════════════════════════════════════════════════════════════════ */

const IMPORTANT_STORY_MISSIONS = new Set([

  // ═══════════════════════════════════════════════════════════════════════
  // The Red War — Vanilla D2 (vaulted with Beyond Light)
  // ═══════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════
  // Curse of Osiris — DLC 1 (vaulted)
  // ═══════════════════════════════════════════════════════════════════════
  'The Gateway',
  'A Deadly Trial',
  'Beyond Infinity',
  'Deep Storage',
  'Tree of Probabilities',
  'Hijacked',
  'A Garden World',
  'Omega',

  // ═══════════════════════════════════════════════════════════════════════
  // Warmind — DLC 2 (vaulted)
  // ═══════════════════════════════════════════════════════════════════════
  'Ice and Shadow',
  'Pilgrimage',
  'Off-World Recovery',
  'Strange Terrain',
  'Will of the Thousands',

  // ═══════════════════════════════════════════════════════════════════════
  // Forsaken — Year 2 Expansion
  // ═══════════════════════════════════════════════════════════════════════
  'Last Call',
  'High Plains Blues',
  'Scorned',
  'The Machinist',
  'Nothing Left to Say',
  'A Hum of Starlight',
  'Awakening',
  'Broken Courier',
  'The Oracle Engine',
  'Dark Monastery',

  // ═══════════════════════════════════════════════════════════════════════
  // Shadowkeep — Year 3 Expansion
  // ═══════════════════════════════════════════════════════════════════════
  'A Mysterious Disturbance',
  'In Search of Answers',
  'The Scarlet Keep',
  'In the Deep',
  'Beyond',

  // ═══════════════════════════════════════════════════════════════════════
  // Beyond Light — Year 4 Expansion
  // ═══════════════════════════════════════════════════════════════════════
  'Darkness\'s Doorstep',
  'The New Kell',
  'Rising Resistance',
  'The Warrior',
  'The Technocrat',
  'The Glassway',
  'The Kell of Darkness',
  'Sabotaging Salvation',
  'The Aftermath',
  'The Dark Priestess',

  // ═══════════════════════════════════════════════════════════════════════
  // The Witch Queen — Year 5 Expansion
  // ═══════════════════════════════════════════════════════════════════════
  'The Arrival',
  'The Investigation',
  'The Ghosts',
  'The Communion',
  'The Mirror',
  'The Cunning',
  'The Last Chance',
  'The Ritual',
  'Preservation',

  // ═══════════════════════════════════════════════════════════════════════
  // Lightfall — Year 6 Expansion
  // ═══════════════════════════════════════════════════════════════════════
  'First Contact',
  'Under Siege',
  'Downfall',
  'Breakneck',
  'On The Verge',
  'No Time Left',
  'Headlong',
  'Desperate Measures',
  'Partition: Hard Reset',
  'Partition: Backdoor',
  'Partition: Ordnance',
  'Parting the Veil',

  // ═══════════════════════════════════════════════════════════════════════
  // The Final Shape — Year 7 Expansion
  // ═══════════════════════════════════════════════════════════════════════
  'Transmigration',
  'Temptation',
  'Exegesis',
  'Requiem',
  'Ascent',
  'Dissent',
  'Iconoclasm',
  'Excision',

  // ═══════════════════════════════════════════════════════════════════════
  // The Edge of Fate — Year 8 Expansion (2025)
  // ═══════════════════════════════════════════════════════════════════════
  'Mission: The Invitation',
  'Mission: Transient',
  'Mission: Saturnism',
  'Gouge',
  'Mission: Fallow',
  'Mission: Nostos',
  'Commencement',
  'Mission: Morphology',
  'Charge',
  'Mission: Disruption',
  'Mission: Calculus',
  'Quarantine',
  'Mission: Criticality',
  'The Message',

  // ═══════════════════════════════════════════════════════════════════════
  // Renegades — Year 9 Expansion (2026)
  // ═══════════════════════════════════════════════════════════════════════
  'Imperium',
  'Welcome to the Frontier',
  'Fearsome Retainer',
  'Out in the Cold',
  'The Long Con',
  'Glory Beyond',

  // ═══════════════════════════════════════════════════════════════════════
  // SEASONAL MISSIONS
  // ═══════════════════════════════════════════════════════════════════════

  'Scourge of the Armory',
  'Origin: Nessus',
  'Rekindle the Flames',
  'Niobe\'s Torment',

  'Corridors of Time Part 1',
  'Corridors of Time Part 2',
  'Open the Gate',

  'Into the Mindlab',
  'Boot Sector',
  'Lunar Connection',
  'Expand and Collapse',
  'A Warmind\'s Secrets',
  'The Tyrant',

  'A Shadow Overhead',
  'Interference',

  'Trail of the Hunted',
  'Cry from Beyond',
  'The Crow and the Hawk',
  'Coup de Grâce',

  'Battleground: Behemoth',
  'Battleground: Hailstone',
  'Battleground: Foothold',
  'Battleground: Oracle',
  'Proving Grounds',

  'The Lost Splicer',
  'Expunge: Labyrinth',
  'Expunge: Styx',
  'Expunge: Tartarus',
  'Expunge: Delphi',

  'Cocoon',
  'Shattered Realm: Forest of Echoes',
  'Shattered Realm: Debris of Dreams',
  'Shattered Realm: Ruins of Wrath',
  'Exorcism',

  'Operation: Midas',
  'Sever - Shame',
  'Sever - Reconciliation',
  'Sever - Grief',
  'Sever - Forgiveness',
  'Sever - Rage',
  'Sever - Resolve',
  'Catharsis',

  'Salvage and Salvation',
  'Pirate Hideout: The Brute',
  'Pirate Hideout: The Sharpshooter',
  'Pirate Hideout: The Blademasters',
  'Pirate Hideout: The Beast Tamer',
  'Pirate Hideout: The Bully',
  'Pirate Hideout: The Coward',
  'Pirate Hideout: The Scrapworker',
  'Pirate Hideout: The Lucent Brood',

  'Hierarchy',
  'Operation: Archimedes',
  'Operation: Diocles',
  'Operation: Seraph\'s Shield',
  'Operation: Son of Saturn',
  'Operation: Sancus',
  'ABHORRENT IMPERATIVE',

  'Mission: Jailbreak',
  'Defiant Battleground: EDZ',
  'Defiant Battleground: Cosmodrome',
  'Defiant Battleground: Orbital Prison',
  'Mission: Retribution',

  'The Descent',
  'Operation Thunderbolt (Twilight)',
  'Mayday, Mayday (Midnight)',
  'Operation Fulgurite (Abyss)',
  'Barotrauma',

  'Way of the Witch',
  'Mission: Invoke',
  'Mission: Conjure',
  'Mission: Sunder',

  'Final Wish',
  'Polysemy',
  'Tautology',
  'Enthymeme',
  'Apophasis',
  'Synchysis',
  'Chiasmus',
  'Final Words',
  'Closer to the Heart',

  'Ash & Iron: Initialize',

  'Mission: Meteoric',
  'Mission: Mesmerize',
  'Mission: Shell',
  'Encore',

  'Na-Veskirisk',
  'Something Left to Say',
  'Captive Memories',
  'Kell\'s Fall',

  'Espial',
  'Recce',
  'Kludge',
  'Renascence',
  'Mission Captis',
  'Appellation',
  'Resile',

]);

/* ═══════════════════════════════════════════════════════════════════════════
   Exotic Missions
   ═══════════════════════════════════════════════════════════════════════════

   Exotic missions are special story missions that reward an Exotic weapon.
   They are styled differently from regular story missions — with their own
   colour and badge — and are always included in the timeline.

   Matched by display name from the Bungie manifest.
   ═══════════════════════════════════════════════════════════════════════════ */

const EXOTIC_MISSION_NAMES = new Set([
  // Year 2 — Forsaken
  'The Whisper',
  'Zero Hour',
  // Year 3 — Shadowkeep
  'The Other Side',
  // Year 4 — Beyond Light
  'Presage',
  'Harbinger',
  // Year 5 — The Witch Queen
  'Vox Obscura',
  'Operation: Seraph\'s Shield',
  // Year 6 — Lightfall
  '//node.ovrd.AVALON//',
  'Avalon',
  'Starcrossed',
  // Year 7 — The Final Shape
  'Encore',
  'Kell\'s Fall',
  // Year 8 — The Edge of Fate
  'Mission: Morphology',
  'Mission: Criticality',
]);

/* ═══════════════════════════════════════════════════════════════════════════
   Milestone Flavour Text
   ═══════════════════════════════════════════════════════════════════════════

   Map of activity name → flavour text.
   Each entry is a short quote or summary of what you achieved.
   Displayed beneath the mission name in both timeline and slideshow views.

   To add flavour for a new mission, add an entry here.
   ═══════════════════════════════════════════════════════════════════════════ */

const MILESTONE_FLAVOUR = {

  // ═══════════════════════════════════════════════════════════════════════
  // The Red War
  // ═══════════════════════════════════════════════════════════════════════
  'Homecoming': 'The Last City fell. The Tower burned. The Traveler was caged. You lost everything — and began the long road back.',
  'Adieu': 'Wounded and Lightless, you limped through the mountains. The Hawk led you to sanctuary in the EDZ.',
  'Spark': 'You found a shard of the Traveler in the Dark Forest. The Light returned — and with it, hope.',
  'Combustion': 'You lit a signal fire that could be seen from orbit. The Vanguard knew you were still alive.',
  'Hope': 'On Titan, you found Zavala — broken but not beaten. Together you learned of the Almighty.',
  'Riptide': 'You stole a CPU from the depths of the Arcology. The key to disabling the Almighty was in your hands.',
  'Utopia': 'You descended into the Arcology\'s flooded heart. What you found there would change everything.',
  'Looped': 'On Nessus, you located Cayde-6 — trapped in a Vex teleport loop, still cracking jokes.',
  'Six': 'You helped Cayde steal a Vex teleporter. Because of course Cayde\'s plan involved stealing from the Vex.',
  'Sacrilege': 'On Io, you found Ikora — consumed by doubt. You reminded her what it meant to be a Warlock.',
  'Fury': 'You retrieved a Warmind data core from the heart of Io. Rasputin\'s secrets were now yours.',
  'Payback': 'You stole a Cabal land tank and drove it straight through a Legion base. Sometimes subtlety is overrated.',
  'Unbroken': 'You fought through the EDZ to rescue Commander Sloane and the remaining resistance fighters.',
  'Larceny': 'You boarded the Almighty itself to sabotage its weapon systems. One Guardian against a star-killer.',
  '1AU': 'You rode a heat shield through the corona of the sun. No Guardian had ever been this close to a star.',
  'Chosen': 'You faced Dominus Ghaul in the heart of the Last City. The Traveler awoke — and chose you.',

  // ═══════════════════════════════════════════════════════════════════════
  // Curse of Osiris
  // ═══════════════════════════════════════════════════════════════════════
  'The Gateway': 'You followed Osiris\'s Ghost, Sagira, to Mercury. The Infinite Forest awaited.',
  'A Deadly Trial': 'You proved yourself worthy by surviving the Forest\'s simulations. Osiris was watching.',
  'Beyond Infinity': 'You ventured deeper into the Infinite Forest than any Guardian before you.',
  'Deep Storage': 'On Io, you recovered a map of the Forest from the Vex collective mind.',
  'Tree of Probabilities': 'You fought through a simulated future where the Cabal won the Red War.',
  'Hijacked': 'You stopped a Vex mind from taking control of Nessus\'s core systems.',
  'A Garden World': 'You entered a simulation of Mercury\'s past — a garden world before the Vex arrived.',
  'Omega': 'You defeated Panoptes, the Vex mind that could see every possible future. Osiris was free.',

  // ═══════════════════════════════════════════════════════════════════════
  // Warmind
  // ═══════════════════════════════════════════════════════════════════════
  'Ice and Shadow': 'You followed Ana Bray to Mars. Rasputin — the last Warmind — was awakening.',
  'Pilgrimage': 'You retraced the steps of the Iron Lords across the Hellas Basin.',
  'Off-World Recovery': 'You recovered a fragment of the Traveler from a Hive nest on Earth.',
  'Strange Terrain': 'You fought through the frozen caverns of Mars to reach Rasputin\'s core.',
  'Will of the Thousands': 'You slew Xol, the Will of the Thousands — a Hive Worm God. Rasputin was free.',

  // ═══════════════════════════════════════════════════════════════════════
  // Forsaken
  // ═══════════════════════════════════════════════════════════════════════
  'Last Call': 'Cayde-6 fell in the Prison of Elders. His Ghost destroyed. His last words: "The Vanguard was the best bet I ever lost."',
  'High Plains Blues': 'You arrived on the Tangled Shore. The hunt for the Barons began.',
  'Scorned': 'You tracked the Fanatic through the Shore. Each Baron you killed brought you closer to Uldren.',
  'The Machinist': 'You stopped the Machinist from building an army of mechanical Scorn.',
  'Nothing Left to Say': 'You confronted Uldren Sov in the Watchtower. But the true enemy was something far worse.',
  'A Hum of Starlight': 'You followed a strange signal to the Dreaming City — the Awoken\'s greatest secret.',
  'Awakening': 'You helped Petra Venj awaken the Dreaming City from its centuries-long curse.',
  'Broken Courier': 'You recovered a lost Corsair message. The truth about the Dreaming City began to surface.',
  'The Oracle Engine': 'You consulted the Oracle Engine and communed with Queen Mara Sov herself.',
  'Dark Monastery': 'You infiltrated a Hive monastery in the heart of the Dreaming City.',

  // ═══════════════════════════════════════════════════════════════════════
  // Shadowkeep
  // ═══════════════════════════════════════════════════════════════════════
  'A Mysterious Disturbance': 'You returned to the Moon. Something ancient was stirring beneath the surface.',
  'In Search of Answers': 'You followed Eris Morn\'s trail through the lunar depths. The Pyramid was calling.',
  'The Scarlet Keep': 'You stormed the Hive\'s new fortress on the Moon. The Hidden Swarm had a new master.',
  'In the Deep': 'You entered the Pyramid. The Darkness spoke to you directly for the first time.',
  'Beyond': 'You faced the Nightmares — phantoms of your past. The Darkness offered you salvation.',

  // ═══════════════════════════════════════════════════════════════════════
  // Beyond Light
  // ═══════════════════════════════════════════════════════════════════════
  'Darkness\'s Doorstep': 'You answered the Darkness\'s call and journeyed to Europa. A new power awaited.',
  'The New Kell': 'You confronted Eramis, the Kell of Darkness, as she rallied the Fallen to wield Stasis.',
  'Rising Resistance': 'You helped Variks and the Exo Stranger build a resistance against Eramis\'s empire.',
  'The Warrior': 'You defeated Phylaks, the Warrior — Eramis\'s fiercest lieutenant.',
  'The Technocrat': 'You stopped Praksis from weaponizing Stasis technology for the Fallen army.',
  'The Glassway': 'You fought through the Vex portal on Europa to stop a new invasion.',
  'The Kell of Darkness': 'You faced Eramis in her frozen throne room. You proved you could wield Darkness without being consumed.',
  'Sabotaging Salvation': 'You dismantled Eramis\'s remaining operations across Europa.',
  'The Aftermath': 'You dealt with the consequences of the Darkness\'s arrival on Europa.',
  'The Dark Priestess': 'You confronted the remnants of Eramis\'s council and their dark rituals.',

  // ═══════════════════════════════════════════════════════════════════════
  // The Witch Queen
  // ═══════════════════════════════════════════════════════════════════════
  'The Arrival': 'Savathûn\'s Throne World appeared above Mars. The Witch Queen had stolen the Light.',
  'The Investigation': 'You entered the Throne World. Hive Guardians — wielding the Light — stood against you.',
  'The Ghosts': 'You discovered the truth: Savathûn\'s Hive had been chosen by Ghosts. The implications were staggering.',
  'The Communion': 'You communed with the Europan Pyramid. The Witness spoke through it.',
  'The Mirror': 'You delved into Savathûn\'s memories. The line between truth and lies blurred.',
  'The Cunning': 'You outsmarted the Witch Queen at her own game. Even her deceptions had deceptions.',
  'The Last Chance': 'You raced to stop Savathûn\'s ritual to seal the Traveler in her Throne World.',
  'The Ritual': 'You confronted Savathûn in her inner sanctum. The Witch Queen fell — but her final secret remained.',
  'Preservation': 'You returned to the Throne World to ensure Savathûn\'s influence was truly ended.',

  // ═══════════════════════════════════════════════════════════════════════
  // Lightfall
  // ═══════════════════════════════════════════════════════════════════════
  'First Contact': 'The Witness arrived. The Shadow Legion invaded Neptune. You raced to protect a hidden city.',
  'Under Siege': 'Neomuna burned. You fought alongside the Cloud Striders to hold the line.',
  'Downfall': 'Calus\'s forces breached the city\'s defences. You witnessed the fall of a Cloud Strider.',
  'Breakneck': 'You raced through Neomuna\'s streets at breakneck speed to reach the Veil before Calus.',
  'On The Verge': 'The Veil was within reach. Calus was closing in. Everything hung in the balance.',
  'No Time Left': 'The Radial Mast was active. You had minutes to stop it — or lose everything.',
  'Headlong': 'You charged headlong into the heart of Calus\'s forces. No turning back.',
  'Desperate Measures': 'You faced Calus in the shadow of the Veil. The Witness\'s plan was complete.',
  'Partition: Hard Reset': 'You purged the Vex corruption from Neomuna\'s network core.',
  'Partition: Backdoor': 'You exploited a Vex backdoor to secure Neomuna\'s digital infrastructure.',
  'Partition: Ordnance': 'You disabled Vex weapons systems embedded in the city\'s network.',
  'Parting the Veil': 'You uncovered the true nature of the Veil — and what the Witness truly sought.',

  // ═══════════════════════════════════════════════════════════════════════
  // The Final Shape
  // ═══════════════════════════════════════════════════════════════════════
  'Transmigration': 'You followed the Witness into the Pale Heart of the Traveler. The final battle began.',
  'Temptation': 'The Witness offered you everything you ever wanted. You refused.',
  'Exegesis': 'You uncovered the Witness\'s true origin — a civilization that sought meaning in oblivion.',
  'Requiem': 'You mourned what was lost. The Pale Heart remembered every Guardian who fell.',
  'Ascent': 'You climbed toward the Witness\'s monolith. Each step was a testament to your will.',
  'Dissent': 'You shattered the Witness\'s unity. Even its own disciples turned against it.',
  'Iconoclasm': 'You broke the Witness\'s hold on the Traveler. The Light and Darkness Saga ended here.',
  'Excision': 'You cut the Witness out of existence. The Traveler was free. The universe could heal.',

  // ═══════════════════════════════════════════════════════════════════════
  // The Edge of Fate
  // ═══════════════════════════════════════════════════════════════════════
  'Mission: The Invitation': 'A mysterious signal from the Oort Cloud drew you to Kepler. A new chapter began.',
  'Mission: Transient': 'You discovered that something — or someone — was reshaping reality on Kepler.',
  'Mission: Saturnism': 'The influence of the Nine became undeniable. Their game was unfolding.',
  'Gouge': 'You carved a path through the unknown. The deeper you went, the stranger things became.',
  'Mission: Fallow': 'You found a dead world waiting to be reborn. The cycle was beginning again.',
  'Mission: Nostos': 'You returned to where it all began — and found it transformed beyond recognition.',
  'Commencement': 'A new era dawned. The old rules no longer applied.',
  'Mission: Morphology': 'You witnessed the reshaping of matter and meaning at the edge of known space.',
  'Charge': 'You led the assault against forces that defied understanding.',
  'Mission: Disruption': 'You broke the cycle. The pattern was interrupted — for now.',
  'Mission: Calculus': 'You calculated the impossible. The numbers pointed to something terrifying.',
  'Quarantine': 'You contained a threat that could have spread across the system.',
  'Mission: Criticality': 'You reached the tipping point. One more push would change everything.',
  'The Message': 'You received the message. What it said would define the future of humanity.',

  // ═══════════════════════════════════════════════════════════════════════
  // Renegades
  // ═══════════════════════════════════════════════════════════════════════
  'Imperium': 'A new empire rose from the ashes of the old. You stood in its way.',
  'Welcome to the Frontier': 'You returned to Mars — but it was not the Mars you remembered.',
  'Fearsome Retainer': 'You faced the empire\'s champion. Their reputation was well-earned.',
  'Out in the Cold': 'On Europa, old enemies became new allies. The cold forged strange bonds.',
  'The Long Con': 'You played the longest game. Every move had been leading to this.',
  'Glory Beyond': 'You reached for glory beyond the stars. What you found would echo through eternity.',

  // ═══════════════════════════════════════════════════════════════════════
  // Seasonal Missions
  // ═══════════════════════════════════════════════════════════════════════
  'Scourge of the Armory': 'You raided the Black Armory\'s lost vaults. Ancient weapons awaited.',
  'Origin: Nessus': 'You traced the Black Armory\'s origins to a Vex-converted world.',
  'Rekindle the Flames': 'You reignited the forges. The Black Armory\'s legacy would live on.',
  'Niobe\'s Torment': 'You solved Niobe\'s puzzle. The Black Armory\'s greatest secret was revealed.',

  'Corridors of Time Part 1': 'You stepped into the Corridors of Time. The past and future converged.',
  'Corridors of Time Part 2': 'You walked the path Saint-14 once walked. His fate was in your hands.',
  'Open the Gate': 'You opened the gate. Saint-14 returned to a world that needed him.',

  'Into the Mindlab': 'You entered Rasputin\'s neural network. The Warmind was under attack.',
  'Boot Sector': 'You purged the corruption from Rasputin\'s boot sector.',
  'Lunar Connection': 'You established a link between Rasputin and the lunar defence grid.',
  'Expand and Collapse': 'You witnessed Rasputin\'s power expand — and the Darkness\'s response.',
  'A Warmind\'s Secrets': 'You uncovered secrets Rasputin had hidden for centuries.',
  'The Tyrant': 'Rasputin revealed his true nature. The Tyrant had always been watching.',

  'A Shadow Overhead': 'The Pyramids arrived. Their shadow fell across the system.',
  'Interference': 'You pushed back against the Darkness\'s influence. For now, you held the line.',

  'Trail of the Hunted': 'You followed the trail of Xivu Arath\'s High Celebrant.',
  'Cry from Beyond': 'You heard a cry from beyond the grave. The Crow needed your help.',
  'The Crow and the Hawk': 'You fought alongside the Crow. His past was not his future.',
  'Coup de Grâce': 'You delivered the final blow to the High Celebrant. The hunt was over.',

  'Battleground: Behemoth': 'You crushed the Cabal insurrection on Nessus.',
  'Battleground: Hailstone': 'You shattered the Cabal\'s foothold on Europa.',
  'Battleground: Foothold': 'You drove the Cabal from their entrenched positions on Earth.',
  'Battleground: Oracle': 'You disrupted the Cabal\'s Psionic operations on Nessus.',
  'Proving Grounds': 'You proved yourself against Caiatl\'s champion. The ceasefire held.',

  'The Lost Splicer': 'You found Mithrax, the last Sacred Splicer. The Vex network awaited.',
  'Expunge: Labyrinth': 'You navigated the Vex network\'s labyrinth. Quria was watching.',
  'Expunge: Styx': 'You crossed the River Styx of the Vex domain.',
  'Expunge: Tartarus': 'You descended into the deepest level of the Vex network.',
  'Expunge: Delphi': 'You reached the Oracle. Quria\'s end was at hand.',

  'Cocoon': 'Savathûn emerged from her cocoon. The Witch Queen was free.',
  'Shattered Realm: Forest of Echoes': 'You ventured into the Shattered Realm. Echoes of the past surrounded you.',
  'Shattered Realm: Debris of Dreams': 'You navigated the debris of broken dreams in the Ascendant Plane.',
  'Shattered Realm: Ruins of Wrath': 'You conquered the ruins where wrath itself had taken form.',
  'Exorcism': 'You performed the exorcism. Savathûn\'s worm was removed — at great cost.',

  'Operation: Midas': 'You boarded the Derelict Leviathan. The Nightmares were waiting.',
  'Sever - Shame': 'You helped Crow sever his shame. His past no longer defined him.',
  'Sever - Reconciliation': 'You helped Zavala reconcile with his grief. His heart began to heal.',
  'Sever - Grief': 'You helped Eris confront her grief. The loss of her fireteam still burned.',
  'Sever - Forgiveness': 'You helped Caiatl forgive herself. A leader\'s burden is heavy.',
  'Sever - Rage': 'You helped Saint-14 channel his rage. Even heroes have demons.',
  'Sever - Resolve': 'You helped the Guardian find resolve. Doubt was the true enemy.',
  'Catharsis': 'You faced the Nightmare of the Leviathan itself. Calus\'s ghost was laid to rest.',

  'Salvage and Salvation': 'You joined the pirate crew. The relics of Nezarec were scattered across the system.',
  'Pirate Hideout: The Brute': 'You raided the Brute\'s hideout. One relic down.',
  'Pirate Hideout: The Sharpshooter': 'You outshot the Sharpshooter. Another relic claimed.',
  'Pirate Hideout: The Blademasters': 'You dueled the Blademasters. Their blades were no match.',
  'Pirate Hideout: The Beast Tamer': 'You tamed the Beast Tamer\'s creatures. The relic was yours.',
  'Pirate Hideout: The Bully': 'You stood up to the Bully. Size isn\'t everything.',
  'Pirate Hideout: The Coward': 'You cornered the Coward. There was nowhere left to run.',
  'Pirate Hideout: The Scrapworker': 'You dismantled the Scrapworker\'s operation.',
  'Pirate Hideout: The Lucent Brood': 'You faced the Lucent Hive pirates. Light versus Light.',

  'Hierarchy': 'You infiltrated the Seraph Station. Rasputin\'s resurrection had begun.',
  'Operation: Archimedes': 'You recovered a critical Seraph data fragment.',
  'Operation: Diocles': 'You secured another piece of Rasputin\'s consciousness.',
  'Operation: Seraph\'s Shield': 'You breached the Seraph Station\'s defences.',
  'Operation: Son of Saturn': 'You retrieved the final piece. Rasputin was almost whole.',
  'Operation: Sancus': 'You established a secure link to the Warsat network.',
  'ABHORRENT IMPERATIVE': 'Rasputin enacted the ABHORRENT IMPERATIVE. The Warsats fell.',

  'Mission: Jailbreak': 'You broke into a Shadow Legion prison. The captives were freed.',
  'Defiant Battleground: EDZ': 'You pushed back the Shadow Legion in the European Dead Zone.',
  'Defiant Battleground: Cosmodrome': 'You defended the Cosmodrome from Shadow Legion occupation.',
  'Defiant Battleground: Orbital Prison': 'You stormed an orbital prison. No cage could hold you.',
  'Mission: Retribution': 'You delivered retribution to the Shadow Legion commander.',

  'The Descent': 'You descended into the methane oceans of Titan. Something was waiting below.',
  'Operation Thunderbolt (Twilight)': 'You struck the Hive at twilight. Lightning from the deep.',
  'Mayday, Mayday (Midnight)': 'You answered a distress call at midnight. The depths held secrets.',
  'Operation Fulgurite (Abyss)': 'You brought lightning to the abyss. The Hive\'s ritual was disrupted.',
  'Barotrauma': 'You survived the crushing pressure of the deep. What you found changed everything.',

  'Way of the Witch': 'You walked the Way of the Witch. The Hive\'s secrets were laid bare.',
  'Mission: Invoke': 'You invoked powers that had not been called upon in millennia.',
  'Mission: Conjure': 'You conjured a bridge between worlds. The impossible became real.',
  'Mission: Sunder': 'You sundered the bond between Xivu Arath and her throne world.',

  'Final Wish': 'You made the final wish. Riven\'s last bargain was struck.',
  'Polysemy': 'You navigated the many meanings of the Ahamkara\'s words.',
  'Tautology': 'You broke the circular logic of the Wish Wall.',
  'Enthymeme': 'You completed the unspoken argument. The Ahamkara understood.',
  'Apophasis': 'You spoke of what could not be spoken. The wish took form.',
  'Synchysis': 'You untangled the scrambled syntax of dragon-speech.',
  'Chiasmus': 'You crossed the crossing. The pattern was complete.',
  'Final Words': 'You spoke the final words. The wish was granted.',
  'Closer to the Heart': 'You drew closer to the heart of the matter. The Traveler heard you.',

  'Ash & Iron: Initialize': 'You lit the first forge of a new era. From ash and iron, something new would rise.',

  // ═══════════════════════════════════════════════════════════════════════
  // Episodic Missions
  // ═══════════════════════════════════════════════════════════════════════
  'Mission: Meteoric': 'You followed a meteor\'s trail to the source of a new power.',
  'Mission: Mesmerize': 'You resisted the mesmer. Your will was stronger.',
  'Mission: Shell': 'You broke through the shell. What lay beneath was beautiful and terrible.',
  'Encore': 'You gave an encore performance. The Echoes would remember.',

  'Na-Veskirisk': 'You entered the lair of the Revenant. The hunt was on.',
  'Something Left to Say': 'You listened to what was left unsaid. The dead had messages for the living.',
  'Captive Memories': 'You freed the captive memories. The past could finally rest.',
  'Kell\'s Fall': 'You witnessed the fall of a Kell. Even the mighty can stumble.',

  'Espial': 'You conducted reconnaissance into the heart of heresy.',
  'Recce': 'You scouted the enemy\'s positions. Knowledge is power.',
  'Kludge': 'You assembled a solution from broken parts. Sometimes the best fix is the messy one.',
  'Renascence': 'You witnessed a rebirth. From heresy, something new emerged.',
  'Mission Captis': 'You captured the heretic\'s stronghold. The siege was over.',
  'Appellation': 'You were given a new name. The Hive would remember it.',
  'Resile': 'You bounced back from the brink. Resilience is the Guardian\'s greatest weapon.',

  // ═══════════════════════════════════════════════════════════════════════
  // Exotic Missions
  // ═══════════════════════════════════════════════════════════════════════
  'The Whisper': 'You heard the Whisper on Io. Xol called — and you answered. The Taken answered to you now.',
  'Zero Hour': 'You raced through the old Tower. Time was running out — but you were faster. Outbreak Perfected.',
  'The Other Side': 'You walked the Other Side. The Drifter\'s secrets were laid bare.',
  'Presage': 'You boarded the Glykon. What happened to Katabasis was a warning — and you survived it.',
  'Harbinger': 'You followed the Hawkmoon\'s call. The Traveler\'s shards still sang.',
  'Vox Obscura': 'You breached the Psion bunker on Mars. Caiatl\'s enemies learned to fear your voice.',
  'Operation: Seraph\'s Shield': 'You infiltrated the Seraph Station. Rasputin\'s secrets were worth the risk.',
  '//node.ovrd.AVALON//': 'You overrode the Vex network. Avalon was yours to command.',
  'Avalon': 'You conquered the Vex domain. The network bent to your will.',
  'Starcrossed': 'You walked the star-crossed path. The Ahamkara\'s wish was fulfilled.',
  'Encore': 'You gave an encore performance. The Echoes would remember.',
  'Kell\'s Fall': 'You witnessed the fall of a Kell. Even the mighty can stumble.',
  'Mission: Morphology': 'You witnessed the reshaping of matter and meaning at the edge of known space.',
  'Mission: Criticality': 'You reached the tipping point. One more push would change everything.',

};

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

/* ═══════════════════════════════════════════════════════════════════════════
   Title Flavour Text
   ═══════════════════════════════════════════════════════════════════════════

   Map of title name → flavour text.
   Titles (Seals) are earned by completing all associated Triumphs.
   Displayed as special milestone nodes in both timeline and slideshow views.

   Source: Bungie API DestinyRecordDefinition / DestinyPresentationNodeDefinition
   ═══════════════════════════════════════════════════════════════════════════ */

const TITLE_FLAVOUR = {

  // ── Forsaken Era ────────────────────────────────────────────────────────
  'Dredgen': 'You walked the line between Light and Dark. The Drifter saw something in you — and gave you a name.',
  'Wayfarer': 'You charted every corner of the system. No destination was too remote, no secret too well hidden.',
  'Cursebreaker': 'You broke the curse of the Dreaming City — or at least, you proved you could. The Awoken remember.',
  'Rivensbane': 'You slew Riven legitimately. No cheese, no shortcuts. The Last Wish was truly your last.',
  'Chronicler': 'You gathered every scrap of lore. The story of the Light and Darkness is now yours to tell.',
  'Blacksmith': 'You forged every weapon of the Black Armory. Ada-1\'s legacy lives on through you.',
  'Reckoner': 'You mastered Gambit Prime in all its forms. The Drifter still talks about you.',
  'Shadow': 'You became a Shadow of Calus. The Emperor\'s favour was yours — for a time.',
  'Unbroken': 'You reached Legend rank in the Crucible — three times. Your name is etched in competitive history.',
  'MMXIX': 'You were there when it mattered. The Moments of Triumph of 2019 are yours.',

  // ── Shadowkeep Era ──────────────────────────────────────────────────────
  'Undying': 'You stopped the Vex invasion of the Moon. The Undying Mind fell — again and again.',
  'Savior': 'You saved Saint-14 from the Corridors of Time. The greatest Titan who ever lived owes you everything.',
  'Almighty': 'You watched the Almighty fall from the sky. Rasputin\'s vengeance was absolute.',
  'Forerunner': 'You stood against the Pyramids when they first arrived. You were the first line of defence.',
  'MMXX': 'You rose to every challenge 2020 threw at you. The Darkness arrived — and you were ready.',

  // ── Beyond Light Era ────────────────────────────────────────────────────
  'Warden': 'You mastered the Hunts of the Tangled Shore. Xivu Arath\'s Celebrant fell to your blade.',
  'Chosen': 'You proved yourself to Empress Caiatl. The Cabal respect strength — and you have it.',
  'Splicer': 'You became a Sacred Splicer. The Vex network opened to you, and Quria was destroyed.',
  'Descendant': 'You mastered the Deep Stone Crypt. The secrets of Clovis Bray are yours.',
  'Fatebreaker': 'You conquered the Vault of Glass once more. Time itself bends to your will.',
  'Realmwalker': 'You walked the Shattered Realms and freed the Techeuns. The Ley Lines answer to you.',
  'MMXXI': 'You stood tall through another year. The Witch Queen\'s arrival was imminent — and you were ready.',

  // ── The Witch Queen Era ─────────────────────────────────────────────────
  'Disciple-Slayer': 'You defeated Rhulk, the First Disciple. The Witness\'s oldest servant fell in his own Pyramid.',
  'Gumshoe': 'You solved every mystery of the Throne World. No secret of Savathûn escaped your notice.',
  'Risen': 'You proved yourself in the new era of Light-wielding Hive. The Lucent Brood learned to fear you.',
  'Reaper': 'You became the Reaper aboard the Derelict Leviathan. The Nightmares were laid to rest.',
  'Scallywag': 'You sailed the spaceways as a pirate. The relics of Nezarec were gathered — for better or worse.',
  'Seraph': 'You helped Rasputin achieve his final sacrifice. The Warsats fell, and the Warmind was reborn.',
  'Kingslayer': 'You slew the Taken King once more. Oryx fell again — this time for good.',
  'MMXXII': 'You conquered the trials of 2022. The Witness drew closer — and you grew stronger.',

  // ── Lightfall Era ───────────────────────────────────────────────────────
  'Queensguard': 'You became Mara Sov\'s Queensguard. The Awoken Queen trusts you with her life.',
  'Aquanaut': 'You explored the depths of Titan\'s methane ocean. The secrets of the deep are yours.',
  'Haruspex': 'You mastered the arcane arts of the Hive. The Witch Queen\'s rituals are yours to command.',
  'Wishbearer': 'You bore the final wish of the Ahamkara. Riven\'s last bargain was honoured.',
  'Dream Warrior': 'You conquered the Root of Nightmares. The Witness\'s disciple fell in the heart of the Traveler.',
  'Ghoul': 'You mastered the Ghosts of the Deep. The Hive\'s darkest secrets were brought to light.',
  'Swordbearer': 'You bore the sword against Crota once more. The Son of Oryx fell again.',
  'Star Baker': 'You proved yourself the Star Baker. Even in darkness, you found time for celebration.',
  'MMXXIII': 'You faced the arrival of the Witness. 2023 was the year everything changed.',

  // ── The Final Shape Era ─────────────────────────────────────────────────
  'Iconoclast': 'You broke the Witness\'s hold on the Traveler. The Light and Darkness Saga ended with you.',
  'Slayer Baron': 'You became a Slayer Baron. The Revenant\'s forces fell before your fireteam.',
  'Harbinger': 'You became the Harbinger of a new age. The Echoes of the past guide your path.',
  'Heretic': 'You walked the path of heresy. The old ways crumbled — and you built something new.',
  'Intrepid': 'You explored the farthest reaches of the Oort Cloud. Kepler\'s secrets are yours.',
  'MMXXIV': 'You witnessed the end of an era. The Final Shape was achieved — and you were there.',

  // ── The Edge of Fate / Renegades Era ────────────────────────────────────
  'Pathfinder': 'You blazed a trail through the unknown. The frontier of Kepler is yours to chart.',
  'Renegade': 'You became a Renegade. The old rules don\'t apply to you anymore.',
  'Outlander': 'You ventured beyond the system\'s edge. What you found will define the future.',
  'MMXXV': 'You stood at the edge of fate. 2025 was the year of new frontiers.',
  'MMXXVI': 'You carry the torch into a new age. The journey continues.',

  // ── Event Titles ────────────────────────────────────────────────────────
  'Flamekeeper': 'You kept the flame of the Bonfire Bash. The Solstice remembers your light.',
  'Ghost Writer': 'You wrote your legend during the Festival of the Lost. The masks can\'t hide your achievements.',
  'Star Baker': 'You baked your way into Dawning history. Even Eva Levante is impressed.',
  'Champ': 'You proved yourself the Champion of the Guardian Games. Your class stands above the rest.',
  'Reveler': 'You revelled in every seasonal celebration. The Tower\'s festivities are yours to command.',
  'Iron Lord': 'You became an Iron Lord. The wolves of the Iron Banner answer to you now.',

};

/* ═══════════════════════════════════════════════════════════════════════════
   Milestone Chapters
   ═══════════════════════════════════════════════════════════════════════════

   Defines the chapter groupings for the timeline navigation menu.
   Each chapter has an id, a display label, and a list of mission names
   that belong to it.  Missions are matched by their display name.

   Chapters appear in the order defined here.  Missions not listed in any
   chapter are grouped under "Other".

   Each chapter can have children (seasons/episodes).  The nav shows DLCs
   in the top row; clicking one reveals its children in the second row.
   ═══════════════════════════════════════════════════════════════════════════ */

const MILESTONE_CHAPTERS = [
  {
    id: 'red-war',
    label: 'Red War',
    missions: [
      'Homecoming', 'Adieu', 'Spark', 'Combustion', 'Hope', 'Riptide',
      'Utopia', 'Looped', 'Six', 'Sacrilege', 'Fury', 'Payback',
      'Unbroken', 'Larceny', '1AU', 'Chosen',
    ],
  },
  {
    id: 'curse-of-osiris',
    label: 'Curse of Osiris',
    missions: [
      'The Gateway', 'A Deadly Trial', 'Beyond Infinity', 'Deep Storage',
      'Tree of Probabilities', 'Hijacked', 'A Garden World', 'Omega',
    ],
  },
  {
    id: 'warmind',
    label: 'Warmind',
    missions: [
      'Ice and Shadow', 'Pilgrimage', 'Off-World Recovery',
      'Strange Terrain', 'Will of the Thousands',
    ],
  },
  {
    id: 'forsaken',
    label: 'Forsaken',
    missions: [
      'Last Call', 'High Plains Blues', 'Scorned', 'The Machinist',
      'Nothing Left to Say', 'A Hum of Starlight', 'Awakening',
      'Broken Courier', 'The Oracle Engine', 'Dark Monastery',
    ],
    children: [
      {
        id: 'outlaw',
        label: 'Outlaw',
        missions: [],
      },
      {
        id: 'forge',
        label: 'Forge',
        missions: ['Scourge of the Armory', 'Origin: Nessus', 'Rekindle the Flames', 'Niobe\'s Torment'],
      },
      {
        id: 'drifter',
        label: 'Drifter',
        missions: [],
      },
      {
        id: 'opulence',
        label: 'Opulence',
        missions: [],
      },
    ],
  },
  {
    id: 'shadowkeep',
    label: 'Shadowkeep',
    missions: [
      'A Mysterious Disturbance', 'In Search of Answers',
      'The Scarlet Keep', 'In the Deep', 'Beyond',
    ],
    children: [
      {
        id: 'undying',
        label: 'Undying',
        missions: [],
      },
      {
        id: 'dawn',
        label: 'Dawn',
        missions: ['Corridors of Time Part 1', 'Corridors of Time Part 2', 'Open the Gate'],
      },
      {
        id: 'worthy',
        label: 'Worthy',
        missions: [
          'Into the Mindlab', 'Boot Sector', 'Lunar Connection',
          'Expand and Collapse', 'A Warmind\'s Secrets', 'The Tyrant',
        ],
      },
      {
        id: 'arrivals',
        label: 'Arrivals',
        missions: ['A Shadow Overhead', 'Interference'],
      },
    ],
  },
  {
    id: 'beyond-light',
    label: 'Beyond Light',
    missions: [
      'Darkness\'s Doorstep', 'The New Kell', 'Rising Resistance',
      'The Warrior', 'The Technocrat', 'The Glassway',
      'The Kell of Darkness', 'Sabotaging Salvation', 'The Aftermath',
      'The Dark Priestess',
    ],
    children: [
      {
        id: 'hunt',
        label: 'Hunt',
        missions: ['Trail of the Hunted', 'Cry from Beyond', 'The Crow and the Hawk', 'Coup de Grâce'],
      },
      {
        id: 'chosen',
        label: 'Chosen',
        missions: [
          'Battleground: Behemoth', 'Battleground: Hailstone',
          'Battleground: Foothold', 'Battleground: Oracle', 'Proving Grounds',
        ],
      },
      {
        id: 'splicer',
        label: 'Splicer',
        missions: [
          'The Lost Splicer', 'Expunge: Labyrinth', 'Expunge: Styx',
          'Expunge: Tartarus', 'Expunge: Delphi',
        ],
      },
      {
        id: 'lost',
        label: 'Lost',
        missions: [
          'Cocoon', 'Shattered Realm: Forest of Echoes',
          'Shattered Realm: Debris of Dreams', 'Shattered Realm: Ruins of Wrath',
          'Exorcism',
        ],
      },
    ],
  },
  {
    id: 'witch-queen',
    label: 'The Witch Queen',
    missions: [
      'The Arrival', 'The Investigation', 'The Ghosts', 'The Communion',
      'The Mirror', 'The Cunning', 'The Last Chance', 'The Ritual',
      'Preservation',
    ],
    children: [
      {
        id: 'risen',
        label: 'Risen',
        missions: [],
      },
      {
        id: 'haunted',
        label: 'Haunted',
        missions: [
          'Operation: Midas', 'Sever - Shame', 'Sever - Reconciliation',
          'Sever - Grief', 'Sever - Forgiveness', 'Sever - Rage',
          'Sever - Resolve', 'Catharsis',
        ],
      },
      {
        id: 'plunder',
        label: 'Plunder',
        missions: [
          'Salvage and Salvation', 'Pirate Hideout: The Brute',
          'Pirate Hideout: The Sharpshooter', 'Pirate Hideout: The Blademasters',
          'Pirate Hideout: The Beast Tamer', 'Pirate Hideout: The Bully',
          'Pirate Hideout: The Coward', 'Pirate Hideout: The Scrapworker',
          'Pirate Hideout: The Lucent Brood',
        ],
      },
      {
        id: 'seraph',
        label: 'Seraph',
        missions: [
          'Hierarchy', 'Operation: Archimedes', 'Operation: Diocles',
          'Operation: Seraph\'s Shield', 'Operation: Son of Saturn',
          'Operation: Sancus', 'ABHORRENT IMPERATIVE',
        ],
      },
    ],
  },
  {
    id: 'lightfall',
    label: 'Lightfall',
    missions: [
      'First Contact', 'Under Siege', 'Downfall', 'Breakneck',
      'On The Verge', 'No Time Left', 'Headlong', 'Desperate Measures',
      'Partition: Hard Reset', 'Partition: Backdoor', 'Partition: Ordnance',
      'Parting the Veil',
    ],
    children: [
      {
        id: 'defiance',
        label: 'Defiance',
        missions: [
          'Mission: Jailbreak', 'Defiant Battleground: EDZ',
          'Defiant Battleground: Cosmodrome', 'Defiant Battleground: Orbital Prison',
          'Mission: Retribution',
        ],
      },
      {
        id: 'deep',
        label: 'Deep',
        missions: [
          'The Descent', 'Operation Thunderbolt (Twilight)',
          'Mayday, Mayday (Midnight)', 'Operation Fulgurite (Abyss)', 'Barotrauma',
        ],
      },
      {
        id: 'witch',
        label: 'Witch',
        missions: ['Way of the Witch', 'Mission: Invoke', 'Mission: Conjure', 'Mission: Sunder'],
      },
      {
        id: 'wish',
        label: 'Wish',
        missions: [
          'Final Wish', 'Polysemy', 'Tautology', 'Enthymeme', 'Apophasis',
          'Synchysis', 'Chiasmus', 'Final Words', 'Closer to the Heart',
        ],
      },
    ],
  },
  {
    id: 'final-shape',
    label: 'The Final Shape',
    missions: [
      'Transmigration', 'Temptation', 'Exegesis', 'Requiem', 'Ascent',
      'Dissent', 'Iconoclasm', 'Excision',
    ],
    children: [
      {
        id: 'echoes',
        label: 'Echoes',
        missions: ['Mission: Meteoric', 'Mission: Mesmerize', 'Mission: Shell', 'Encore'],
      },
      {
        id: 'revenant',
        label: 'Revenant',
        missions: ['Na-Veskirisk', 'Something Left to Say', 'Captive Memories', 'Kell\'s Fall'],
      },
      {
        id: 'heresy',
        label: 'Heresy',
        missions: ['Espial', 'Recce', 'Kludge', 'Renascence', 'Mission Captis', 'Appellation', 'Resile'],
      },
    ],
  },
  {
    id: 'edge-of-fate',
    label: 'The Edge of Fate',
    missions: [
      'Mission: The Invitation', 'Mission: Transient', 'Mission: Saturnism',
      'Gouge', 'Mission: Fallow', 'Mission: Nostos', 'Commencement',
      'Mission: Morphology', 'Charge', 'Mission: Disruption',
      'Mission: Calculus', 'Quarantine', 'Mission: Criticality', 'The Message',
    ],
    children: [
      {
        id: 'reclamation',
        label: 'Reclamation',
        missions: ['Ash & Iron: Initialize'],
      },
      {
        id: 'ash-and-iron',
        label: 'Ash & Iron',
        missions: [],
      },
      {
        id: 'lawless',
        label: 'Lawless',
        missions: [],
      },
      {
        id: 'shadow-order',
        label: 'Shadow & Order',
        missions: [],
      },
    ],
  },
  {
    id: 'renegades',
    label: 'Renegades',
    missions: [
      'Imperium', 'Welcome to the Frontier', 'Fearsome Retainer',
      'Out in the Cold', 'The Long Con', 'Glory Beyond',
    ],
  },
];
