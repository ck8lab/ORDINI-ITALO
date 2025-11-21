// Importa le funzioni necessarie dagli SDK Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Configurazione della tua app Firebase (sostituisci con i tuoi dati se necessario)
const firebaseConfig = {
  apiKey: "AIzaSyATORitVMmd4Cs1pwKRoac7XQSiROmwjP8",
  authDomain: "ordini-italo.firebaseapp.com",
  databaseURL: "https://ordini-italo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ordini-italo",
  storageBucket: "ordini-italo.appspot.com",
  messagingSenderId: "466835118634",
  appId: "1:466835118634:web:59e2bbd0c8898a606b0153"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Realtime Database
const db = getDatabase(app);

// Esporta il database per usarlo negli altri file
export { db };