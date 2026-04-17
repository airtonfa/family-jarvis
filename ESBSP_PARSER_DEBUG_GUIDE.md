# ESBSP Parser Debugging & Tuning Guide

## Why This Matters

The ESBSP extranet is a custom 2Web portal with no public API. The parser uses **CSS selectors** to find grades and exams on the page. If 2Web redesigns the portal or changes the HTML structure, the selectors may stop working.

This guide walks you through **tuning the parser to match your actual ESBSP portal**.

---

## How the Parser Works

1. **Login** — Uses Lucas's credentials to log into `extranet.esbsp.aesb.com.br`
2. **Navigate** — Finds the grades/exams page
3. **Parse HTML** — Uses `document.evaluate()` selectors to extract data
4. **Extract fields** — Pulls subject, assessment, grade, date, exam type, room number
5. **Upsert to Notion** — Writes new grades/exams to the database

The parser currently uses **three strategies**:

### Strategy 1: Tables (Most Common)
Looks for standard `<table>` elements with rows/columns. Good for:
- Grade tables with columns: Subject | Assessment | Grade | Date
- Exam schedules with columns: Subject | Date | Type | Room

### Strategy 2: Data Attributes
Looks for HTML elements with `data-*` attributes like:
- `<div data-grade class="grade-container">`
- `<span data-subject>Matemática</span>`

### Strategy 3: CSS Classes
Looks for elements with class names like:
- `.grade`, `.nota`, `.resultado` (grade containers)
- `.exam`, `.prova`, `.avaliacao` (exam containers)

---

## First Run: See What Happens

1. Push code to GitHub
2. Add GitHub secrets (at least placeholder values)
3. Run the **School Sync** workflow manually
4. Check the **Actions** logs

The logs will show:
- "Found X grades, Y exams" → Success!
- "Found 0 grades" → Selectors need tuning

---

## If the Parser Finds 0 Grades/Exams

**The HTML structure doesn't match our selectors.** Here's how to fix it:

### Step 1: Manually Inspect ESBSP

1. Go to https://extranet.esbsp.aesb.com.br/
2. Log in with Lucas's credentials:
   - **Login:** `20103391851`
   - **Password:** `E86j@Kj67mwg9gP`
3. Look at the dashboard/grades page

### Step 2: Open Browser DevTools

1. Press **F12** or **Ctrl+Shift+I** (Windows/Linux) / **Cmd+Option+I** (Mac)
2. Go to the **Elements** (Chrome) or **Inspector** (Firefox) tab
3. Find the grades table or grade containers

### Step 3: Identify the HTML Structure

Look for one of these patterns:

**Pattern A — Table with grades:**
```html
<table>
  <thead>
    <tr><th>Disciplina</th><th>Avaliação</th><th>Nota</th><th>Data</th></tr>
  </thead>
  <tbody>
    <tr><td>Matemática</td><td>Prova 1</td><td>8.5</td><td>15/04/2026</td></tr>
  </tbody>
</table>
```

→ Selectors would be: `table tbody tr td:nth-child(1)` = Matemática, `td:nth-child(3)` = 8.5

**Pattern B — Div-based structure:**
```html
<div class="grade-item" data-grade>
  <div class="subject">Matemática</div>
  <div class="grade-value">8.5</div>
  <div class="date">15/04/2026</div>
</div>
```

→ Selectors: `.grade-item .subject`, `.grade-item .grade-value`

**Pattern C — Data attributes:**
```html
<tr data-grade-id="123">
  <td data-subject="Matemática">...</td>
  <td data-assessment="Prova 1">...</td>
  <td data-value="8.5">...</td>
</tr>
```

### Step 4: Document the Actual Structure

Right-click the grades table/container → **Inspect** → Copy the outer HTML.

Share with me (Airton):
- Screenshot of the grades section
- The HTML snippet from DevTools
- The class names and data attributes you see

Example:
```
I see a table with id="notas-table"
Headers: Disciplina | Avaliacao | Nota | Data
First row: Matemática | Prova Bimestral | 8.5 | 2026-04-15

HTML:
<table id="notas-table">
  <tr><th>Disciplina</th><th>Avaliacao</th><th>Nota</th><th>Data</th></tr>
  <tr><td>Matemática</td><td>Prova Bimestral</td><td>8.5</td><td>2026-04-15</td></tr>
  ...
</table>
```

### Step 5: Update the Parser

Once I see the actual HTML, I'll update the selectors in `src/school-scraper.js`.

For example, if the table has id="notas-table":
```javascript
const gradeRows = document.querySelectorAll('#notas-table tbody tr');
```

If classes are used:
```javascript
const subject = row.querySelector('.disciplina')?.textContent?.trim();
const grade = row.querySelector('.nota')?.textContent?.trim();
```

---

## Common Issues & Fixes

### Issue: Found 0 grades even though they're visible on the page

**Cause:** The portal loads grades dynamically (JavaScript) after page load.

**Fix:** Add a wait in `loginToExtranet()`:
```javascript
await page.waitForSelector('table tbody tr, [data-grade]', { timeout: 10000 });
```

### Issue: Found 5 grades but should be 8

**Cause:** The parser is finding grades from multiple tables or duplicate entries.

**Fix:** Add deduplication logic:
```javascript
const uniqueGrades = results.filter((g, idx, self) =>
  idx === self.findIndex(x => x.subject === g.subject && x.grade === g.grade)
);
```

### Issue: Exam dates are parsed as "2026-04-1" instead of "2026-04-15"

**Cause:** Date parsing logic is splitting incorrectly.

**Fix:** Use a proper date parser:
```javascript
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
```

---

## Debugging Checklist

Before asking for help, verify:

- [ ] I can log into ESBSP manually (credentials are correct)
- [ ] Grades/exams are actually visible on the ESBSP dashboard
- [ ] I inspected the HTML and identified table/class names
- [ ] I shared a screenshot + HTML snippet

---

## Contact for Help

Once you've:
1. Pushed code to GitHub
2. Run the first sync (saw "Found 0 grades" in logs)
3. Inspected the ESBSP HTML

→ Share the HTML structure with me and I'll update the parser.

---

## Expected Timeline

- **First run:** 5-10 min to inspect HTML
- **Parser update:** 5 min to adjust selectors
- **Second run:** Grades appear in Notion ✓

Then you're done with this part!

---

## Next After Parser Works

Once grades start appearing in Notion:
1. Fine-tune date/bimester logic if needed
2. Set up Google OAuth + calendar mirror
3. Configure OpenClaw for WhatsApp alerts
4. Test the full workflow end-to-end
