// js/main.js
import { state } from './state.js';
import { renderAll } from './ui.js';
import { initializeEventListeners } from './listeners.js';
import { loadStateFromLocalStorage } from './services/storageService.js';
import { generatePdf } from './services/pdfService.js';
import { initializeImportExportEventListeners } from './services/importExportService.js';
import { isAuthenticated, getCurrentUser, logoutUser } from './services/authService.js';
import { showAuthScreen, showMainApp, hideAuthScreen } from './authUI.js';
import './loader.js'; // Import for side effects

function initializeApp() {
    console.log("1. App Initializing...");
    try {
        // Check if user is authenticated
        const authStatus = isAuthenticated();
        console.log("Authentication status:", authStatus);
        if (authStatus) {
            // User is logged in, show main app
            console.log("User is authenticated, showing main app");
            showMainApp();
            initializeEventListeners();
            initializeImportExportEventListeners(state);
            document.getElementById('generate-pdf-btn').addEventListener('click', () => generatePdf(state));
            console.log("✅ App Initialized Successfully.");
        } else {
            // User is not logged in, show auth screen
            console.log("User is not authenticated, showing auth screen");
            showAuthScreen();
        }
    } catch (error) {
        console.error("❌ App Initialization Failed:", error);
        alert("An error occurred during app initialization. Please check the console for details.");
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);