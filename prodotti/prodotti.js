import { db } from '../firebase-config.js';
import {
  ref,
  push,
  set,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- SELETTORI DOM ---
const tabellaProdotti = document.getElementById('tabellaProdotti').querySelector('tbody');
const btnAggiungiProdotto = document.getElementById('btnAggiungiProdotto');
const modalProdotto = new bootstrap.Modal(document.getElementById('modalProdotto'));
const formProdotto = document.getElementById('formProdotto');
const inputNomeProdotto = document.getElementById('inputNomeProdotto');
const btnSalvaProdotto = document.getElementById('btnSalvaProdotto');

// --- VARIABILI ---
let prodottoInModifica = null;
let prodottiData = {};

// --- FIREBASE ---
const prodottiRef = ref(db, "Prodotti");

// Carica prodotti e aggiorna la tabella in tempo reale
function ascoltaProdotti() {
  onValue(prodottiRef, snapshot => {
    prodottiData = snapshot.val() || {};
    aggiornaTabellaProdotti();
  });
}

// Aggiorna la tabella dei prodotti
function aggiornaTabellaProdotti() {
  tabellaProdotti.innerHTML = '';
  const prodottiArr = Object.entries(prodottiData);
  prodottiArr.forEach(([id, prodotto], idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <th scope="row">${idx + 1}</th>
      <td>${prodotto.nome || ''}</td>
      <td>
        <button class="btn btn-accent btn-sm" data-id="${id}" data-action="modifica">Modifica</button>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" data-id="${id}" data-action="elimina">Elimina</button>
      </td>
    `;
    tabellaProdotti.appendChild(tr);
  });
}

// --- EVENTI UI ---

// Aggiungi prodotto
btnAggiungiProdotto.addEventListener('click', () => {
  formProdotto.reset();
  prodottoInModifica = null;
  document.getElementById('modalProdottoLabel').textContent = "Aggiungi Prodotto";
  modalProdotto.show();
});

// Salva prodotto (aggiungi o modifica)
btnSalvaProdotto.addEventListener('click', async () => {
  if (!inputNomeProdotto.value.trim()) return;
  const dati = { nome: inputNomeProdotto.value.trim() };
  if (prodottoInModifica) {
    await update(ref(db, `Prodotti/${prodottoInModifica}`), dati);
  } else {
    await set(push(prodottiRef), dati);
  }
  modalProdotto.hide();
});

// Modifica o elimina prodotto dalla tabella
tabellaProdotti.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  if (e.target.dataset.action === 'modifica') {
    // Carica dati prodotto e mostra nel form
    const prodotto = prodottiData[id];
    if (!prodotto) return;
    inputNomeProdotto.value = prodotto.nome || '';
    prodottoInModifica = id;
    document.getElementById('modalProdottoLabel').textContent = "Modifica Prodotto";
    modalProdotto.show();
  }
  if (e.target.dataset.action === 'elimina') {
    if (confirm("Sei sicuro di voler eliminare questo prodotto?")) {
      await remove(ref(db, `Prodotti/${id}`));
    }
  }
});

// --- INIZIALIZZAZIONE ---
ascoltaProdotti();