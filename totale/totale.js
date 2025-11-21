const db = firebase.database();
const totaliProdottiDiv = document.getElementById("totaliProdotti");
const downloadBtn = document.getElementById("downloadCSV");

let prodotti = {};
let persone = {};

function aggiornaTotali() {
    const totali = {};
    Object.values(prodotti).forEach(prodotto => {
        totali[prodotto.id] = 0;
    });
    Object.values(persone).forEach(persona => {
        if (persona.prodotti) {
            Object.entries(persona.prodotti).forEach(([prodottoId, quantita]) => {
                if (totali[prodottoId] !== undefined) {
                    totali[prodottoId] += quantita;
                }
            });
        }
    });
    totaliProdottiDiv.innerHTML = "";
    Object.values(prodotti).forEach(prodotto => {
        const card = document.createElement("div");
        card.className = "card-totale";
        card.innerHTML = `
            <div class="prodotto-nome">${prodotto.nome}</div>
            <div class="prodotto-totale">${totali[prodotto.id] || 0}</div>
            <div class="prodotto-label">Totale</div>
        `;
        totaliProdottiDiv.appendChild(card);
    });
}

function scaricaCSV() {
    const intestazione = ["Nome", "Cognome", ...Object.values(prodotti).map(p => p.nome)];
    const righe = [intestazione];
    Object.values(persone).forEach(persona => {
        const riga = [
            persona.nome || "",
            persona.cognome || "",
            ...Object.values(prodotti).map(prodotto => (persona.prodotti && persona.prodotti[prodotto.id]) ? persona.prodotti[prodotto.id] : 0)
        ];
        righe.push(riga);
    });
    const csv = righe.map(riga => riga.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "totali_persone.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

db.ref("Prodotti").on("value", snapshot => {
    prodotti = {};
    snapshot.forEach(child => {
        prodotti[child.key] = { id: child.key, ...child.val() };
    });
    aggiornaTotali();
});

db.ref("Persone").on("value", snapshot => {
    persone = {};
    snapshot.forEach(child => {
        persone[child.key] = { id: child.key, ...child.val() };
    });
    aggiornaTotali();
});

downloadBtn.onclick = scaricaCSV;