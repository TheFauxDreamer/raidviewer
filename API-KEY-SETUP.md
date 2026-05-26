# Getting a Bungie API Key & Adding It to Netlify

This app needs a Bungie API key to talk to Bungie's servers. The key is stored as an environment variable in Netlify so it never reaches the browser.

---

## Step 1: Get a Bungie API Key

1. Go to **[bungie.net/en/Application](https://www.bungie.net/en/Application)**
2. Sign in with your platform account (Steam, Xbox, PlayStation, etc.)
3. Click **"Create New App"**
4. Fill in the form:

   | Field | Value |
   |---|---|
   | **Application Name** | `Raid Viewer` (or anything you like) |
   | **Website** | Your Netlify URL, e.g. `https://my-raid-viewer.netlify.app` |
   | **OAuth Client Type** | `Public` |
   | **Redirect URL** | Leave blank |
   | **Scope** | Check: *Read your Destiny 2 information (Vault, Inventory, and Vendors), and your Character and Progression* |
   | **Origin Header** | `*` |

5. Click **"Save"**
6. You'll see your new app listed. Copy the **API Key** — it's a long string of letters and numbers.

> **Note:** You only need the **API Key**. Ignore the OAuth client ID and client secret fields — this app doesn't use OAuth.

---

## Step 2: Add the Key to Netlify

1. Go to **[app.netlify.com](https://app.netlify.com)** and select your site
2. In the left sidebar, click **Site configuration**
3. Click **Environment variables**
4. Click **"Add a variable"** → **"Add a single variable"**
5. Fill in:

   | Field | Value |
   |---|---|
   | **Key (name)** | `BUNGIE_API_KEY` |
   | **Value** | Paste your Bungie API key here |

6. Click **"Save"**

---

## Step 3: Redeploy

Environment variables only take effect on the next deploy.

1. In the left sidebar, click **Deploys**
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait ~1 minute for the build to finish

---

## Verify It Works

1. Open your Netlify URL
2. Search for a known player (e.g., a friend's Bungie name)
3. If results appear, the key is working

If you see `BUNGIE_API_KEY environment variable not set`, the variable name is misspelled or the redeploy didn't happen. Double-check the spelling is exactly `BUNGIE_API_KEY` and trigger another deploy.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "BUNGIE_API_KEY environment variable not set" | Check spelling — must be exactly `BUNGIE_API_KEY`. Trigger a new deploy. |
| API returns errors | Your key may be invalid. Go to [bungie.net/en/Application](https://www.bungie.net/en/Application) and verify it's active. |
| Rate limited (429 errors) | Free API keys have generous limits. Wait a minute and try again. |
| Key stopped working | Bungie may have rotated it. Generate a new one in the developer portal. |

---

## Quick Reference

```
Bungie Developer Portal:  https://www.bungie.net/en/Application
Netlify Env Var Name:     BUNGIE_API_KEY
Netlify Env Var Value:    <your-api-key-from-bungie>
```
