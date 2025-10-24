// js/main.js
import { state } from './state.js';
import { renderAll } from './ui.js';
import { initializeEventListeners } from './listeners.js';
import { loadStateFromLocalStorage } from './services/storageService.js';
import { generatePdf } from './services/pdfService.js';
import { initializeImportExportEventListeners } from './services/importExportService.js';
import './loader.js'; // Import for side effects

function initializeApp() {
    console.log("1. App Initializing...");
    loadStateFromLocalStorage();
    initializeEventListeners();
    
    initializeImportExportEventListeners(state);

    // UPDATED: Removed event listeners for the deleted save/load buttons
    document.getElementById('generate-pdf-btn').addEventListener('click', () => generatePdf(state));
    
    renderAll();
    console.log("✅ App Initialized Successfully.");
}

document.addEventListener('DOMContentLoaded', initializeApp);