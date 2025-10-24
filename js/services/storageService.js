// js/services/storageService.js
import { state } from '../state.js';

export function saveStateToLocalStorage(currentState) {
    try {
        const stateToSave = {
            companies: currentState.companies,
            selectedCompanyId: currentState.selectedCompanyId, // UPDATED
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

            // --- ADVANCED MIGRATION LOGIC ---
            if (loadedState.companies && typeof loadedState.companies[0] === 'object') {
                // New format exists, load directly
                state.companies = loadedState.companies;
                state.selectedCompanyId = loadedState.selectedCompanyId;
            } else {
                // Old string-based format, migrate it
                const defaultCompany = { id: 1, name: 'Default Company', address: '', email: '', phone: '', website: '' };
                state.companies = [defaultCompany];
                state.selectedCompanyId = 1;

                if(loadedState.companies && loadedState.companies.length > 0) {
                    // If user had multiple companies, create objects for them
                     state.companies = loadedState.companies.map((companyName, index) => ({
                        id: index + 1,
                        name: companyName,
                        address: '', email: '', phone: '', website: ''
                     }));
                     const selectedIndex = loadedState.companies.indexOf(loadedState.selectedCompany);
                     state.selectedCompanyId = selectedIndex !== -1 ? selectedIndex + 1 : 1;
                }
            }
            
            state.suppliers = loadedState.suppliers || [];
            state.products = loadedState.products || [];
            state.orderHistory = loadedState.orderHistory || [];

            // Migrate items that don't have a companyId
            state.suppliers.forEach(s => { if (!s.companyId) s.companyId = s.company === state.companies.find(c=>c.name === s.company)?.id || 1; delete s.company; });
            state.products.forEach(p => { if (!p.companyId) p.companyId = p.company === state.companies.find(c=>c.name === p.company)?.id || 1; delete p.company; });
            state.orderHistory.forEach(o => { if (!o.companyId) o.companyId = o.company === state.companies.find(c=>c.name === o.company)?.id || 1; delete o.company; });


            state.cart = loadedState.cart || [];
            state.vatEnabled = loadedState.vatEnabled || false;
            
            if (loadedState.orderDetails) {
                state.orderDetails = loadedState.orderDetails;
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