# Destiny 2 Raid Viewer ⚔️

A web app that shows your complete Destiny 2 raid history in chronological order using the Bungie API. Each raid entry shows your stats, fireteam members, and flags your **first-time clears** with a 🏆 badge.

**Hosted on Netlify** — no server to manage. Push to GitHub and it's live.

## Features

- 🔍 Search any Destiny 2 player by Bungie name
- 📋 Complete raid history across ALL characters, sorted chronologically
- 🏆 **First-time clear flag** — the first time you ever completed each raid is highlighted
- 👥 Fireteam details — see who you raided with, their class, K/D, and completion status
- 📊 Stats per raid — duration, kills, deaths, assists, K/D ratio
- 🎨 Dark-themed UI inspired by Destiny 2's aesthetic
- ☁️ Serverless backend via Netlify Functions — your API key stays secure

## Prerequisites

1. **A GitHub account** to host the code
2. **A Netlify account** (free tier works) — sign up at [netlify.com](https://netlify.com)
3. **Bungie API Key** — register an application at [bungie.net/en/Application](https://www.bungie.net/en/Application)

## Setup & Deploy (5 minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Destiny 2 Raid Viewer"
git remote add origin https://github.com/YOUR_USERNAME/raidviewer.git
git push -u origin main
```

### 2. Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **"Add new site"** → **"Import an existing project"**
2. Connect your GitHub and select the `raidviewer` repo
3. Netlify auto-detects the `netlify.toml` — no build settings needed
4. Click **Deploy site**

### 3. Set your Bungie API Key

1. In Netlify, go to **Site settings** → **Environment variables**
2. Add a variable:
   - **Key:** `BUNGIE_API_KEY`
   - **Value:** `your_actual_api_key_here`
3. Click **Save** and then **Deploys** → **Trigger deploy** → **Deploy site** to rebuild with the key

### 4. Done! 🎉

Your site is live at `https://YOUR-SITE-NAME.netlify.app`

## How to use

1. Enter your Bungie name (e.g., `Guardian#1234`) — this is the name shown in-game
2. Select your platform (Steam, Xbox, PSN, etc.)
3. The app fetches ALL your raid history across every character
4. Scroll through your timeline — first-time clears are marked with 🏆
5. Click any raid entry to expand and see your fireteam members with their stats

## Architecture

```
raidviewer/
├── netlify/
│   └── functions/
│       └── bungie-api.js      # Serverless function — proxies Bungie API
├── client/                    # React + Vite + TypeScript frontend
│   └── src/
│       ├── App.tsx            # Main app with search & state
│       ├── App.css            # All styles
│       ├── components/
│       │   └── RaidTimeline.tsx  # Timeline + fireteam display
│       └── utils/
│           ├── bungieApi.ts       # API client functions
│           └── raidDefinitions.ts # Raid names, hashes, class info
├── netlify.toml               # Netlify build & redirect config
└── README.md
```

**How it works:**
- The React frontend calls `/api?action=searchPlayer&...`
- Netlify redirects `/api/*` → `/.netlify/functions/bungie-api`
- The serverless function adds your `BUNGIE_API_KEY` and forwards to `bungie.net/Platform`
- Your API key never leaves the server — it's only in Netlify's environment variables

## API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `Destiny2/SearchDestinyPlayerByBungieName` | Find player by name#code |
| `Destiny2/{type}/Profile/{id}/?components=200` | Get characters |
| `Destiny2/{type}/Account/{id}/Character/{char}/Stats/Activities/?mode=4` | Get raid history |
| `Destiny2/Stats/PostGameCarnageReport/{instanceId}` | Get fireteam details |

## Local Development (optional)

If you want to run locally:

```bash
# Install Netlify CLI globally (requires Node.js)
npm install -g netlify-cli

# Run the full Netlify dev environment
netlify dev
```

This starts both the serverless function and the React dev server at `http://localhost:8888`.

## License

MIT — not affiliated with Bungie.
