// js/services/storageService.js
import { state } from '../state.js';

export function saveStateToLocalStorage(currentState) {
    try {
        const stateToSave = {
            suppliers: currentState.suppliers,
            products: currentState.products,
            cart: currentState.cart,
            vatEnabled: currentState.vatEnabled,
            orderDetails: currentState.orderDetails,
            orderHistory: currentState.orderHistory
        };
        localStorage.setItem('supplySyncData', JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Could not save data to local storage:", error);
        alert("Error: Could not save data. The browser's storage might be full.");
    }
}

export function loadStateFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('supplySyncData');
        if (savedData) {
            const loadedState = JSON.parse(savedData);
            state.suppliers = loadedState.suppliers || [];
            state.products = loadedState.products || [];
            state.cart = loadedState.cart || [];
            state.vatEnabled = loadedState.vatEnabled || false;
            state.orderHistory = loadedState.orderHistory || [];
            if (loadedState.orderDetails) {
                state.orderDetails = loadedState.orderDetails;
            } else {
                state.orderDetails = {
                    orderNumber: '',
                    orderDate: new Date().toISOString().slice(0, 10),
                    paymentMethod: 'Credit Card',
                    isPaid: false
                };
            }
            document.getElementById('vat-toggle').checked = state.vatEnabled;
            return true;
        }
    } catch (error) {
        console.error("Could not load data from local storage:", error);
        localStorage.removeItem('supplySyncData');
    }
    return false;
}

// UPDATED: Removed the saveDataToFile and loadDataFromFile functions