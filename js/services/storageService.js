// js/services/storageService.js
import { state } from '../state.js';
import { getCurrentUser } from '../services/authService.js';
import { db } from '../firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Get the storage key for the current user
function getUserStorageKey() {
    const user = getCurrentUser();
    return user ? `supplySyncData_${user.id}` : 'supplySyncData';
}

export async function saveStateToFirestore(currentState) {
    const user = getCurrentUser();
    if (!user) return; // Can't save if no user is logged in

    // Create a reference to the user's document using their unique ID
    const userDocRef = doc(db, 'userData', user.id);

    try {
        // Use setDoc to save the entire state object. This will overwrite any existing data.
        await setDoc(userDocRef, {
            companies: currentState.companies,
            selectedCompanyId: currentState.selectedCompanyId,
            suppliers: currentState.suppliers,
            products: currentState.products,
            // We don't need to save the cart or volatile details
            orderHistory: currentState.orderHistory,
        });
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        alert("Error: Could not save your data. Please check your internet connection.");
    }
}

export async function loadStateFromFirestore() {
    const user = getCurrentUser();
    if (!user) return false;

    const userDocRef = doc(db, 'userData', user.id);

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const loadedData = docSnap.data();
            // Carefully merge loaded data into the existing state object
            Object.assign(state, loadedData);
            console.log("User data loaded from Firestore.");
            return true;
        } else {
            // No data exists for this user, they are likely new.
            // The app will just use its default initial state.
            console.log("No data found for this user, initializing with defaults.");
            return false;
        }
    } catch (error) {
        console.error("Error loading data from Firestore:", error);
        return false;
    }
}

export function saveStateToLocalStorage(currentState) {
    try {
        const stateToSave = {
            companies: currentState.companies,
            selectedCompanyId: currentState.selectedCompanyId,
            suppliers: currentState.suppliers,
            products: currentState.products,
            cart: currentState.cart,
            vatEnabled: currentState.vatEnabled,
            orderDetails: currentState.orderDetails,
            orderHistory: currentState.orderHistory,
            selectedSupplierId: currentState.selectedSupplierId // Add this line to save selected supplier
        };
        const storageKey = getUserStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Could not save data to local storage:", error);
        alert("Error: Could not save data. The browser's storage might be full.");
    }
}

export function loadStateFromLocalStorage() {
    try {
        const storageKey = getUserStorageKey();
        const savedData = localStorage.getItem(storageKey);
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
            // Load selected supplier ID if it exists
            state.selectedSupplierId = loadedState.selectedSupplierId || null;
            
            if (loadedState.orderDetails) {
                state.orderDetails = loadedState.orderDetails;
            }
            
            // Only set the VAT toggle if the element exists (app is initialized)
            const vatToggle = document.getElementById('vat-toggle');
            if (vatToggle) {
                vatToggle.checked = state.vatEnabled;
            }
            
            return true;
        } else {
            // If no saved data, initialize with default company
            const defaultCompany = { id: 1, name: 'Default Company', address: '', email: '', phone: '', website: '' };
            state.companies = [defaultCompany];
            state.selectedCompanyId = 1;
            state.suppliers = [];
            state.products = [];
            state.orderHistory = [];
            state.cart = [];
            state.vatEnabled = false;
            state.orderDetails = {
                orderNumber: '',
                orderDate: new Date().toISOString().slice(0, 10),
                paymentMethod: 'Credit Card',
                isPaid: false
            };
            state.selectedSupplierId = null;
            
            return false;
        }
    } catch (error) {
        console.error("Could not load data from local storage:", error);
        // Don't remove the data, just return false
        return false;
    }
}