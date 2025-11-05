/* ======== UI elementy ======== */
const typSelect = document.getElementById('typSelect');
const mainDishDiv = document.getElementById('mainDishDiv');
const whichMain = document.getElementById('whichMain');
const portionCount = document.getElementById('portionCount');
const btnAddOrder = document.getElementById('btnAddOrder');
const orderList = document.getElementById('orderList');
const orderForm = document.getElementById('orderForm');
const addressLabel = document.getElementById('addressLabel');
const addressInput = document.getElementById('addressInput');
const status = document.getElementById('status');
const resultMsg = document.getElementById('resultMsg');
const btnSubmit = document.getElementById('btnSubmit');

/* Pole pro více objednávek */
let orders = [];

/* ======== UI logika ======== */
typSelect.addEventListener('change', () => {
  const t = typSelect.value;
  mainDishDiv.classList.toggle('hidden', !(t === 'cele' || t === 'polovicni' || t === 'jidlo'));
});

/* Adresa při doručení */
document.querySelectorAll('input[name="delivery"]').forEach(inp => {
  inp.addEventListener('change', () => {
    const v = document.querySelector('input[name="delivery"]:checked').value;
    addressLabel.classList.toggle('hidden', v !== 'Přivézt');
    addressInput.required = v === 'Přivézt';
  });
});

/* Přidání objednávky do seznamu */
btnAddOrder.addEventListener('click', () => {
  const typ = typSelect.value;
  if (!typ) {
    alert("Vyber typ menu!");
    return;
  }
  let mainDish = null;
  let portions = parseInt(portionCount.value);
  if (typ === 'cele' || typ === 'polovicni' || typ === 'jidlo') {
    mainDish = whichMain.value;
    if (portions < 1) {
      alert("Zadej počet porcí!");
      return;
    }
  }

  orders.push({ typ, mainDish, portions });
  renderOrderList();
});

/* Render seznamu objednávek */
function renderOrderList() {
  orderList.innerHTML = '';
  orders.forEach((o, idx) => {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.innerHTML = `
      ${o.typ}${o.mainDish ? ' — ' + o.mainDish : ''} x ${o.portions}
      <button type="button" data-idx="${idx}" style="float:right">❌</button>
    `;
    orderList.appendChild(div);

    div.querySelector('button').addEventListener('click', (e) => {
      const i = parseInt(e.target.dataset.idx);
      orders.splice(i, 1);
      renderOrderList();
    });
  });
}

/* ======== Odeslání všech objednávek ======== */
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (orders.length === 0) {
    alert("Přidej nejméně jednu objednávku!");
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Odesílám…';
  resultMsg.classList.add('hidden');

  const payload = {
    name: document.getElementById('nameInput').value.trim(),
    email: document.getElementById('emailInput').value.trim(),
    doruceni: document.querySelector('input[name="delivery"]:checked').value,
    adresa: addressInput.value.trim(),
    objednavky: orders
  };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Server vrátil chybu');
    resultMsg.textContent = '✅ Objednávky byly odeslány. Děkujeme!';
    resultMsg.className = 'msg ok';
    orders = [];
    renderOrderList();
    orderForm.reset();
    mainDishDiv.classList.add('hidden');
  } catch (err) {
    resultMsg.textContent = 'Chyba při odesílání: ' + err.message;
    resultMsg.className = 'msg err';
  } finally {
    resultMsg.classList.remove('hidden');
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Odeslat objednávku';
  }
});
