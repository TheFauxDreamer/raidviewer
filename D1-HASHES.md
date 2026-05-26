# Destiny 1 Raid Hash Reference

The Destiny 1 API uses different activity hashes than Destiny 2. These hashes are **not publicly documented** by Bungie and may vary. This file explains where they're defined and how to verify or update them.

---

## Where D1 raid hashes are defined

**File:** `client/src/utils/raidDefinitions.ts`

```typescript
// --- Destiny 1 raids (original D1 activity hashes) ---
// Vault of Glass (D1 original)
2659248071: { hash: 2659248071, name: 'Vault of Glass', releaseDate: '2014-09-16', origin: 'd1' },
// Crota's End (D1 original)
156253474:  { hash: 156253474,  name: "Crota's End",    releaseDate: '2014-12-09', origin: 'd1' },
// King's Fall (D1 original)
1733556769: { hash: 1733556769, name: "King's Fall",    releaseDate: '2015-09-18', origin: 'd1' },
// Wrath of the Machine
2164432138: { hash: 2164432138, name: 'Wrath of the Machine', releaseDate: '2016-09-23', origin: 'd1' },
```

The hash is the key in `RAID_DEFINITIONS`. The `getRaidName()` function looks up raids by this hash.

---

## How the D1 API flow works

```
1. User searches for a D2 player (e.g., Steam)
2. App calls getLinkedProfiles() → finds linked D1 accounts (Xbox 360 / PS3)
3. For each D1 profile, calls getD1Profile() → gets D1 characters
4. For each D1 character, calls getD1ActivityHistory() → gets raid completions
5. Each D1 activity has an `activityHash` — matched against RAID_DEFINITIONS
```

**Relevant code in `App.tsx`** (around line 120):

```typescript
// --- Destiny 1 raids (via linked profiles) ---
try {
  const linked = await getLinkedProfiles(profile.membershipType, profile.membershipId);
  const d1Profiles = linked.Response?.profiles?.filter((p: any) =>
    p.membershipType === 1 || p.membershipType === 2  // 1 = Xbox, 2 = PSN
  ) || [];

  for (const d1p of d1Profiles) {
    // ... fetches D1 characters and activities
    for (const act of history.Response.data.activities) {
      const activityHash = act.activityHash || 0;
      const raidName = getRaidName(activityHash);
      // If raidName starts with "Unknown", the hash isn't in RAID_DEFINITIONS
    }
  }
}
```

---

## How to verify / find the correct D1 hashes

### Method 1: Browser DevTools (easiest)

1. Deploy the app and search for a player who played D1
2. Open browser DevTools → **Network** tab
3. Look for requests to `?action=d1ActivityHistory`
4. Click the response and expand `Response > data > activities`
5. Each activity has an `activityHash` — note the ones for raids
6. The `activityName` or `activityDescription` in the response will tell you which raid it is

### Method 2: Add debug logging

Temporarily add this to `App.tsx` inside the D1 activity loop:

```typescript
for (const act of history.Response.data.activities) {
  const activityHash = act.activityHash || 0;
  console.log('D1 activity:', activityHash, act.activityName, act.activityDescription);
  // ... rest of code
}
```

Then check the browser console after searching a D1 player.

### Method 3: Bungie API directly

Use the Bungie API explorer or curl:

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://www.bungie.net/Platform/Destiny/Stats/ActivityHistory/1/MEMBERSHIP_ID/CHARACTER_ID/?mode=Raid&count=10"
```

Replace `1` with membership type (1=Xbox, 2=PSN), and fill in the membership/character IDs.

---

## All API endpoints used for D1

| Action | Endpoint | Purpose |
|---|---|---|
| `linkedProfiles` | `Destiny2/{type}/Profile/{id}/LinkedProfiles/` | Find linked D1 accounts |
| `d1Profile` | `Destiny/{type}/Account/{id}/` | Get D1 characters |
| `d1ActivityHistory` | `Destiny/Stats/ActivityHistory/{type}/{id}/{char}/?mode=Raid` | Get D1 raid completions |
| `d1Pgcr` | `Destiny/Stats/PostGameCarnageReport/{instanceId}/` | Get D1 fireteam details |

These are defined in `netlify/functions/bungie-api.js`.

---

## Adding a new D1 raid

If you discover a D1 raid hash that's missing, add it to `client/src/utils/raidDefinitions.ts`:

```typescript
// In the RAID_DEFINITIONS object, add:
NEW_HASH_HERE: {
  hash: NEW_HASH_HERE,
  name: 'Raid Name Here',
  releaseDate: 'YYYY-MM-DD',
  origin: 'd1'
},
```

The `origin: 'd1'` is what triggers the blue `D1` badge in the UI.

---

## D1 membership types

| Type | Platform |
|---|---|
| 1 | Xbox 360 / Xbox One |
| 2 | PlayStation 3 / PlayStation 4 |

D1 was only on Xbox and PlayStation. The app filters linked profiles to these two types.

---

## Known limitations

- **D1 PGCR may not return fireteam data** for very old activities. The app handles this gracefully — it shows "Could not load fireteam data."
- **D1 activity hashes are unverified.** The current values are best guesses. If D1 raids show as "Unknown Raid (123456)", the hash needs updating.
- **Cross-save complicates things.** A player's D1 account may be on a different platform than their D2 account. The `LinkedProfiles` endpoint handles this.
- **Deleted characters** won't appear. If a player deleted their D1 characters, those raids are lost.
