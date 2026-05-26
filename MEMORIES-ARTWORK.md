# Memories Artwork Guide

The **Memories** view creates personalised Destiny legacy cards — static artwork with your raid stats overlaid. Artwork images are bundled with the site in `client/public/artwork/`.

---

## How artwork works

Artwork is loaded from **static files** in `client/public/artwork/`. Each raid has a corresponding `.jpg` file named by its slug. No uploads, no localStorage — just drop images in the folder and deploy.

### Folder structure

```
client/public/artwork/
├── PLACE-IMAGES-HERE.txt
├── leviathan.jpg
├── leviathan-eater-of-worlds.jpg
├── leviathan-spire-of-stars.jpg
├── last-wish.jpg
├── scourge-of-the-past.jpg
├── crown-of-sorrow.jpg
├── garden-of-salvation.jpg
├── deep-stone-crypt.jpg
├── vault-of-glass.jpg
├── vow-of-the-disciple.jpg
├── kings-fall.jpg
├── root-of-nightmares.jpg
├── crotas-end.jpg
├── salvations-edge.jpg
└── wrath-of-the-machine.jpg
```

### Slug format

Each raid's artwork is keyed by a "slug" — a URL-safe version of the raid name. The `getRaidSlug()` function in `client/src/utils/raidDefinitions.ts` generates these:

```typescript
export function getRaidSlug(raidName: string): string {
  return raidName
    .toLowerCase()
    .replace(/['']/g, '')       // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '');      // trim leading/trailing hyphens
}
```

The component loads images from: `/artwork/{slug}.jpg`

---

## All raid slugs

| Raid | Slug | Origin |
|---|---|---|
| Leviathan | `leviathan` | D2 |
| Leviathan, Eater of Worlds | `leviathan-eater-of-worlds` | D2 |
| Leviathan, Spire of Stars | `leviathan-spire-of-stars` | D2 |
| Last Wish | `last-wish` | D2 |
| Scourge of the Past | `scourge-of-the-past` | D2 |
| Crown of Sorrow | `crown-of-sorrow` | D2 |
| Garden of Salvation | `garden-of-salvation` | D2 |
| Deep Stone Crypt | `deep-stone-crypt` | D2 |
| Vault of Glass | `vault-of-glass` | D1 Reprised |
| Vow of the Disciple | `vow-of-the-disciple` | D2 |
| King's Fall | `kings-fall` | D1 Reprised |
| Root of Nightmares | `root-of-nightmares` | D2 |
| Crota's End | `crotas-end` | D1 Reprised |
| Salvation's Edge | `salvations-edge` | D2 |
| Wrath of the Machine | `wrath-of-the-machine` | D1 |

---

## How to add artwork

1. Place `.jpg` files in `client/public/artwork/`
2. Name each file using the slug from the table above (e.g., `last-wish.jpg`)
3. Commit and push — Netlify rebuilds automatically
4. The images appear on the Memories cards for all users

### If an image is missing

If a `.jpg` file doesn't exist for a raid, the card shows a placeholder with the raid name and a hint: *"Artwork missing — add {slug}.jpg to /artwork/"*. The Download button still works — it just won't include the background image.

---

## Image recommendations

For the best results (matching the Destiny 2 legacy screen look):

| Property | Recommendation |
|---|---|
| **Aspect ratio** | 16:9 (1920×1080) |
| **Format** | JPEG (smaller file size than PNG) |
| **File size** | ~300-500KB each (15 raids ≈ 6MB total) |
| **Content** | Raid environment art, boss arenas, concept art |
| **Composition** | Keep the focal point in the center/left — the overlay covers the bottom-right |

### Where to find artwork

- **Bungie press kits** — [bungie.net/press](https://www.bungie.net/en/News/Index?tag=press+kit)
- **Destiny 2 wallpapers** — official Bungie wallpapers from each expansion
- **In-game screenshots** — take a screenshot during a raid (hide HUD for clean shots)
- **Concept art** — from Destiny art books or Bungie blog posts

---

## How the download works

When a user clicks **"Download"**, the app:

1. Loads the artwork from `/artwork/{slug}.jpg` into a hidden `<canvas>` element
2. Draws the image at 1920×1080 (cover-fit, centered)
3. Applies a dark gradient overlay at the bottom
4. Renders text in the bottom-right corner:
   - **Raid name** (white, bold, 52px)
   - **First clear date** (gold, 28px)
   - **Player name** (grey, 24px)
   - **Fireteam members** (grey, 20px)
   - **Total clears** (dark grey, 18px)
   - **Origin badge** if D1 or Reprised
5. Exports as PNG and triggers a browser download

The downloaded file is named: `{raid-slug}-{player-name}.png`

---

## Git considerations

The artwork files can be large. Consider:

- **Git LFS** if files exceed GitHub's 100MB limit (unlikely for JPEGs)
- **`.gitignore`** the artwork folder if you don't want to track binary files in git — but then you'll need to upload them separately to Netlify
- **Netlify Large Media** for managing binary assets

The `PLACE-IMAGES-HERE.txt` placeholder file ensures the `artwork/` directory is tracked even if images are gitignored.

