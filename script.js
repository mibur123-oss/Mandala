/* ========== PLACEHOLDERS ========== */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxX8aAGEkt-uGzXnvWebktS7Qk_V-3EeLiN31e4ODwsTZmF1S2VpmEpE1sbzVP4OPso/exec";

/* UI elementy */
const typSelect = document.getElementById('typSelect');
const mainDishDiv = document.getElementById('mainDishDiv');
const whichMain = document.getElementById('whichMain');
const portionCount = document.getElementById('portionCount');
const btnAddOrder = document.getElementById('btnAddOrder');
const orderList = document.getElementById('orderList');
const orderForm = document.getElementById('orderForm');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const addressLabel = document.getElementById('addressLabel');
const addressInput = document.getElementById('addressInput');
const status = document.getElementById('status');
const resultMsg = document.getElementById('resultMsg');
const btnSubmit = document.getElementById('btnSubmit');

/* Pole pro více objednávek */
let orders = [];

/* ========== UI logika ========== */
typSelect.addEventListener('change', () => {
  const t = typSelect.value;
  if (['cele','polovicni','jidlo'].includes(t)) {
    mainDishDiv.classList.remove('hidden');
  } else {
    mainDishDiv.classList.add('hidden');
  }
});

btnAddOrder.addEventListener('click', () => {
  const typ = typSelect.value;
  if (!typ) return alert('Vyber typ menu.');
  const main = whichMain.value;
  const count = parseInt(portionCount.value);
  if (count < 1) return alert('Zadej počet porcí.');

  orders.push({ typ, main, count });
  renderOrders();
});

function renderOrders() {
  orderList.innerHTML = '';
  orders.forEach((o,i) => {
    const div = document.createElement('div');
    div.textContent = `${o.count} × ${mapTyp(o.typ)} (${mapMain(o.main)})`;
    const btn = document.createElement('button');
    btn.textContent = 'Odstranit';
    btn.type = 'button';
    btn.addEventListener('click', () => {
      orders.splice(i,1);
      renderOrders();
    });
    div.appendChild(btn);
    orderList.appendChild(div);
  });
}

function mapTyp(t) {
  switch(t) {
    case 'cele': return 'Celé menu';
    case 'polovicni': return 'Poloviční menu';
    case 'jidlo': return 'Jídlo';
    default: return t;
  }
}

function mapMain(m) {
  switch(m) {
    case 'jidlo1': return 'Jídlo 1';
    case 'jidlo2': return 'Jídlo 2';
    default: return m;
  }
}

/* ========== Validace a odeslání ========== */
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!orders.length) return showResult(false,'Přidej alespoň jednu objednávku.');

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    doruceni: document.querySelector('input[name="delivery"]:checked').value,
    adresa: addressInput.value.trim(),
    objednavky: orders
  };

  if (!payload.name) return showResult(false,'Zadej jméno.');
  if (!payload.email) return showResult(false,'Zadej e-mail.');
  if (payload.doruceni==='Přivézt' && (!payload.adresa || payload.adresa.trim().length<3))
    return showResult(false,'Zadej platnou adresu pro doručení.');

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Odesílám…';

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('Server vrátil chybu');
    showResult(true,'✅ Objednávka byla odeslána. Děkujeme!');
    orders = [];
    renderOrders();
    orderForm.reset();
  } catch(err) {
    showResult(false,'Chyba při odesílání: '+err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Odeslat objednávku';
  }
});

function showResult(ok, text) {
  resultMsg.classList.remove('hidden','ok','err');
  resultMsg.classList.add(ok ? 'ok':'err');
  resultMsg.textContent = text;
}
