/* ========== PLACEHOLDERS ========== */
const APPS_SCRIPT_MENU_URL = "https://script.google.com/macros/s/XXX/exec"; // GET menu
const APPS_SCRIPT_ORDER_URL = "https://script.google.com/macros/s/XXX/exec"; // POST objednávky

/* UI elementy */
const orderForm = document.getElementById('orderForm');
const typSelect = document.getElementById('typSelect');
const whichHalfLabel = document.getElementById('whichHalfLabel');
const whichHalf = document.getElementById('whichHalf');
const porceInput = document.createElement('input'); // dynamické pole pro počet porcí
const menuBox = document.getElementById('menuBox');
const menuPolevka = document.getElementById('menuPolevka');
const menuJidlo1 = document.getElementById('menuJidlo1');
const menuJidlo2 = document.getElementById('menuJidlo2');
const menuDate = document.getElementById('menuDate');
const status = document.getElementById('status');
const resultMsg = document.getElementById('resultMsg');
const btnSubmit = document.getElementById('btnSubmit');

let menuData = []; // načtený jídelníček
let priceMap = {}; // priceMap[typ][jidlo] = cena

/* ========== Načtení menu + cen z Apps Script ========== */
async function loadMenu() {
    status.textContent = 'Načítám jídelníček…';
    try {
        const res = await fetch(APPS_SCRIPT_MENU_URL);
        if(!res.ok) throw new Error('Chyba síťového požadavku');
        const data = await res.json();
        menuData = data;

        // naplnění ceny
        priceMap = {};
        data.forEach(item => {
            if(!priceMap[item.typ]) priceMap[item.typ] = {};
            priceMap[item.typ][item.jidlo || ''] = item.cena;
        });

        // zobraz jídelníček
        const dnes = new Date().toLocaleDateString();
        menuPolevka.textContent = menuData.find(i=>i.typ==='Polévka')?.cena ? `${menuData.find(i=>i.typ==='Polévka').jidlo || 'Polévka'}` : '-';
        menuJidlo1.textContent = menuData.find(i=>i.typ==='Hlavní jídlo' && i.jidlo==='Hlavní 1')?.jidlo || '-';
        menuJidlo2.textContent = menuData.find(i=>i.typ==='Hlavní jídlo' && i.jidlo==='Hlavní 2')?.jidlo || '-';
        menuDate.textContent = dnes;
        menuBox.classList.remove('hidden');
        status.textContent = '';
    } catch(err) {
        status.textContent = 'Chyba při načítání menu: ' + err.message;
    }
}

loadMenu();

/* ========== Typ menu - UI logika ========== */
typSelect.addEventListener('change', () => {
    const t = typSelect.value;
    if(t === 'Poloviční menu' || t === 'Hlavní jídlo') {
        whichHalfLabel.classList.remove('hidden');
    } else {
        whichHalfLabel.classList.add('hidden');
    }

    // Přidání pole pro počet porcí
    if(!porceInput.parentElement) {
        porceInput.type = 'number';
        porceInput.min = 1;
        porceInput.value = 1;
        porceInput.style.width = '60px';
        porceInput.style.marginTop = '8px';
        const label = document.createElement('label');
        label.textContent = 'Počet porcí: ';
        label.appendChild(porceInput);
        orderForm.insertBefore(label, btnSubmit.parentElement);
    }
});

/* ========== Odeslání objednávky ========== */
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    resultMsg.classList.add('hidden');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Odesílám…';

    const typ = typSelect.value;
    const jidlo = (typ === 'Poloviční menu' || typ === 'Hlavní jídlo') ? whichHalf.value : '';
    const porce = parseInt(porceInput.value) || 1;

    // kontrola validace
    if(!typ) {
        showResult(false,'Zvol typ menu.');
        btnSubmit.disabled = false; btnSubmit.textContent = 'Odeslat objednávku';
        return;
    }
    if((typ === 'Poloviční menu' || typ === 'Hlavní jídlo') && !jidlo) {
        showResult(false,'Vyber hlavní jídlo.');
        btnSubmit.disabled = false; btnSubmit.textContent = 'Odeslat objednávku';
        return;
    }

    const cena = (priceMap[typ][jidlo || ''] || 0) * porce;
    const payload = {
        name: document.getElementById('nameInput').value.trim(),
        email: document.getElementById('emailInput').value.trim(),
        typ,
        jidlo,
        porce,
        cena,
        doruceni: document.querySelector('input[name="delivery"]:checked').value,
        adresa: document.getElementById('addressInput').value.trim()
    };

    try {
        const res = await fetch(APPS_SCRIPT_ORDER_URL, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error('Server vrátil chybu');
        showResult(true,`✅ Objednávka byla odeslána: ${porce}x ${typ} ${jidlo ? '('+jidlo+')':''} = ${cena}Kč`);
    } catch(err) {
        showResult(false,'Chyba při odesílání: '+err.message);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Odeslat objednávku';
    }
});

function showResult(ok, text) {
    resultMsg.classList.remove('hidden');
    resultMsg.classList.remove('ok','err');
    resultMsg.classList.add(ok ? 'ok' : 'err');
    resultMsg.textContent = text;
}
