// ====== NAHRADIT: vlož sem URL svého Apps Script (web app) ======
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxX8aAGEkt-uGzXnvWebktS7Qk_V-3EeLiN31e4ODwsTZmF1S2VpmEpE1sbzVP4OPso/exec";
// ==================================================================

const daysContainer = document.getElementById('daysContainer');
const menuFrame = document.getElementById('menuFrame');
const statusEl = document.getElementById('status');

let weekData = []; // pole objektů: {date, dayName, polevka, jidlo1, jidlo2}

/**
 * parseDateSafe: přijme datum v různých formátech (yyyy-mm-dd, d.m.yyyy, serial number)
 * vrátí ISO string yyyy-mm-dd
 */
function parseDateSafe(raw) {
  if (!raw && raw !== 0) return '';
  // pokud už je objekt Date
  if (raw instanceof Date) return raw.toISOString().slice(0,10);

  // pokud je číslo (serial z Sheets)
  if (!isNaN(raw) && String(raw).length <= 6) {
    // serial number: days since 1899-12-30
    const days = Number(raw);
    const d = new Date(Date.UTC(1899,11,30) + days * 24*60*60*1000);
    return d.toISOString().slice(0,10);
  }

  const s = String(raw).trim();

  // ISO-like: 2025-11-03
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
  }

  // Czech style d.m.yyyy or d.m.yy
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(s)) {
    const parts = s.split('.');
    const day = Number(parts[0]), month = Number(parts[1]) - 1, year = Number(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
  }

  // fallback: try Date parse
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0,10);
  return s; // vrátíme raw jako fallback
}


function doGet(e) {
  const SHEET_ID = '1IDhwRuo9Vkl_ltrWzPWiVva7k8F47wgvYZJxNF0q1Vc';
  const MENU_SHEET_NAME = 'Menu';
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MENU_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const timeZone = Session.getScriptTimeZone();
  const today = new Date();

  // Najdeme pondělí aktuálního týdne
  const dayOfWeek = today.getDay(); // 0 = neděle, 1 = pondělí ...
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // posun na pondělí

  // vytvoříme seznam dat pro pondělí–neděli
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(Utilities.formatDate(d, timeZone, 'd.M.yyyy'));
  }

  // vytvoříme výstupní pole
  const menus = [];

  // projdeme řádky tabulky
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const cell = row[0];
    if (!cell) continue;

    let cellDate;
    if (cell instanceof Date) {
      cellDate = Utilities.formatDate(cell, timeZone, 'd.M.yyyy');
    } else {
      // podpora textového formátu data
      const parts = cell.toString().split(/[.\-/]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        cellDate = Utilities.formatDate(d, timeZone, 'd.M.yyyy');
      } else continue;
    }

    if (weekDates.includes(cellDate)) {
      menus.push({
        date: cellDate,
        dayName: row[1],
        polevka: row[2],
        jidlo1: row[3],
        jidlo2: row[4],
      });
    }
  }

  if (menus.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Menu not found for this week' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify(menus))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const SHEET_ID = '1IDhwRuo9Vkl_ltrWzPWiVva7k8F47wgvYZJxNF0q1Vc';
  const MENU_SHEET_NAME = 'Menu';
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(MENU_SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const timeZone = Session.getScriptTimeZone();
  const today = new Date();

  // Najdeme pondělí aktuálního týdne
  const dayOfWeek = today.getDay(); // 0 = neděle, 1 = pondělí ...
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // posun na pondělí

  // vytvoříme seznam dat pro pondělí–neděli
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(Utilities.formatDate(d, timeZone, 'd.M.yyyy'));
  }

  // vytvoříme výstupní pole
  const menus = [];

  // projdeme řádky tabulky
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const cell = row[0];
    if (!cell) continue;

    let cellDate;
    if (cell instanceof Date) {
      cellDate = Utilities.formatDate(cell, timeZone, 'd.M.yyyy');
    } else {
      // podpora textového formátu data
      const parts = cell.toString().split(/[.\-/]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        cellDate = Utilities.formatDate(d, timeZone, 'd.M.yyyy');
      } else continue;
    }

    if (weekDates.includes(cellDate)) {
      menus.push({
        date: cellDate,
        dayName: row[1],
        polevka: row[2],
        jidlo1: row[3],
        jidlo2: row[4],
      });
    }
  }

  if (menus.length === 0) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Menu not found for this week' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify(menus))
    .setMimeType(ContentService.MimeType.JSON);
}

/** vytvoří kartu dne DOM element */
function createDayCard(dayObj, index) {
  const el = document.createElement('div');
  el.className = 'day-card';
  el.dataset.index = index;
  el.innerHTML = `<div style="font-weight:600">${dayObj.dayName || ''}</div>
                  <div class="muted">${dayObj.dateDisplay || dayObj.date}</div>`;
  el.addEventListener('click', () => {
    // odstraníme active
    document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    showMenu(dayObj);
  });
  return el;
}

/** zobrazí menu v menuFrame */
function showMenu(dayObj) {
  menuFrame.innerHTML = `
    <div style="font-weight:600;margin-bottom:8px">${dayObj.dayName || ''} — ${dayObj.dateDisplay || dayObj.date}</div>
    <div class="menu-row"><strong>Polévka:</strong> ${dayObj.polevka || '-'}</div>
    <div class="menu-row"><strong>Hlavní 1:</strong> ${dayObj.jidlo1 || '-'}</div>
    <div class="menu-row"><strong>Hlavní 2:</strong> ${dayObj.jidlo2 || '-'}</div>
  `;
}

/** vykreslí karty dnů z weekData */
function renderDays() {
  daysContainer.innerHTML = '';
  weekData.forEach((d,i) => {
    const card = createDayCard(d,i);
    daysContainer.appendChild(card);
  });
  // pokud je alespoň jeden den, aktivujeme první automaticky
  if (weekData.length) {
    const first = daysContainer.querySelector('.day-card');
    if (first) first.click();
  } else {
    menuFrame.textContent = 'Jídelníček nebyl nalezen.';
  }
}

/** načte data z Apps Script (očekává pole objektů nebo objekt s polem week) */
async function loadWeek() {
  statusEl.textContent = 'Načítám jídelníček…';
  try {
    const res = await fetch(APPS_SCRIPT_URL, {cache:'no-store'});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // očekávané formy: 1) pole objektů; 2) { week: [...] }
    let rows = Array.isArray(json) ? json : (json.week || json.data || []);
    if (!Array.isArray(rows)) throw new Error('Neočekávaný formát JSON');

    // mapujeme a normalizujeme datum (ISO) a display (d.m.yyyy)
    weekData = rows.map(r => {
      const iso = parseDateSafe(r.date || r.Date || r.datum || r[0]);
      // create display as d.m.yyyy
      const dt = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso) : null;
      const display = dt ? `${dt.getDate()}.${dt.getMonth()+1}.${dt.getFullYear()}` : (r.date || '');
      return {
        dateISO: iso,
        date: iso,
        dateDisplay: display,
        dayName: r.dayName || r.den || (r.day || ''),
        polevka: r.polevka || r.soup || '',
        jidlo1: r.jidlo1 || r.main1 || '',
        jidlo2: r.jidlo2 || r.main2 || '',
        raw: r
      };
    });

    renderDays();
    statusEl.textContent = '';
  } catch (err) {
    menuFrame.innerHTML = `<div class="error">Chyba při načítání: ${err.message}</div>`;
    statusEl.textContent = 'Načítání selhalo.';
    console.error(err);
  }
}

// start
loadWeek();
