// js/main.js

import { state } from './state.js';
import { renderAll } from './ui.js';
import { initializeEventListeners } from './listeners.js';
import { loadStateFromFirestore } from './services/storageService.js'; // Ensure this is here
import { generatePdf } from './services/pdfService.js';
import { initializeImportExportEventListeners } from './services/importExportService.js';
// Step 1: Add these new imports
import { onAuthStateChanged } from './services/authService.js';
import { auth } from './firebase-config.js';
import { showAuthScreen, showMainApp, } from './authUI.js';
import './loader.js'; // Import for side effects

// Step 2: Replace the entire initializeApp function with this
function initializeApp() {
    console.log("1. App Initializing and setting up auth listener...");
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in!
            console.log("Auth state changed: User is signed in.", user);
            
            // Load their data from the database
            await loadStateFromFirestore();
            
            // Show the main application UI
            showMainApp();
            
            // Initialize all the event listeners for the main app
            initializeEventListeners();
            initializeImportExportEventListeners(state);
            document.getElementById('generate-pdf-btn').addEventListener('click', () => generatePdf(state));
            
            console.log("✅ App Initialized Successfully for logged-in user.");
        } else {
            // User is signed out
            console.log("Auth state changed: User is signed out.");
            
            // Show the login/register screen
            showAuthScreen();
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);