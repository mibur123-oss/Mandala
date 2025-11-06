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
