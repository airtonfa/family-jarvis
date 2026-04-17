# Family Jarvis — Sync Jobs

Automated synchronization of family schedules, school grades, exams, and meal planning via ESBSP extranet, Google Calendar, and Notion.

## Architecture

- **School Scraper** (6pm daily): Logs into ESBSP, extracts grades & exams, writes to Notion, alerts family via WhatsApp
- **Calendar Mirror** (hourly): Pulls all family Google Calendar events, mirrors them into Notion
- **Notion**: Single source of truth for family data
- **WhatsApp (OpenClaw)**: Notifications for grade/exam updates

## Setup

See GITHUB_SETUP_GUIDE.md for detailed instructions.

## Running Locally

```bash
npm install
npm run school-sync
npm run calendar-sync
```
