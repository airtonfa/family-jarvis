# Family Jarvis — GitHub Actions Setup Guide

## Phase 2 Complete: GitHub Repository Scaffolded ✓

Your repository structure is ready. Here's what we've created:

```
family-jarvis/
├── .github/workflows/
│   ├── school-sync.yml          # Daily 6pm ESBSP sync
│   └── calendar-sync.yml        # Hourly calendar mirror
├── src/
│   ├── school-scraper.js        # ESBSP login & parse
│   └── calendar-mirror.js       # Google Calendar sync
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Next Steps (in order)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `family-jarvis`
3. Description: "Family planning hub — school sync, calendar mirror, Notion integration"
4. Visibility: **Private** (only you can access)
5. Do NOT initialize with README (we have one)
6. Click **Create repository**

### Step 2: Push Code to GitHub

In your terminal:

```bash
cd /path/to/family-jarvis
git config user.email "airton@example.com"
git config user.name "Airton"

git add .
git commit -m "Initial family-jarvis setup"
git branch -M main
git remote add origin https://github.com/airtonfa/family-jarvis.git
git push -u origin main
```

(You'll need to use a GitHub personal access token or SSH key for authentication)

### Step 3: Configure GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets **one by one**:

**ESBSP Credentials:**
- `ESBSP_LOGIN` = `20103391851`
- `ESBSP_PASSWORD` = `E86j@Kj67mwg9gP`

**Notion:**
- `NOTION_API_KEY` = [Get from https://www.notion.com/my-integrations](https://www.notion.com/my-integrations)
  - Create integration → Generate token → Copy the token starting with `ntn_`
- `NOTION_DASHBOARD_ID` = `3454e723-2af8-810d-bcdb-fb6c474994db`

**Google Calendar (OAuth):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable: **Google Calendar API**
4. Create credentials:
   - Type: OAuth 2.0 (Desktop app)
   - Download as JSON
5. Copy the entire JSON file content
6. Create secret `GOOGLE_CREDENTIALS_JSON` = [paste entire JSON]

**WhatsApp / OpenClaw:**
- `OPENCLAW_WEBHOOK_URL` = [Your OpenClaw webhook URL]
- `WHATSAPP_GROUP_ID` = [Your family WhatsApp group ID]

**Optional:**
- `HEARTBEAT_WEBHOOK` = [Your personal webhook for sync status alerts]

### Step 4: Grant Notion Access

1. Go to your Notion workspace
2. Open the **Family Dashboard** page
3. Click **Share** (top right)
4. Click **Invite**
5. Search for the integration name you created earlier
6. Click to add it
7. Grant it **Can edit** access

### Step 5: Test the Workflows

Go to: **Actions** tab in your GitHub repo

For **School Sync**:
1. Click **School Sync (6pm daily)**
2. Click **Run workflow → Run workflow**
3. Wait 2-3 minutes, check logs
4. First run will fail because selectors don't match ESBSP's actual HTML

### Step 6: Fix the ESBSP Parser (Important!)

The school scraper uses placeholder selectors. You need to inspect the actual ESBSP portal to get the right ones.

**To debug the portal:**

1. Run the workflow manually and **let it fail**
2. The failure logs will show:
   - What HTML was parsed
   - Why grades/exams weren't found
3. You have two options:

**Option A: Inspect locally**
```bash
npm install
ESBSP_LOGIN=20103391851 ESBSP_PASSWORD=E86j@Kj67mwg9gP npm run school-sync
# The script will open a headless browser, you can add:
// In src/school-scraper.js, after login:
// await page.screenshot({ path: 'debug.png' });
// This will let you see the actual HTML structure
```

**Option B: Share with me**
- Take a screenshot of the ESBSP dashboard
- DM me the HTML structure (right-click → Inspect)
- I'll update the selectors for you

Once you find the right selectors, update them in `src/school-scraper.js` and push to GitHub. The workflow will auto-pick them up.

### Step 7: Set Up Schedules (Cron Timing)

The workflows run automatically on schedule:
- **School Sync**: Daily at **6pm BRST** (21:00 UTC)
- **Calendar Mirror**: Every **hour**

If you want different times, edit the `.yml` files:

```yaml
on:
  schedule:
    - cron: '0 21 * * *'  # Change the numbers here
```

Cron format: `minute hour day month day-of-week`

Examples:
- `0 18 * * *` = 6pm
- `0 7 * * *` = 7am
- `*/15 * * * *` = every 15 minutes

### Step 8: Share the Notion Dashboard

1. Open the **Family Dashboard** in Notion
2. Click **Share**
3. Click **Copy link** or invite Erica and Lucas with their email addresses
4. They can view/edit from any browser or the Notion app

## What Happens When It Runs

**School Sync (6pm daily):**
1. Logs into ESBSP with Lucas's credentials
2. Extracts all grades and exams
3. Writes new ones to Notion
4. Sends WhatsApp alert: `"📚 Nova nota — Lucas: Matemática = 8.5"`
5. Adds exam dates to Google Calendar

**Calendar Mirror (hourly):**
1. Pulls next 14 days of events from all family Google Calendars
2. Mirrors them into Notion's Calendar-Mirror database
3. Deduplicates (won't add the same event twice)

**Notion Dashboard:**
- Automatically stays up-to-date
- Views are linked (edits appear in real-time)
- Everyone can see/edit from their phone or computer

## Troubleshooting

**"Workflow failed - authentication error"**
- Check that GitHub secrets are set correctly (Settings → Secrets)
- Verify ESBSP login credentials are accurate
- For ESBSP 2FA: disable it in your account or whitelist GitHub's IP

**"No grades appearing in Notion"**
- The HTML selectors don't match the actual ESBSP portal
- Need to inspect and update `src/school-scraper.js`
- Share the ESBSP page HTML with me

**"Google Calendar events not syncing"**
- OAuth token needs to be refreshed
- Create new Google Cloud credentials and update the secret

**"WhatsApp alerts not sending"**
- OpenClaw service not running or webhook URL incorrect
- Verify `OPENCLAW_WEBHOOK_URL` in GitHub secrets

## Current Status

- ✓ Notion workspace with 7 databases created
- ✓ GitHub Actions scaffolded (school-sync, calendar-sync)
- ✓ Code ready to push
- ⏳ Waiting on: ESBSP parser debugging + Google OAuth setup

## Next Meeting

Once you confirm the ESBSP parser works (grades actually appear in Notion), we'll:
1. Fine-tune the parser if needed
2. Set up the family WhatsApp group alerts
3. Add Claude system prompt for the family assistant
4. Wire up OpenClaw for family WhatsApp input

---

**Questions?** Let's debug the ESBSP portal together. The trickiest part is matching the actual HTML selectors.
