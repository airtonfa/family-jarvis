require('dotenv').config();
const { chromium } = require('playwright');
const { Client } = require('@notionhq/client');
const axios = require('axios');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const ESBSP_URL = 'https://extranet.esbsp.aesb.com.br/';
const GRADES_DB_ID = '627f0599-e7f8-40b1-bfb1-f8d6027b5579';
const EXAMS_DB_ID = 'bab4a1bc-70e3-46de-b6bb-95b29bf6aab4';

const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`)
};

async function loginToExtranet(page) {
  try {
    logger.info('Navigating to ESBSP extranet...');
    await page.goto(ESBSP_URL, { waitUntil: 'networkidle' });
    
    const loginField = await page.$('input[type="text"], input[name*="login"], input[name*="user"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (!loginField || !passwordField) {
      throw new Error('Could not find login form fields. Portal may have changed structure.');
    }
    
    logger.info('Found login form. Attempting authentication...');
    await loginField.fill(process.env.ESBSP_LOGIN);
    await passwordField.fill(process.env.ESBSP_PASSWORD);
    
    const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Entrar")');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {
        logger.warn('Navigation timeout - page may have loaded');
      });
    }
    
    const logoutBtn = await page.$('a:has-text("Sair"), a:has-text("Logout")');
    if (!logoutBtn) {
      throw new Error('Login may have failed');
    }
    
    logger.info('✓ Successfully logged in');
    return true;
  } catch (error) {
    logger.error(`Login failed: ${error.message}`);
    throw error;
  }
}

async function parseGrades(page) {
  try {
    logger.info('Parsing grades from dashboard...');
    
    const grades = await page.evaluate(() => {
      const results = [];
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            const subject = cells[0]?.textContent?.trim();
            const assessment = cells[1]?.textContent?.trim() || cells[2]?.textContent?.trim();
            const gradeText = cells[cells.length - 3]?.textContent?.trim() || cells[cells.length - 2]?.textContent?.trim() || cells[2]?.textContent?.trim();
            const gradeValue = parseFloat(gradeText);
            
            if (subject && gradeValue && !isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 10) {
              results.push({
                subject: subject,
                assessment: assessment || 'Assessment',
                grade: gradeValue,
                date: new Date().toISOString().split('T')[0],
                bimester: 'Bimester 1'
              });
            }
          }
        });
      }
      
      const gradeContainers = document.querySelectorAll('[data-grade], .grade, .nota, .resultado');
      gradeContainers.forEach(container => {
        const subjectEl = container.querySelector('[data-subject], .subject, .disciplina');
        const gradeEl = container.querySelector('[data-value], .value, .grade-value, .nota');
        
        if (subjectEl && gradeEl) {
          const subject = subjectEl.textContent?.trim();
          const gradeValue = parseFloat(gradeEl.textContent?.trim());
          
          if (subject && !isNaN(gradeValue) && gradeValue >= 0 && gradeValue <= 10) {
            const exists = results.some(g => g.subject === subject && g.grade === gradeValue);
            if (!exists) {
              results.push({
                subject: subject,
                assessment: 'Assessment',
                grade: gradeValue,
                date: new Date().toISOString().split('T')[0],
                bimester: 'Bimester 1'
              });
            }
          }
        }
      });
      
      return results;
    });
    
    logger.info(`Found ${grades.length} grades`);
    return grades.filter(g => g.subject && g.grade > 0);
  } catch (error) {
    logger.error(`Grade parsing failed: ${error.message}`);
    return [];
  }
}

async function parseExams(page) {
  try {
    logger.info('Parsing exams from dashboard...');
    
    const exams = await page.evaluate(() => {
      const results = [];
      const tables = document.querySelectorAll('table');
      
      for (const table of tables) {
        const rows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 2) {
            const subjectText = cells[0]?.textContent?.trim();
            const dateText = cells[1]?.textContent?.trim() || cells[2]?.textContent?.trim();
            const typeText = cells[2]?.textContent?.trim() || cells[3]?.textContent?.trim() || 'Prova';
            const roomText = cells[3]?.textContent?.trim() || cells[4]?.textContent?.trim() || '';
            
            const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/;
            
            if (subjectText && dateRegex.test(dateText)) {
              results.push({
                subject: subjectText,
                examType: typeText,
                date: dateText,
                room: roomText,
                bimester: 'Bimester 1'
              });
            }
          }
        });
      }
      
      return results;
    });
    
    logger.info(`Found ${exams.length} exams`);
    return exams.filter(e => e.subject && e.date);
  } catch (error) {
    logger.error(`Exam parsing failed: ${error.message}`);
    return [];
  }
}

async function upsertGradeToNotion(grade, isBackfill = false) {
  try {
    const gradeId = `${grade.subject}|${grade.assessment}|${grade.date}|${grade.bimester}`.replace(/\s+/g, '_');
    
    const existing = await notion.databases.query({
      database_id: GRADES_DB_ID,
      filter: {
        property: 'Subject',
        text: { equals: grade.subject }
      }
    });
    
    const existingGrade = existing.results.find(r => 
      r.properties.Subject?.title?.[0]?.plain_text === grade.subject &&
      r.properties.Assessment?.rich_text?.[0]?.plain_text === grade.assessment
    );
    
    if (existingGrade) {
      logger.info(`Grade already exists: ${grade.subject} - ${grade.assessment}`);
      return false;
    }
    
    await notion.pages.create({
      parent: { database_id: GRADES_DB_ID },
      properties: {
        Subject: { title: [{ text: { content: grade.subject } }] },
        Assessment: { rich_text: [{ text: { content: grade.assessment } }] },
        Grade: { number: grade.grade },
        'date:Date:start': grade.date,
        'date:Date:is_datetime': 0,
        Bimester: { select: { name: grade.bimester } },
        'School Year': { select: { name: '2026' } },
        Backfilled: { checkbox: isBackfill }
      }
    });
    
    logger.info(`✓ Inserted grade: ${grade.subject} = ${grade.grade}`);
    return true;
  } catch (error) {
    logger.error(`Failed to upsert grade: ${error.message}`);
    return false;
  }
}

async function upsertExamToNotion(exam) {
  try {
    const existing = await notion.databases.query({
      database_id: EXAMS_DB_ID,
      filter: {
        property: 'Subject',
        text: { equals: exam.subject }
      }
    });
    
    const existingExam = existing.results.find(r =>
      r.properties.Subject?.title?.[0]?.plain_text === exam.subject &&
      new Date(r.properties['date:Date:start']?.date?.start).toDateString() === new Date(exam.date).toDateString()
    );
    
    if (existingExam) {
      logger.info(`Exam already exists: ${exam.subject} on ${exam.date}`);
      return false;
    }
    
    await notion.pages.create({
      parent: { database_id: EXAMS_DB_ID },
      properties: {
        Subject: { title: [{ text: { content: exam.subject } }] },
        'Exam Type': { rich_text: [{ text: { content: exam.examType } }] },
        'date:Date:start': exam.date,
        'date:Date:is_datetime': 0,
        Room: { rich_text: [{ text: { content: exam.room } }] },
        Bimester: { select: { name: exam.bimester } }
      }
    });
    
    logger.info(`✓ Inserted exam: ${exam.subject} on ${exam.date}`);
    return true;
  } catch (error) {
    logger.error(`Failed to upsert exam: ${error.message}`);
    return false;
  }
}

async function main() {
  let browser;
  try {
    logger.info('=== ESBSP School Sync Started ===');
    
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await loginToExtranet(page);
    const grades = await parseGrades(page);
    const exams = await parseExams(page);
    
    logger.info(`Syncing ${grades.length} grades and ${exams.length} exams to Notion...`);
    
    let newGradesCount = 0;
    let newExamsCount = 0;
    
    for (const grade of grades) {
      const isNew = await upsertGradeToNotion(grade, process.env.BACKFILL_MODE === 'true');
      if (isNew) newGradesCount++;
    }
    
    for (const exam of exams) {
      const isNew = await upsertExamToNotion(exam);
      if (isNew) newExamsCount++;
    }
    
    logger.info(`=== Sync Complete: ${newGradesCount} new grades, ${newExamsCount} new exams ===`);
    
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
