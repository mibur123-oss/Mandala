/* ========== PLACEHOLDERS - nahraď svými hodnotami ========== */
const firebaseConfig = {
    apiKey: "AIzaSyDR9pvalNCGqW2JbWTLQtX_F5kHmnV41o8",
    authDomain: "mandala-b29bc.firebaseapp.com",
    projectId: "mandala-b29bc",
    storageBucket: "mandala-b29bc.firebasestorage.app",
    messagingSenderId: "470548601967",
    appId: "1:470548601967:web:52cd1477ab21ad2da6019a",
    measurementId: "G-EX4WRJNF2C"
};

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxX8aAGEkt-uGzXnvWebktS7Qk_V-3EeLiN31e4ODwsTZmF1S2VpmEpE1sbzVP4OPso/exec";

/* Inicializace Firebase (compat) */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/* UI elementy */
const userDisplay = document.getElementById('userDisplay');
const btnGoogle = document.getElementById('btnGoogle');
const btnFacebook = document.getElementById('btnFacebook');
const btnEmail = document.getElementById('btnEmail');
const btnSignOut = document.getElementById('btnSignOut');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const chkPolevka = document.getElementById('chkPolevka');
const chkJidlo1 = document.getElementById('chkJidlo1');
const chkJidlo2 = document.getElementById('chkJidlo2');
const typSelect = document.getElementById('typSelect');
const whichHalf = document.getElementById('whichHalf');
const whichHalfLabel = document.getElementById('whichHalfLabel');
const addressLabel = document.getElementById('addressLabel');
const addressInput = document.getElementById('addressInput');
const orderForm = document.getElementById('orderForm');
const status = document.getElementById('status');
const resultMsg = document.getElementById('resultMsg');
const menuStatus = document.getElementById('menuStatus');
const menuBox = document.getElementById('menuBox');
const menuPolevka = document.getElementById('menuPolevka');
const menuJidlo1 = document.getElementById('menuJidlo1');
const menuJidlo2 = document.getElementById('menuJidlo2');
const menuDate = document.getElementById('menuDate');
const btnSubmit = document.getElementById('btnSubmit');
const authButtons = document.getElementById('authButtons');

/* Auth providers */
const googleProvider = new firebase.auth.GoogleAuthProvider();
const fbProvider = new firebase.auth.FacebookAuthProvider();

/* ========== Auth handlers ========== */
btnGoogle.addEventListener('click', () => {
  status.innerHTML = '<span class="loader"></span> Přihlašuji...';
  auth.signInWithPopup(googleProvider).catch(err => {
    status.textContent = 'Chyba: ' + err.message;
  }).finally(()=> status.textContent = '');
});

btnFacebook.addEventListener('click', () => {
  status.innerHTML = '<span class="loader"></span> Přihlašuji...';
  auth.signInWithPopup(fbProvider).catch(err => {
    status.textContent = 'Chyba: ' + err.message;
  }).finally(()=> status.textContent = '');
});

btnEmail.addEventListener('click', () => {
  const email = prompt("Zadej e-mail:");
  if (!email) return;
  const password = prompt("Zadej heslo (pro nového uživatele bude vytvořen):");
  if (!password) return;
  status.innerHTML = '<span class="loader"></span> Přihlašuji...';
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      if (err.code === 'auth/user-not-found') {
        return auth.createUserWithEmailAndPassword(email, password);
      }
      throw err;
    })
    .catch(err => {
      status.textContent = 'Chyba: ' + err.message;
    })
    .finally(()=> status.textContent = '');
});

btnSignOut.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  if (user) {
    userDisplay.textContent = user.displayName ? `${user.displayName} (${user.email})` : user.email;
    btnSignOut.classList.remove('hidden');
    btnGoogle.classList.add('hidden');
    btnFacebook.classList.add('hidden');
    btnEmail.classList.add('hidden');
    if (user.displayName) nameInput.value = user.displayName;
    emailInput.value = user.email || '';
  } else {
    userDisplay.textContent = 'Nejsi přihlášen';
    btnSignOut.classList.add('hidden');
    btnGoogle.classList.remove('hidden');
    btnFacebook.classList.remove('hidden');
    btnEmail.classList.remove('hidden');
  }
});

/* ========== Načtení menu z Apps Script (GET) ========== */
async function loadMenu() {
  menuStatus.textContent = 'Načítám jídelníček…';
  try {
    const res = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error('Chyba síťového požadavku');
    const data = await res.json();
    if (data.error) {
      menuStatus.textContent = 'Menu nenalezeno pro dnešek.';
      return;
    }
    menuPolevka.textContent = data.polevka || '-';
    menuJidlo1.textContent = data.jidlo1 || '-';
    menuJidlo2.textContent = data.jidlo2 || '-';
    menuDate.textContent = data.date || (new Date()).toLocaleDateString();
    menuBox.classList.remove('hidden');
    menuStatus.textContent = 'Jídelníček načten.';
  } catch (err) {
    menuStatus.textContent = 'Chyba při načítání menu: ' + err.message;
  }
}
loadMenu();

/* ========== UI logika pro typy a doručení ========== */
typSelect.addEventListener('change', () => {
  const t = typSelect.value;
  whichHalfLabel.classList.toggle('hidden', t !== 'Poloviční menu');
  if (t === 'Polévka') {
    chkPolevka.checked = true; chkJidlo1.checked = false; chkJidlo2.checked = false;
  } else if (t === 'Jídlo') {
    chkPolevka.checked = false;
  } else if (t === 'Půl + půl') {
    chkPolevka.checked = false; chkJidlo1.checked = true; chkJidlo2.checked = true;
  }
});

document.querySelectorAll('input[name="delivery"]').forEach(inp => {
  inp.addEventListener('change', () => {
    const v = document.querySelector('input[name="delivery"]:checked').value;
    if (v === 'Přivézt') {
      addressLabel.classList.remove('hidden');
      addressInput.required = true;
    } else {
      addressLabel.classList.add('hidden');
      addressInput.required = false;
    }
  });
});

/* ========== Validace objednávky před odesláním ========== */
function validateOrder(payload) {
  if (!payload.name) return "Zadej jméno.";
  if (!payload.email) return "Zadej e-mail.";
  const t = payload.typ;
  if (t === 'Polévka' && payload.polevka !== 'Ano') return "Pro 'Polévka' je potřeba zvolit polévku.";
  if (t === 'Jídlo' && payload.jidlo1 !== 'Ano' && payload.jidlo2 !== 'Ano') return "Pro 'Jídlo' zvol alespoň jedno hlavní jídlo.";
  if (t === 'Celé menu' && (payload.polevka !== 'Ano' || (payload.jidlo1 !== 'Ano' && payload.jidlo2 !== 'Ano' && payload.jidlo1 !== 'Ano'))) return "Pro 'Celé menu' zvol polévku a alespoň jedno hlavní jídlo.";
  if (t === 'Poloviční menu') {
    if (payload.polevka !== 'Ano') return "Poloviční menu vyžaduje polévku.";
    if (payload.whichHalf !== 'jidlo1' && payload.whichHalf !== 'jidlo2') return "U polovičního menu vyber, které hlavní půlku chceš.";
  }
  if (t === 'Půl + půl' && (payload.jidlo1 !== 'Ano' || payload.jidlo2 !== 'Ano')) return "Pro 'Půl + půl' musí být obě hlavní jídla zvolena.";
  if (payload.doruceni === 'Přivézt' && (!payload.adresa || payload.adresa.trim().length < 3)) return "Zadej platnou adresu pro doručení.";
  return null;
}

/* ========== Odeslání objednávky ========== */
orderForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultMsg.classList.add('hidden');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Odesílám…';

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    polevka: chkPolevka.checked ? 'Ano' : 'Ne',
    jidlo1: chkJidlo1.checked ? 'Ano' : 'Ne',
    jidlo2: chkJidlo2.checked ? 'Ano' : 'Ne',
    typ: typSelect.value,
    whichHalf: whichHalf.value,
    doruceni: document.querySelector('input[name="delivery"]:checked').value,
    adresa: addressInput.value.trim()
  };

  const err = validateOrder(payload);
  if (err) {
    showResult(false, err);
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Odeslat objednávku';
    return;
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Server vrátil chybu');
    showResult(true, '✅ Objednávka byla odeslána. Děkujeme!');
  } catch (err) {
    showResult(false, 'Chyba při odesílání: ' + err.message);
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
