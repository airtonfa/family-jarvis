require('dotenv').config();
const { google } = require('googleapis');
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const CALENDAR_MIRROR_DB_ID = 'e876ec85-d792-492f-bb1f-5d82dacabd6c';

const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`)
};

async function main() {
  try {
    logger.info('=== Calendar Mirror Sync Started ===');
    logger.info('Note: Google OAuth setup required before first use');
    logger.info('=== Calendar Sync Ready ===');
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
