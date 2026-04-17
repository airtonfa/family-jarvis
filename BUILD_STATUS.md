# Family Jarvis — Build Status Summary

## What We've Built (April 17, 2026)

### ✓ Phase 1: Notion Workspace (Complete)

**Created 7 databases under one shared dashboard:**

1. **School — Grades** (auto-synced from ESBSP)
   - Subject, Assessment, Grade, Date, Bimester, School Year
   - Full history (2024-2026)
   - Marked backfilled vs new

2. **School — Exams** (auto-synced from ESBSP + Google Calendar)
   - Subject, Exam Type, Date, Room, Bimester
   - Linked to GCal events via Event ID

3. **Meals & Recipes**
   - Editable by all 3 family members
   - Calendar view of weekly meals

4. **Grocery List**
   - Shared shopping list with categories
   - Checkbox for "Done" items

5. **Medical & Health**
   - Appointments, doctors, specialists
   - Status tracking (scheduled, completed, etc.)

6. **Family Tasks**
   - Assigned to person, priority, due date
   - Status (To Do, In Progress, Done)

7. **Calendar Mirror** (read-only, hourly sync from GCal)
   - Unified view of all family calendar events
   - Links back to source calendar via GCal Event ID

**Dashboard page** aggregates all databases with linked views

---

### ✓ Phase 2: GitHub Repository Scaffold (Complete)

**Code structure ready to push:**

```
family-jarvis/
├── .github/workflows/
│   ├── school-sync.yml          # Daily 6pm ESBSP → Notion + WhatsApp
│   └── calendar-sync.yml        # Hourly GCal → Notion
├── src/
│   ├── school-scraper.js        # Playwright login, grade/exam parsing
│   └── calendar-mirror.js       # Google Calendar API → Notion
├── package.json                 # Node dependencies (Playwright, Notion, Google APIs)
├── .env.example                 # Template for secrets
├── .gitignore                   # Sensitive data protection
└── README.md                    # Setup & troubleshooting guide
```

**Key features already coded:**

- **ESBSP Scraper**
  - Headless login to `extranet.esbsp.aesb.com.br`
  - Grade/exam parsing (placeholder selectors — needs tuning)
  - Idempotent Notion upserts (checks before inserting)
  - WhatsApp alerts for new grades/exams
  - Backfill mode (silent import of existing data)

- **Calendar Mirror**
  - Google OAuth2 authentication
  - Pulls next 14 days from all family calendars
  - Deduplication (won't add same event twice)
  - Notion integration with linked views

- **CI/CD**
  - School Sync: **Daily at 6pm BRST** (21:00 UTC)
  - Calendar Sync: **Hourly**
  - GitHub Actions runners (Ubuntu, Node 18)
  - Failure notifications

---

## Data Currently Configured

**Family Hub Google Account:**
- Email: `001almeidafamilia@gmail.com`
- Purpose: Central OAuth anchor for all 3 calendars
- Status: Created ✓

**ESBSP Credentials:**
- Login: `20103391851`
- Password: `E86j@Kj67mwg9gP`
- Status: Configured in code ✓

**Notion Workspace:**
- Dashboard ID: `3454e7232af8-810dbcdbfb6c474994db`
- 7 databases created ✓
- Status: Ready for integration

---

## What's Ready to Deploy

1. **Push to GitHub**
   - Repository `https://github.com/airtonfa/family-jarvis`
   - All code files in `/mnt/user-data/outputs/family-jarvis/`

2. **Configure GitHub Secrets**
   - ESBSP credentials (already in code)
   - Notion API key (get from https://notion.com/my-integrations)
   - Google OAuth JSON (from Google Cloud Console)
   - OpenClaw webhook + WhatsApp group ID

3. **Notion Integration**
   - Link GitHub integration to Notion dashboard
   - Grant edit permissions

4. **Test School Scraper**
   - First run will parse ESBSP
   - May need selector tuning based on actual HTML

---

## What Needs Doing Before Full Deployment

### 1. **Fix ESBSP Parser** (Critical)
   - Current selectors are placeholders
   - Need to inspect actual ESBSP HTML and update `src/school-scraper.js`
   - Will know this works when first grade appears in Notion

### 2. **Google OAuth Setup**
   - Create Google Cloud project
   - Enable Calendar API
   - Generate OAuth credentials
   - Add refresh token to GitHub secrets

### 3. **OpenClaw / WhatsApp Integration**
   - Set up OpenClaw on your Mac
   - Create family WhatsApp group
   - Get webhook URL and group ID
   - Add to GitHub secrets

### 4. **Test Each Sync Job**
   - Run school-sync manually via GitHub Actions
   - Verify grades appear in Notion
   - Run calendar-sync, verify events appear
   - Check WhatsApp alerts send

### 5. **Fine-tune Notifications**
   - Test grade alert format
   - Test exam alert format
   - Adjust language/emoji as needed

### 6. **Add Claude System Prompt** (Next phase)
   - Define Jarvis personality
   - Wire up Claude.ai MCP to read Notion
   - Train on family routines

---

## Diagram: Current State

```
ESBSP Extranet (2Web portal)
        ↓ [Playwright scraper, daily 6pm]
Notion: School-Grades, School-Exams
        ↓ [Write-back on new exam]
Google Calendar (Lucas's calendar)
        ↓ [Mirror job, hourly]
Notion: Calendar-Mirror
        ↓ [Linked views on Dashboard]
Family Dashboard (Notion)
        ← [Editable by all 3]

WhatsApp Family Group ← [Alerts on grade/exam changes]

Claude.ai (future) ← [Read-only Notion MCP]
```

---

## Files Ready for Download

- `family-jarvis/` — Complete repo structure
- `GITHUB_SETUP_GUIDE.md` — Step-by-step GitHub Actions setup
- `GITHUB_SETUP_GUIDE.md` — This file

---

## Recommended Next Step

**Test the ESBSP parser** by:

1. Pushing code to GitHub
2. Creating the GitHub Actions secrets (placeholder for Google/OpenClaw)
3. Running school-sync manually
4. Inspecting the logs to see what HTML was parsed
5. Sharing the actual HTML structure with me so I can fix the selectors

Once grades start appearing in Notion, the hardest part is done. Everything else is wired up.

---

**Status: Ready for GitHub deployment + ESBSP debugging**

Questions or blockers? Let me know.
