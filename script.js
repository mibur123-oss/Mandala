/* ========== PLACEHOLDERS ========== */
const firebaseConfig = {
    apiKey: "AIzaSyDR9pvalNCGqW2JbWTLQtX_F5kHmnV41o8",
    authDomain: "mandala-b29bc.firebaseapp.com",
    projectId: "mandala-b29bc",
    storageBucket: "mandala-b29bc.firebasestorage.app",
    messagingSenderId: "470548601967",
    appId: "1:470548601967:web:52cd1477ab21ad2da6019a",
    measurementId: "G-EX4WRJNF2C"
};
const APPS_SCRIPT_MENU = "https://script.google.com/macros/s/.../exec"; // menu
const APPS_SCRIPT_PRICES = "https://script.google.com/macros/s/.../exec"; // ceny
const APPS_SCRIPT_ORDER = "https://script.google.com/macros/s/.../exec"; // POST objednávky

/* ========== Inicializace Firebase ========== */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/* ========== UI elementy ========== */
const userDisplay = document.getElementById('userDisplay');
const btnGoogle = document.getElementById('btnGoogle');
const btnFacebook = document.getElementById('btnFacebook');
const btnEmail = document.getElementById('btnEmail');
const btnSignOut = document.getElementById('btnSignOut');
const orderForm = document.getElementById('orderForm');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const typSelect = document.getElementById('typSelect');
const whichHalfLabel = document.getElementById('whichHalfLabel');
const whichHalf = document.getElementById('whichHalf');
const amountWhole = document.getElementById('amountWhole'); // nový input pro počet celých menu
const amountHalf = document.getElementById('amountHalf'); // nový input pro poloviční menu
const amountMain = document.getElementById('amountMain'); // nový input pro jen hlavní jídlo
const addressLabel = document.getElementById('addressLabel');
const addressInput = document.getElementById('addressInput');
const status = document.getElementById('status');
const resultMsg = document.getElementById('resultMsg');
const menuStatus = document.getElementById('menuStatus');
const menuBox = document.getElementById('menuBox');
const menuPolevka = document.getElementById('menuPolevka');
const menuJidlo1 = document.getElementById('menuJidlo1');
const menuJidlo2 = document.getElementById('menuJidlo2');
const menuDate = document.getElementById('menuDate');
const btnSubmit = document.getElementById('btnSubmit');

/* ========== Auth providers ========== */
const googleProvider = new firebase.auth.GoogleAuthProvider();
const fbProvider = new firebase.auth.FacebookAuthProvider();

/* ========== Přihlášení ========== */
btnGoogle.addEventListener('click', () => {
  status.innerHTML = '<span class="loader"></span> Přihlašuji...';
  auth.signInWithPopup(googleProvider).catch(err => status.textContent = 'Chyba: ' + err.message)
    .finally(()=> status.textContent = '');
});
btnFacebook.addEventListener('click', () => {
  status.innerHTML = '<span class="loader"></span> Přihlašuji...';
  auth.signInWithPopup(fbProvider).catch(err => status.textContent = 'Chyba: ' + err.message)
    .finally(()=> status.textContent = '');
});
btnEmail.addEventListener('click', async () => {
  const email = prompt("Zadej e-mail:");
  if (!email) return;
  const password = prompt("Zadej heslo:");
  if (!password) return;
  status.innerHTML = '<span class="loader"></span> Přihlašuji...';
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      if (err.code==='auth/user-not-found') return auth.createUserWithEmailAndPassword(email,password);
      throw err;
    })
    .catch(err=>status.textContent='Chyba: '+err.message)
    .finally(()=> status.textContent = '');
});
btnSignOut.addEventListener('click', ()=>auth.signOut());

auth.onAuthStateChanged(user=>{
  if(user){
    userDisplay.textContent = user.displayName?`${user.displayName} (${user.email})`:user.email;
    btnSignOut.classList.remove('hidden');
    btnGoogle.classList.add('hidden');
    btnFacebook.classList.add('hidden');
    btnEmail.classList.add('hidden');
    if(user.displayName) nameInput.value=user.displayName;
    emailInput.value = user.email||'';
  } else {
    userDisplay.textContent = 'Nejsi přihlášen';
    btnSignOut.classList.add('hidden');
    btnGoogle.classList.remove('hidden');
    btnFacebook.classList.remove('hidden');
    btnEmail.classList.remove('hidden');
  }
});

/* ========== Načtení menu ========== */
let menuData = {};
async function loadMenu(){
  menuStatus.textContent='Načítám…';
  try{
    const res = await fetch(APPS_SCRIPT_MENU);
    if(!res.ok) throw new Error('Chyba síťového požadavku');
    const data = await res.json();
    menuData = data;
    menuPolevka.textContent = data.polevka||'-';
    menuJidlo1.textContent = data.jidlo1||'-';
    menuJidlo2.textContent = data.jidlo2||'-';
    menuDate.textContent = data.date || (new Date()).toLocaleDateString();
    menuBox.classList.remove('hidden');
    menuStatus.textContent='Jídelníček načten.';
  }catch(err){
    menuStatus.textContent='Chyba při načítání menu: '+err.message;
  }
}
loadMenu();

/* ========== Načtení cen ========== */
let prices = { soup:40, main:135, half:115, full:155 }; // default
async function loadPrices(){
  try{
    const res = await fetch(APPS_SCRIPT_PRICES);
    if(!res.ok) throw new Error('Chyba síťového požadavku');
    const data = await res.json();
    prices = data;
  }catch(err){
    console.warn('Nepodařilo se načíst ceny, použity defaultní');
  }
}
loadPrices();

/* ========== UI logika pro typ menu ========== */
typSelect.addEventListener('change', ()=>{
  const t = typSelect.value;
  // zobrazení hlavního jídla pro vybrané typy
  if(t==='Celé menu'||t==='Poloviční menu'||t==='Jídlo'){
    whichHalfLabel.classList.remove('hidden');
  } else {
    whichHalfLabel.classList.add('hidden');
  }
});

/* ========== Doručení ========== */
document.querySelectorAll('input[name="delivery"]').forEach(inp=>{
  inp.addEventListener('change', ()=>{
    const v = document.querySelector('input[name="delivery"]:checked').value;
    if(v==='Přivézt'){ addressLabel.classList.remove('hidden'); addressInput.required=true; }
    else{ addressLabel.classList.add('hidden'); addressInput.required=false; }
  });
});

/* ========== Odeslání objednávky ========== */
orderForm.addEventListener('submit', async e=>{
  e.preventDefault();
  resultMsg.classList.add('hidden');
  btnSubmit.disabled=true;
  btnSubmit.textContent='Odesílám…';

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    typ: typSelect.value,
    whichHalf: whichHalf.value,
    doruceni: document.querySelector('input[name="delivery"]:checked').value,
    adresa: addressInput.value.trim(),
    countWhole: parseInt(document.getElementById('amountWhole').value) || 0,
    countHalf: parseInt(document.getElementById('amountHalf').value) || 0,
    countMain: parseInt(document.getElementById('amountMain').value) || 0,
    priceWhole: prices.full,
    priceHalf: prices.half,
    priceMain: prices.main,
    priceSoup: prices.soup
  };

  try{
    const res = await fetch(APPS_SCRIPT_ORDER,{
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('Server vrátil chybu');
    showResult(true,'✅ Objednávka byla odeslána. Děkujeme!');
  }catch(err){
    showResult(false,'Chyba při odesílání: '+err.message);
  }finally{
    btnSubmit.disabled=false;
    btnSubmit.textContent='Odeslat objednávku';
  }
});

function showResult(ok,text){
  resultMsg.classList.remove('hidden');
  resultMsg.classList.remove('ok','err');
  resultMsg.classList.add(ok?'ok':'err');
  resultMsg.textContent=text;
}
