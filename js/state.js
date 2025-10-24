// js/state.js
export const state = {
    companies: [{ id: 1, name: 'Default Company', address: '', email: '', phone: '', website: '' }],
    selectedCompanyId: 1,
    suppliers: [],
    products: [],
    cart: [],
    orderHistory: [],
    editingOrderId: null,
    orderDetails: {
        orderNumber: '',
        orderDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Credit Card',
        isPaid: false
    },
    selectedSupplierId: null,
    editingItemId: null,
    editingItemType: null,
    tempPhoto: null,
    vatEnabled: false
};

// --- UPDATED COMPANY FUNCTIONS ---
export function addCompany(companyData) {
    const newId = Date.now();
    state.companies.push({ id: newId, ...companyData });
    selectCompany(newId);
}

export function updateCompany(companyData) {
    const index = state.companies.findIndex(c => c.id === companyData.id);
    if (index > -1) {
        state.companies[index] = { ...state.companies[index], ...companyData };
    }
}

export function deleteCompany(companyId) {
    if (state.companies.length === 1) {
        alert("You cannot delete the only company.");
        return;
    }
    // Reassign data to the first available company before deleting
    const newCompanyId = state.companies.find(c => c.id !== companyId).id;
    state.suppliers = state.suppliers.filter(s => s.companyId !== companyId);
    state.products = state.products.filter(p => p.companyId !== companyId);
    state.orderHistory = state.orderHistory.filter(o => o.companyId !== companyId);

    state.companies = state.companies.filter(c => c.id !== companyId);

    if (state.selectedCompanyId === companyId) {
        selectCompany(newCompanyId);
    }
}


export function selectCompany(companyId) {
    state.selectedCompanyId = companyId;
    state.selectedSupplierId = null;
    state.cart = [];
}

/**
 * Applies the user-verified changes from the import process to the state.
 * @param {object} changes - An object containing arrays of new/updated suppliers and products.
 */
export function applyImportChanges(changes) {
    changes.newSuppliers.forEach(supData => {
        if (!state.suppliers.some(s => s.name.toLowerCase() === supData.name.toLowerCase() && s.companyId === state.selectedCompanyId)) {
            state.suppliers.push({
                id: Date.now() + Math.random(),
                companyId: state.selectedCompanyId, // UPDATED
                name: supData.name, email: supData.email, phone: supData.phone, address: supData.address,
                notes: '', photo: null
            });
        }
    });

    changes.updatedSuppliers.forEach(supData => {
        const supplier = state.suppliers.find(s => s.name.toLowerCase() === supData.name.toLowerCase() && s.companyId === state.selectedCompanyId);
        if (supplier) {
            Object.assign(supplier, { email: supData.email, phone: supData.phone, address: supData.address });
        }
    });

    changes.newProducts.forEach(prodData => {
        const supplier = state.suppliers.find(s => s.name.toLowerCase() === prodData.supplierName.toLowerCase() && s.companyId === state.selectedCompanyId);
        if (supplier) {
            if (!state.products.some(p => p.amazonCode?.toLowerCase() === prodData.amazonCode.toLowerCase() && p.supplierId === supplier.id)) {
                state.products.push({
                    id: Date.now() + Math.random(),
                    supplierId: supplier.id,
                    companyId: state.selectedCompanyId, // UPDATED
                    title: prodData.title, price: prodData.price, code: prodData.code, amazonCode: prodData.amazonCode,
                    desc: '', photo: null
                });
            }
        }
    });

    changes.updatedProducts.forEach(prodData => {
        const supplier = state.suppliers.find(s => s.name.toLowerCase() === prodData.supplierName.toLowerCase() && s.companyId === state.selectedCompanyId);
        if (supplier) {
            const product = state.products.find(p => p.amazonCode?.toLowerCase() === prodData.amazonCode.toLowerCase() && p.supplierId === supplier.id);
            if (product) {
                Object.assign(product, { title: prodData.title, price: prodData.price, code: prodData.code });
            }
        }
    });
}


export function selectSupplier(id) {
    state.selectedSupplierId = id;
}

export function saveItem(itemData) {
    const list = state.editingItemType === 'supplier' ? state.suppliers : state.products;
    if (!state.editingItemId) {
        itemData.companyId = state.selectedCompanyId; // UPDATED
        list.push(itemData);
    } else {
        const index = list.findIndex(i => i.id === state.editingItemId);
        if (index > -1) {
            itemData.companyId = list[index].companyId;
            list[index] = itemData;
        }
    }
}

export function deleteSupplier(id) {
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    state.products = state.products.filter(p => p.supplierId !== id);
    if (state.selectedSupplierId === id) {
        state.selectedSupplierId = null;
    }
}

export function deleteProduct(id) {
    state.products = state.products.filter(p => p.id !== id);
    state.cart = state.cart.filter(item => item.productId !== id);
}

export function addToCart(productId) {
    const existingItem = state.cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({ productId: productId, quantity: 1 });
    }
}

export function updateCartQuantity(productId, change) {
    const cartItem = state.cart.find(item => item.productId === productId);
    if (cartItem) {
        cartItem.quantity += change;
        if (cartItem.quantity <= 0) {
            state.cart = state.cart.filter(item => item.productId !== productId);
        }
    }
}

export function clearCart() {
    state.cart = [];
    state.editingOrderId = null;
}

export function toggleVat(isEnabled) {
    state.vatEnabled = isEnabled;
}

export function updateOrderDetails(details) {
    state.orderDetails = { ...state.orderDetails, ...details };
}

export function placeOrder() {
    if (state.cart.length === 0) return null;

    const supplier = state.suppliers.find(s => s.id === state.selectedSupplierId);
    let netTotal = 0;
    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product) netTotal += product.price * item.quantity;
    });

    const vatAmount = state.vatEnabled ? netTotal * 0.20 : 0;
    const grandTotal = netTotal + vatAmount;

    const orderPayload = {
        orderNumber: state.orderDetails.orderNumber,
        orderDate: state.orderDetails.orderDate,
        supplierId: state.selectedSupplierId,
        supplierName: supplier ? supplier.name : 'N/A',
        totalPrice: grandTotal,
        isPaid: state.orderDetails.isPaid,
        items: [...state.cart],
        companyId: state.selectedCompanyId // UPDATED
    };

    if (state.editingOrderId) {
        const orderIndex = state.orderHistory.findIndex(o => o.id === state.editingOrderId);
        if (orderIndex > -1) {
            state.orderHistory[orderIndex] = { ...state.orderHistory[orderIndex], ...orderPayload };
        }
    } else {
        const newOrder = { id: Date.now(), ...orderPayload };
        state.orderHistory.unshift(newOrder);
    }

    state.cart = [];
    state.orderDetails.orderNumber = '';
    state.editingOrderId = null;
}

export function loadOrderForEditing(orderId) {
    const order = state.orderHistory.find(o => o.id === orderId);
    if (!order) return;

    selectCompany(order.companyId); // UPDATED

    state.cart = [...order.items];
    state.selectedSupplierId = order.supplierId;
    state.orderDetails = {
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        paymentMethod: order.paymentMethod || 'Credit Card',
        isPaid: order.isPaid
    };
    state.editingOrderId = order.id;
}

export function deleteOrder(orderId) {
    state.orderHistory = state.orderHistory.filter(o => o.id !== orderId);
}