# Destiny 2 Raid Viewer — Full Setup Guide

A step-by-step guide to get your Destiny 2 raid history viewer live on the internet using GitHub + Netlify. No local development tools required — everything happens in your browser.

---

## Table of Contents

1. [What You Need](#1-what-you-need)
2. [Get a Bungie API Key](#2-get-a-bungie-api-key)
3. [Push the Code to GitHub](#3-push-the-code-to-github)
4. [Deploy on Netlify](#4-deploy-on-netlify)
5. [Set the API Key Environment Variable](#5-set-the-api-key-environment-variable)
6. [Verify Everything Works](#6-verify-everything-works)
7. [How to Use the App](#7-how-to-use-the-app)
8. [Troubleshooting](#8-troubleshooting)
9. [Custom Domain (Optional)](#9-custom-domain-optional)
10. [Updating the App](#10-updating-the-app)
11. [Architecture Deep Dive](#11-architecture-deep-dive)
12. [FAQ](#12-faq)

---

## 1. What You Need

| Thing | Why | Cost |
|---|---|---|
| **GitHub account** | Hosts the source code | Free |
| **Netlify account** | Hosts the website & runs the serverless function | Free (generous tier) |
| **Bungie API Key** | Lets the app talk to Bungie's servers | Free |
| **~10 minutes** | To follow this guide | Priceless |

> **You do NOT need Node.js, npm, or anything installed on your computer.** The build happens on Netlify's servers.

---

## 2. Get a Bungie API Key

1. Go to **[bungie.net/en/Application](https://www.bungie.net/en/Application)**
2. Sign in with your platform account (Steam, Xbox, PlayStation, etc.)
3. Click **"Create New App"**
4. Fill in the form:

   | Field | Value |
   |---|---|
   | **Application Name** | `Raid Viewer` (or anything you like) |
   | **Website** | `https://YOUR-NETLIFY-SITE.netlify.app` (you can update this later) |
   | **OAuth Client Type** | `Public` |
   | **Redirect URL** | Leave blank for now |
   | **Scope** | Check at least: `Read your Destiny 2 information (Vault, Inventory, and Vendors), and your Character and Progression` |
   | **Origin Header** | `*` or your Netlify URL |

5. Click **"Save"**
6. You'll see your new app listed. Copy the **API Key** — it's a long string of letters and numbers.
7. **Keep this key secret!** It gives access to Bungie API data.

> **Note:** If you see an "API Key" field and a separate "OAuth client_id / client_secret" section, you only need the **API Key** for this app. OAuth is not required.

---

## 3. Push the Code to GitHub

### Option A: Using the GitHub Web Interface (Easiest)

1. Go to **[github.com/new](https://github.com/new)**
2. Repository name: `raidviewer`
3. Set to **Public** (or Private — both work)
4. **Do NOT** check "Add a README file", ".gitignore", or "Choose a license" — we already have those
5. Click **"Create repository"**
6. On the next page, under **"…or push an existing repository from the command line"**, copy the commands. They'll look like:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/raidviewer.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Using Terminal (if you have git installed)

Open a terminal in the `raidviewer` folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Destiny 2 Raid Viewer"

# Link to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/raidviewer.git

# Push
git branch -M main
git push -u origin main
```

### Option C: Using GitHub Desktop

1. Download [GitHub Desktop](https://desktop.github.com/)
2. File → Add Local Repository → select the `raidviewer` folder
3. Click "Publish repository" → set name to `raidviewer` → Publish

---

## 4. Deploy on Netlify

1. Go to **[app.netlify.com](https://app.netlify.com)**
2. Sign up / log in (use your GitHub account for easiest setup)
3. Click **"Add new site"** → **"Import an existing project"**
4. Click **"GitHub"** → authorize Netlify if prompted
5. Search for and select the `raidviewer` repository
6. Netlify will auto-detect the build settings from `netlify.toml`. You should see:

   | Setting | Value |
   |---|---|
   | **Branch to deploy** | `main` |
   | **Build command** | `cd client && npm install && npm run build` |
   | **Publish directory** | `client/dist` |

7. Click **"Deploy site"**

Netlify will now:
- Clone your repo
- Install the React dependencies (`npm install`)
- Build the frontend (`npm run build`)
- Deploy the built files to a CDN
- Set up the serverless function

This takes about **1–2 minutes**. You'll see a progress log on screen.

8. When it's done, you'll see a URL like `https://random-name-123456.netlify.app`
9. **Click the URL** — the site loads, but API calls won't work yet (we haven't set the key!)

> **Optional:** Go to **Site settings** → **Site details** → **Change site name** to something memorable like `my-destiny-raid-viewer`

---

## 5. Set the API Key Environment Variable

The serverless function needs your Bungie API key to work. We store it as an environment variable in Netlify so it stays secret.

1. In your Netlify site dashboard, go to **Site configuration** → **Environment variables**
2. Click **"Add a variable"** → **"Add a single variable"**
3. Fill in:

   | Field | Value |
   |---|---|
   | **Key (name)** | `BUNGIE_API_KEY` |
   | **Value** | Paste your Bungie API key here |

4. Click **"Save"**
5. Now you need to **redeploy** for the variable to take effect:
   - Go to **Deploys** (in the left sidebar)
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Wait ~1 minute for the new deploy to finish

> **Important:** Environment variables are only injected at build/deploy time. Always trigger a new deploy after adding or changing them.

---

## 6. Verify Everything Works

1. Open your Netlify URL (e.g., `https://my-destiny-raid-viewer.netlify.app`)
2. You should see the Raid Viewer homepage with the search form
3. Enter a Bungie name to test:
   - **Name:** A known Destiny player's Bungie name (without the `#`)
   - **Code:** The 4-digit code after the `#`
   - Example: If the player is `Guardian#1234`, enter `Guardian` in the name field and `1234` in the code field
4. Click **"Search"**
5. You should see platform options appear (Steam, Xbox, PSN, etc.)
6. Click a platform — the app will load all raid completions
7. If you see raids loading, **everything is working!** 🎉

### If it doesn't work:

- Open your browser's Developer Tools (F12 or right-click → Inspect)
- Go to the **Console** tab
- Look for red error messages
- See the [Troubleshooting](#8-troubleshooting) section below

---

## 7. How to Use the App

### Searching for a player

1. Enter the **Bungie name** (the part before `#`)
2. Enter the **4-digit code** (the part after `#`)
3. Click **Search**
4. Select the platform the player uses

### Reading the timeline

Each raid entry shows:

| Element | Meaning |
|---|---|
| 🏆 **First Clear!** badge | This is the first time the player ever completed this raid |
| ✅ **Clear** badge | The raid was completed successfully |
| ❌ **Incomplete** badge | The player loaded in but didn't finish |
| **Duration** | How long the activity lasted |
| **K/D** | Kill/Death ratio |
| **Kills / Deaths / Assists** | Combat stats |
| **Fireteam** | Number of players in the activity |

### Timeline dots

- 🟢 **Green dot** = Completed clear
- 🟡 **Gold dot** = First-time clear of this raid
- 🔴 **Red dot** = Incomplete / abandoned run

### Viewing fireteam details

- **Click any raid card** to expand it
- You'll see all fireteam members with:
  - Class (Titan 🛡️ / Hunter 🔪 / Warlock ✨)
  - Bungie name
  - Individual K/D, kills, deaths, assists
  - Whether they completed the raid (✅) or left early (❌)
- **Click again** to collapse

### Raids tracked

The app recognizes all 14 Destiny 2 raids:

| Raid | Release |
|---|---|
| Leviathan | Sep 2017 |
| Leviathan, Eater of Worlds | Dec 2017 |
| Leviathan, Spire of Stars | May 2018 |
| Last Wish | Sep 2018 |
| Scourge of the Past | Dec 2018 |
| Crown of Sorrow | Jun 2019 |
| Garden of Salvation | Oct 2019 |
| Deep Stone Crypt | Nov 2020 |
| Vault of Glass | May 2021 |
| Vow of the Disciple | Mar 2022 |
| King's Fall | Aug 2022 |
| Root of Nightmares | Mar 2023 |
| Crota's End | Sep 2023 |
| Salvation's Edge | Jun 2024 |

---

## 8. Troubleshooting

### "No players found"

- Make sure you entered the **exact** Bungie name (case-sensitive)
- The code must be exactly 4 digits (e.g., `1234`, not `#1234`)
- The player must have played Destiny 2 at some point

### "BUNGIE_API_KEY environment variable not set"

- Go to Netlify → Site configuration → Environment variables
- Verify `BUNGIE_API_KEY` exists and is spelled exactly that way
- Trigger a new deploy after adding/editing the variable

### API calls return errors

- Check that your Bungie API key is valid at [bungie.net/en/Application](https://www.bungie.net/en/Application)
- Free API keys have rate limits (~250 requests/second). If you're getting `429 Too Many Requests`, wait a minute and try again
- The Bungie API occasionally has maintenance. Check [@BungieHelp](https://twitter.com/BungieHelp) for status

### "No raid completions found"

- The player may not have completed any raids
- Raids from deleted/vaulted content (Leviathan, Scourge, etc.) are still tracked if the player completed them when they were available
- Try a different character/platform if the player has cross-save enabled

### Site shows a blank page

- Open browser DevTools → Console
- If you see `Failed to load module` or similar, the build may have failed
- Go to Netlify → Deploys → click the latest deploy → check the build log for errors

### Build fails on Netlify

Common causes:
- The `client/package.json` file is missing or malformed
- Netlify can't find the build command — make sure `netlify.toml` is in the root of the repo
- Check the build log at Netlify → Deploys → (latest deploy) for specific errors

---

## 9. Custom Domain (Optional)

Want to use your own domain instead of `something.netlify.app`?

1. In Netlify, go to **Site configuration** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `raidviewer.mydomain.com`)
4. Follow Netlify's instructions to update your DNS records
5. Wait for DNS to propagate (can take up to 48 hours, usually ~30 minutes)
6. Netlify automatically provisions a free SSL certificate via Let's Encrypt

> If you use a custom domain, update the **Website** field in your Bungie app settings at [bungie.net/en/Application](https://www.bungie.net/en/Application).

---

## 10. Updating the App

When you want to update the code:

1. Make your changes to the files in the `raidviewer` folder
2. Commit and push to GitHub:

   ```bash
   git add .
   git commit -m "Describe your changes"
   git push
   ```

3. Netlify **automatically detects the push** and starts a new deploy
4. No need to touch Netlify — it's fully automatic

> This is called **Continuous Deployment**. Every push to `main` triggers a new build.

---

## 11. Architecture Deep Dive

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│  https://my-raid-viewer.netlify.app                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React SPA (Vite build)                │  │
│  │  • Search form → user enters Bungie name           │  │
│  │  • Calls /api?action=searchPlayer&...              │  │
│  │  • Renders timeline with raid cards                │  │
│  │  • Expand/collapse for fireteam details            │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Netlify Edge CDN                      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Redirect rule: /api/* → /.netlify/functions/...   │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │         Serverless Function (bungie-api.js)        │  │
│  │  • Reads BUNGIE_API_KEY from env vars              │  │
│  │  • Adds X-API-Key header                           │  │
│  │  • Forwards request to bungie.net/Platform         │  │
│  │  • Returns JSON response to browser                │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Bungie API Servers                      │
│              https://www.bungie.net/Platform             │
│                                                         │
│  Endpoints used:                                        │
│  • SearchDestinyPlayerByBungieName                      │
│  • Profile (characters)                                 │
│  • Stats/Activities (mode=4 for raids)                  │
│  • PostGameCarnageReport (fireteam details)             │
└─────────────────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Why |
|---|---|
| **Serverless function, not a server** | No server to maintain, scales to zero, free tier covers this use case |
| **API key in env vars, not in code** | Security — the key never reaches the browser |
| **Single function with `action` param** | Simpler than multiple functions, easier to maintain |
| **All characters queried** | Players often switch characters; we want the full picture |
| **First-clear computed client-side** | Simple Map-based dedup; no need for server state |
| **PGCR loaded on-demand** | Fireteam data is heavy; only fetch when user clicks expand |

### Rate limits

- Bungie API: ~250 requests/second per API key
- Netlify Functions: 125K requests/month free, 10 second execution timeout
- This app makes ~1–5 requests per search (depending on character count), well within limits

---

## 12. FAQ

### Does this use OAuth? Do I need to log in with Bungie?

**No.** This app uses the Bungie API's public endpoints with an API key. No user authentication is required. You just search for any player by their Bungie name.

### Can I see other players' raid history?

**Yes.** The Bungie API allows looking up any player's activity history as long as their profile is public. Most Destiny 2 profiles are public by default.

### Why are some old raids missing from my history?

The Bungie API only returns a limited number of activities per character (we fetch up to 250 per page, up to 20 pages). Very old activities may fall off if you have an extremely active account. Also, activities from Destiny 1 are not available through the Destiny 2 API.

### Does this work with cross-save?

**Yes.** When you search for a player, you'll see all their linked platforms. Select the one that has the most playtime for the most complete history.

### How much does this cost to run?

**$0.** Netlify's free tier includes:
- 100 GB bandwidth/month
- 300 build minutes/month
- 125K serverless function invocations/month

For a personal raid viewer, you'll never exceed these limits.

### Can I add more features?

Absolutely! The code is open source. Some ideas:
- Add dungeon completions (change `mode=4` to include other activity modes)
- Add charts/graphs for stats over time
- Add OAuth login for private profile data
- Add clan raid leaderboards
- Export raid history as JSON/CSV

To contribute changes, edit the files, push to GitHub, and Netlify redeploys automatically.

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT CHECKLIST                      │
├────────────────────────────────────────────────────────────┤
│ ☐ 1. Get Bungie API key at bungie.net/en/Application       │
│ ☐ 2. Create GitHub repo & push code                        │
│ ☐ 3. Import repo into Netlify                              │
│ ☐ 4. Add BUNGIE_API_KEY env var in Netlify                 │
│ ☐ 5. Trigger redeploy                                      │
│ ☐ 6. Test with a known player name                         │
│ ☐ 7. (Optional) Set custom domain                          │
│ ☐ 8. Share with your fireteam! 🎉                          │
└────────────────────────────────────────────────────────────┘
```

---

**RIP Destiny 2.** Your raid memories live on here. 🫡
