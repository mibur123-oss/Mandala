/* ====== PLACEHOLDERS ====== */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/TVUJ_APPS_SCRIPT_URL/exec";

/* UI elementy */
const typSelect = document.getElementById('typSelect');
const whichMainLabel = document.getElementById('whichHalfLabel'); // využijeme pro hlavní jídlo
const whichMain = document.getElementById('whichHalf');
const portionCount = document.getElementById('portionCount'); // nový input pro počet porcí
const btnAddOrder = document.getElementById('btnAddOrder'); // tlačítko Přidat do objednávky
const orderList = document.getElementById('orderList'); // div seznamu objednávek
const btnSubmit = document.getElementById('btnSubmit');

let priceMap = {};
let orders = [];

/* ====== Načtení cen z Google Sheets ====== */
async function loadPrices() {
  try {
    const res = await fetch(APPS_SCRIPT_URL + '?type=prices');
    if (!res.ok) throw new Error('Chyba síťového požadavku');
    const data = await res.json();
    priceMap = data;
  } catch(err) {
    console.error("Chyba při načítání cen: ", err);
  }
}
loadPrices();

/* ====== UI logika pro typ menu ====== */
typSelect.addEventListener('change', () => {
  const t = typSelect.value;
  if (t === 'Poloviční menu' || t === 'Jídlo' || t === 'Půl + půl') {
    whichMainLabel.classList.remove('hidden');
  } else {
    whichMainLabel.classList.add('hidden');
  }
});

/* ====== Přidání do seznamu objednávek ====== */
btnAddOrder.addEventListener('click', () => {
  const typ = typSelect.value;
  if (!typ) return alert("Vyber typ menu!");
  
  let mainDish = null;
  if (typ === 'Poloviční menu' || typ === 'Jídlo' || typ === 'Půl + půl') {
    mainDish = whichMain.value;
    if (!mainDish) return alert("Vyber hlavní jídlo!");
  }

  const portions = parseInt(portionCount.value);
  if (isNaN(portions) || portions < 1) return alert("Zadej počet porcí!");

  let cena = 0;
  if (typ === 'Celé menu') cena = priceMap["Celé menu"] * portions;
  else if (typ === 'Poloviční menu') cena = priceMap["Poloviční"] * portions;
  else if (typ === 'Jídlo') cena = priceMap[mainDish] * portions;
  else if (typ === 'Půl + půl') cena = priceMap["Hlavní 1"] * portions + priceMap["Hlavní 2"] * portions;

  orders.push({ typ, mainDish, portions, cena });
  renderOrderList();
});

/* ====== Render seznamu objednávek ====== */
function renderOrderList() {
  orderList.innerHTML = '';
  let total = 0;
  orders.forEach((o, idx) => {
    total += o.cena;
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      ${o.typ}${o.mainDish ? ' — ' + o.mainDish : ''} x ${o.portions} = ${o.cena} Kč
      <button type="button" data-idx="${idx}" style="float:right">❌</button>
    `;
    orderList.appendChild(div);

    div.querySelector('button').addEventListener('click', (e) => {
      const i = parseInt(e.target.dataset.idx);
      orders.splice(i, 1);
      renderOrderList();
    });
  });

  const totalDiv = document.createElement('div');
  totalDiv.className = 'menu-item';
  totalDiv.style.fontWeight = 'bold';
  totalDiv.textContent = 'Celkem: ' + total + ' Kč';
  orderList.appendChild(totalDiv);
}

/* ====== Odeslání všech objednávek ====== */
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (orders.length === 0) return alert("Nemáš žádnou položku v objednávce!");
  
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    doruceni: document.querySelector('input[name="delivery"]:checked').value,
    adresa: addressInput.value.trim(),
    orders
  };

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Odesílám…';

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Server vrátil chybu');
    alert("✅ Objednávka byla odeslána!");
    orders = [];
    renderOrderList();
  } catch (err) {
    alert('Chyba při odesílání: ' + err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Odeslat objednávku';
  }
});

