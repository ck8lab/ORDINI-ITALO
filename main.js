import { db } from './firebase-config.js';
import {
  ref,
  push,
  set,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- SELETTORI DOM ---
const tabellaPersone = document.getElementById('tabellaPersone').querySelector('tbody');
const btnAggiungiPersona = document.getElementById('btnAggiungiPersona');
const modalPersona = new bootstrap.Modal(document.getElementById('modalPersona'));
const formPersona = document.getElementById('formPersona');
const inputNome = document.getElementById('inputNome');
const inputCognome = document.getElementById('inputCognome');
const selectProdotto = document.getElementById('selectProdotto');
const inputQuantita = document.getElementById('inputQuantita');
const btnAggiungiProdotto = document.getElementById('btnAggiungiProdotto');
const listaProdottiAggiunti = document.getElementById('listaProdottiAggiunti');
const btnSalvaPersona = document.getElementById('btnSalvaPersona');
const btnEliminaOrdine = document.getElementById('btnEliminaOrdine');
const totaliProdotti = document.getElementById('totaliProdotti');
const btnEliminaSelezionati = document.getElementById('btnEliminaSelezionati');
const checkboxSelezionaTutti = document.getElementById('checkboxSelezionaTutti');

// --- VARIABILI ---
let prodottiDisponibili = [];
let prodottiAggiunti = [];
let personaInModifica = null;
let personeData = {};
let personeSelezionate = new Set();

// --- FUNZIONI DATABASE ---
const personeRef = ref(db, "Persone");
const prodottiRef = ref(db, "Prodotti");

// Carica prodotti disponibili da Realtime Database
function caricaProdotti() {
  onValue(prodottiRef, snapshot => {
    const data = snapshot.val() || {};
    prodottiDisponibili = Object.entries(data).map(([id, val]) => ({
      id,
      nome: val.nome
    }));
    aggiornaSelectProdotti();
    aggiornaTotaliProdotti();
  });
}

// Aggiorna la select dei prodotti nel form persona
function aggiornaSelectProdotti() {
  selectProdotto.innerHTML = '';
  prodottiDisponibili.forEach(prod => {
    const option = document.createElement('option');
    option.value = prod.id;
    option.textContent = prod.nome;
    selectProdotto.appendChild(option);
  });
}

// Carica persone e aggiorna la tabella in tempo reale
function ascoltaPersone() {
  onValue(personeRef, snapshot => {
    personeData = snapshot.val() || {};
    aggiornaTabellaPersone();
    aggiornaTotaliProdotti();
  });
}

// Aggiorna la tabella delle persone
function aggiornaTabellaPersone() {
  tabellaPersone.innerHTML = '';
  const personeArr = Object.entries(personeData);
  personeArr.forEach(([id, persona], idx) => {
    const prodottiList = persona.prodotti
      ? Object.entries(persona.prodotti).map(([prodId, val]) => ({
          prodottoId: prodId,
          quantita: val.Quantita
        }))
      : [];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <input type="checkbox" class="checkbox-persona" data-id="${id}" ${personeSelezionate.has(id) ? 'checked' : ''}>
      </td>
      <td>${persona.nome || ''}</td>
      <td>${persona.cognome || ''}</td>
      <td>
        <ul class="list-unstyled mb-0">
          ${prodottiList.map((p, i) => `
            <li>
              <span class="badge bg-primary">${p.quantita}</span>
              <span>${getNomeProdotto(p.prodottoId)}</span>
            </li>
          `).join('')}
        </ul>
      </td>
      <td>
        <button class="btn btn-accent btn-sm" data-id="${id}" data-action="modifica">Modifica</button>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" data-id="${id}" data-action="elimina">Elimina</button>
      </td>
    `;
    tabellaPersone.appendChild(tr);
  });
  aggiornaCheckboxEvent();
  aggiornaStatoEliminaSelezionati();
}

// Gestione checkbox selezione persone
function aggiornaCheckboxEvent() {
  document.querySelectorAll('.checkbox-persona').forEach(cb => {
    cb.addEventListener('change', function () {
      const id = this.dataset.id;
      if (this.checked) {
        personeSelezionate.add(id);
      } else {
        personeSelezionate.delete(id);
      }
      aggiornaStatoEliminaSelezionati();
      aggiornaCheckboxSelezionaTutti();
    });
  });
}

// Seleziona/deseleziona tutti
checkboxSelezionaTutti.addEventListener('change', function () {
  if (this.checked) {
    Object.keys(personeData).forEach(id => personeSelezionate.add(id));
  } else {
    personeSelezionate.clear();
  }
  aggiornaTabellaPersone();
});

// Aggiorna stato bottone elimina selezionati
function aggiornaStatoEliminaSelezionati() {
  btnEliminaSelezionati.disabled = personeSelezionate.size === 0;
}

// Aggiorna stato checkbox "seleziona tutti"
function aggiornaCheckboxSelezionaTutti() {
  const total = Object.keys(personeData).length;
  const selected = personeSelezionate.size;
  checkboxSelezionaTutti.checked = total > 0 && selected === total;
  checkboxSelezionaTutti.indeterminate = selected > 0 && selected < total;
}

// Elimina selezionati
btnEliminaSelezionati.addEventListener('click', async () => {
  if (!confirm("Vuoi eliminare tutte le persone selezionate?")) return;
  const promises = [];
  personeSelezionate.forEach(id => {
    promises.push(remove(ref(db, `Persone/${id}`)));
  });
  await Promise.all(promises);
  personeSelezionate.clear();
  aggiornaStatoEliminaSelezionati();
  aggiornaCheckboxSelezionaTutti();
});

// Ottieni il nome del prodotto dato l'id
function getNomeProdotto(id) {
  const prod = prodottiDisponibili.find(p => p.id === id);
  return prod ? prod.nome : '—';
}

// Aggiorna i totali dei prodotti
function aggiornaTotaliProdotti() {
  const totali = {};
  Object.values(personeData).forEach(persona => {
    if (persona.prodotti) {
      Object.entries(persona.prodotti).forEach(([prodId, val]) => {
        if (!totali[prodId]) totali[prodId] = 0;
        totali[prodId] += Number(val.Quantita);
      });
    }
  });
  totaliProdotti.innerHTML = '';
  prodottiDisponibili.forEach(prod => {
    const quantita = totali[prod.id] || 0;
    const card = document.createElement('div');
    card.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
    card.innerHTML = `
      <div class="card text-center">
        <div class="card-body">
          <h5 class="card-title">${prod.nome}</h5>
          <p class="card-text">${quantita}</p>
        </div>
      </div>
    `;
    totaliProdotti.appendChild(card);
  });
}

// --- EVENTI UI ---

// Aggiungi persona
btnAggiungiPersona.addEventListener('click', () => {
  formPersona.reset();
  prodottiAggiunti = [];
  aggiornaListaProdottiAggiunti();
  personaInModifica = null;
  document.getElementById('modalPersonaLabel').textContent = "Aggiungi Persona";
  modalPersona.show();
});

// Aggiungi prodotto alla lista temporanea
btnAggiungiProdotto.addEventListener('click', () => {
  const prodottoId = selectProdotto.value;
  const quantita = parseInt(inputQuantita.value, 10);
  if (!prodottoId || !quantita || quantita < 1) return;
  // Se già presente, aggiorna la quantità
  const idx = prodottiAggiunti.findIndex(p => p.prodottoId === prodottoId);
  if (idx > -1) {
    prodottiAggiunti[idx].quantita += quantita;
  } else {
    prodottiAggiunti.push({ prodottoId, quantita });
  }
  aggiornaListaProdottiAggiunti();
  inputQuantita.value = '';
});

// Aggiorna la lista dei prodotti aggiunti nel form
function aggiornaListaProdottiAggiunti() {
  listaProdottiAggiunti.innerHTML = '';
  prodottiAggiunti.forEach((p, idx) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span>
        <span class="badge bg-primary">${getNomeProdotto(p.prodottoId)}</span>
        <span class="badge bg-accent">${p.quantita}</span>
      </span>
      <span>
        <button class="btn btn-sm btn-accent me-1" data-idx="${idx}" data-action="modifica-prodotto">Modifica</button>
        <button class="btn btn-sm btn-danger" data-idx="${idx}" data-action="elimina-prodotto">Elimina</button>
      </span>
    `;
    listaProdottiAggiunti.appendChild(li);
  });
}

// Gestione modifica/elimina prodotto nella lista temporanea
listaProdottiAggiunti.addEventListener('click', e => {
  const idx = e.target.dataset.idx;
  if (e.target.dataset.action === 'elimina-prodotto') {
    prodottiAggiunti.splice(idx, 1);
    aggiornaListaProdottiAggiunti();
  }
  if (e.target.dataset.action === 'modifica-prodotto') {
    const prod = prodottiAggiunti[idx];
    selectProdotto.value = prod.prodottoId;
    inputQuantita.value = prod.quantita;
    prodottiAggiunti.splice(idx, 1);
    aggiornaListaProdottiAggiunti();
  }
});

// Salva persona (aggiungi o modifica)
btnSalvaPersona.addEventListener('click', async () => {
  if (!inputNome.value.trim() || !inputCognome.value.trim() || prodottiAggiunti.length === 0) return;
  // Prepara oggetto prodotti come dizionario { prodottoId: { Quantita: n } }
  const prodottiObj = {};
  prodottiAggiunti.forEach(p => {
    prodottiObj[p.prodottoId] = { Quantita: p.quantita };
  });
  const dati = {
    nome: inputNome.value.trim(),
    cognome: inputCognome.value.trim(),
    prodotti: prodottiObj
  };
  if (personaInModifica) {
    await update(ref(db, `Persone/${personaInModifica}`), dati);
  } else {
    await set(push(personeRef), dati);
  }
  modalPersona.hide();
});

// Modifica o elimina persona dalla tabella
tabellaPersone.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  if (e.target.dataset.action === 'modifica') {
    // Carica dati persona e mostra nel form
    const persona = personeData[id];
    if (!persona) return;
    inputNome.value = persona.nome || '';
    inputCognome.value = persona.cognome || '';
    prodottiAggiunti = persona.prodotti
      ? Object.entries(persona.prodotti).map(([prodId, val]) => ({
          prodottoId: prodId,
          quantita: val.Quantita
        }))
      : [];
    aggiornaListaProdottiAggiunti();
    personaInModifica = id;
    document.getElementById('modalPersonaLabel').textContent = "Modifica Persona";
    modalPersona.show();
  }
  if (e.target.dataset.action === 'elimina') {
    if (confirm("Sei sicuro di voler eliminare questa persona?")) {
      await remove(ref(db, `Persone/${id}`));
    }
  }
});

// Elimina tutti gli ordini
btnEliminaOrdine.addEventListener('click', async () => {
  if (!confirm("Sei sicuro di voler eliminare TUTTI gli ordini?")) return;
  await set(personeRef, null);
  personeSelezionate.clear();
  aggiornaStatoEliminaSelezionati();
  aggiornaCheckboxSelezionaTutti();
});

// --- INIZIALIZZAZIONE ---
caricaProdotti();
ascoltaPersone();