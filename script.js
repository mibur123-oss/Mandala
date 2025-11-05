/* ========== PLACEHOLDERS ========== */
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT.firebaseapp.com",
  projectId: "PROJECT",
  storageBucket: "PROJECT.appspot.com",
  messagingSenderId: "ID",
  appId: "APPID",
  measurementId: "MEASURE"
};

const APPS_SCRIPT_URL = "GOOGLE_SCRIPT_WEB_APP_URL";

/* Firebase init */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const fbProvider = new firebase.auth.FacebookAuthProvider();

/* UI elements */
const userDisplay = document.getElementById('userDisplay');
const btnGoogle = document.getElementById('btnGoogle');
const btnFacebook = document.getElementById('btnFacebook');
const btnEmail = document.getElementById('btnEmail');
const btnSignOut = document.getElementById('btnSignOut');

const nameInput = document.getElementById('nameInput');
const contactInput = document.getElementById('contactInput');
const deliverySelect = document.getElementById('deliverySelect');
const daysTabs = document.getElementById('daysTabs');
const menuContainer = document.getElementById('menuContainer');
const orderItems = document.getElementById('orderItems');
const totalBox = document.getElementById('totalBox');
const btnAddItem = document.getElementById('btnAddItem');
const btnSubmitOrder = document.getElementById('btnSubmitOrder');
const orderStatus = document.getElementById('orderStatus');

/* ========== Auth ========== */
btnGoogle.onclick = () => auth.signInWithPopup(googleProvider);
btnFacebook.onclick = () => auth.signInWithPopup(fbProvider);
btnEmail.onclick = async () => {
  const email = prompt("Zadej e-mail:");
  if (!email) return;
  const password = prompt("Zadej heslo:");
  if (!password) return;
  try { await auth.signInWithEmailAndPassword(email,password); }
  catch(err){ if(err.code==='auth/user-not-found'){ await auth.createUserWithEmailAndPassword(email,password); } }
};
btnSignOut.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
  if(user){
    userDisplay.textContent = user.displayName || user.email;
    btnSignOut.classList.remove('hidden');
    btnGoogle.classList.add('hidden');
    btnFacebook.classList.add('hidden');
    btnEmail.classList.add('hidden');
    if(user.displayName) nameInput.value = user.displayName;
  } else {
    userDisplay.textContent = 'Nepřihlášen';
    btnSignOut.classList.add('hidden');
    btnGoogle.classList.remove('hidden');
    btnFacebook.classList.remove('hidden');
    btnEmail.classList.remove('hidden');
  }
});

/* ========== Načtení celého týdne z Google Sheets ========== */
let weekMenu = [];

/* Načtení jídelníčku týdne */
async function loadWeekMenu() {
  const weekDaysDiv = document.getElementById('weekDays');
  try {
    const res = await fetch(APPS_SCRIPT_WEEK_URL);
    if (!res.ok) throw new Error('Chyba síťového požadavku');
    const weekData = await res.json(); // očekáváme pole objektů {date, polevka, jidlo1, jidlo2}

    weekData.forEach(day => {
      const btn = document.createElement('button');
      btn.textContent = `${day.date} (${day.dayName})`;
      btn.addEventListener('click', () => selectDay(day));
      weekDaysDiv.appendChild(btn);
    });
  } catch (err) {
    weekDaysDiv.textContent = 'Chyba při načítání menu: ' + err.message;
  }
}

/* Aktivace dne a zobrazení menu */
function selectDay(day) {
  document.getElementById('selectedMenu').style.display = 'block';
  document.getElementById('menuPolevka').textContent = day.polevka || '-';
  document.getElementById('menuJidlo1').textContent = day.jidlo1 || '-';
  document.getElementById('menuJidlo2').textContent = day.jidlo2 || '-';
  document.getElementById('menuDate').textContent = day.date;
  // TODO: uložit vybraný den pro objednávku
}

/* ========== Render karet dnů ========== */
function renderDaysTabs(){
  daysTabs.innerHTML = '';
  weekMenu.forEach((d,i)=>{
    const tab = document.createElement('div');
    tab.textContent = `${d.day} (${d.date})`;
    tab.className = 'day-tab'+(i===0?' active':'');
    tab.onclick = ()=>renderMenuForDay(i);
    daysTabs.appendChild(tab);
  });
}

/* ========== Render menu pro konkrétní den ========== */
let currentDayIndex = 0;

function renderMenuForDay(index){
  currentDayIndex = index;
  [...daysTabs.children].forEach((t,i)=>t.classList.toggle('active',i===index));
  const d = weekMenu[index];
  menuContainer.innerHTML = `
    <div class="menu-card">
      <h3>Menu ${d.day} (${d.date})</h3>
      <div class="menu-item"><strong>Polévka:</strong> ${d.polevka}</div>
      <div class="menu-item"><strong>Hlavní 1:</strong> ${d.jidlo1}</div>
      <div class="menu-item"><strong>Hlavní 2:</strong> ${d.jidlo2}</div>
    </div>
  `;
}

/* ========== Objednávky ========== */
let orders = [];

const menuTypes = [
  {id:'cele', name:'Celé menu'},
  {id:'polovicni', name:'Poloviční menu'},
  {id:'pulpulu', name:'Půl+Půl menu'},
  {id:'hlavni', name:'Hlavní jídlo'},
  {id:'polovicniHlavni', name:'Poloviční hlavní jídlo'},
  {id:'polevka', name:'Polévka'}
];

/* ceny z Google Sheets */
function getPrice(type){
  const d = weekMenu[currentDayIndex];
  if(!d || !d.ceny) return 0;
  return d.ceny[type]||0;
}

/* Přidání položky */
btnAddItem.onclick = ()=>{
  const type = prompt(`Typ menu:\n${menuTypes.map(m=>m.name).join('\n')}`);
  if(!type) return;
  const qty = parseInt(prompt('Počet porcí:'),10);
  if(isNaN(qty)||qty<1) return alert('Zadej platný počet');

  const price = getPrice(type) * qty;

  const item = {type, qty, price};
  orders.push(item);
  renderOrders();
};

/* Render objednávek */
function renderOrders(){
  orderItems.innerHTML = '';
  orders.forEach((o,i)=>{
    const div = document.createElement('div');
    div.className='order-item';
    div.innerHTML = `
      <div>
        <div>${o.type}</div>
        <div>Počet: <input type="number" value="${o.qty}" min="1" style="width:60px"></div>
      </div>
      <div>
        <div>${o.price} Kč</div>
        <button class="delete">Smazat</button>
      </div>
    `;
    div.querySelector('input').onchange = e=>{
      o.qty = parseInt(e.target.value,10);
      o.price = getPrice(o.type)*o.qty;
      renderOrders();
    };
    div.querySelector('.delete').onclick = ()=>{
      orders.splice(i,1);
      renderOrders();
    };
    orderItems.appendChild(div);
  });
  const total = orders.reduce((sum,o)=>sum+o.price,0);
  totalBox.textContent = `Celkem: ${total} Kč`;
}

/* Odeslání objednávky */
btnSubmitOrder.onclick = async ()=>{
  if(!nameInput.value.trim() || !contactInput.value.trim() || orders.length===0){
    return alert('Vyplň jméno, kontakt a položky');
  }

  const payload = {
    name: nameInput.value.trim(),
    contact: contactInput.value.trim(),
    delivery: deliverySelect.value,
    day: weekMenu[currentDayIndex].date,
    orders
  };

  orderStatus.textContent = 'Odesílám…';
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('Chyba serveru');
    orderStatus.textContent = '✅ Objednávka odeslána';
    orders = [];
    renderOrders();
  } catch(err){
    orderStatus.textContent = 'Chyba při odesílání: '+err.message;
  }
};

loadWeekMenu();
