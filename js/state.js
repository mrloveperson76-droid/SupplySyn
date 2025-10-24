// js/state.js
export const state = {
    suppliers: [],
    products: [],
    cart: [],
    orderHistory: [],
    editingOrderId: null, // Track if we are editing a past order
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

/**
 * Applies the user-verified changes from the import process to the state.
 * @param {object} changes - An object containing arrays of new/updated suppliers and products.
 */
export function applyImportChanges(changes) {
    // 1. Add New Suppliers
    changes.newSuppliers.forEach(supData => {
        if (!state.suppliers.some(s => s.name.toLowerCase() === supData.name.toLowerCase())) {
            state.suppliers.push({
                id: Date.now() + Math.random(),
                name: supData.name,
                email: supData.email,
                phone: supData.phone,
                address: supData.address,
                notes: '', photo: null
            });
        }
    });

    // 2. Update Existing Suppliers
    changes.updatedSuppliers.forEach(supData => {
        const supplier = state.suppliers.find(s => s.name.toLowerCase() === supData.name.toLowerCase());
        if (supplier) {
            supplier.email = supData.email;
            supplier.phone = supData.phone;
            supplier.address = supData.address;
        }
    });

    // 3. Add New Products
    changes.newProducts.forEach(prodData => {
        const supplier = state.suppliers.find(s => s.name.toLowerCase() === prodData.supplierName.toLowerCase());
        if (supplier) {
            // --- FIX: Added a safety check for 'p.amazonCode' before calling toLowerCase ---
            if (!state.products.some(p => p.amazonCode && p.amazonCode.toLowerCase() === prodData.amazonCode.toLowerCase() && p.supplierId === supplier.id)) {
                state.products.push({
                    id: Date.now() + Math.random(),
                    supplierId: supplier.id,
                    title: prodData.title,
                    price: prodData.price,
                    code: prodData.code,
                    amazonCode: prodData.amazonCode,
                    desc: '', photo: null
                });
            }
        }
    });

    // 4. Update Existing Products
    changes.updatedProducts.forEach(prodData => {
        const supplier = state.suppliers.find(s => s.name.toLowerCase() === prodData.supplierName.toLowerCase());
        if (supplier) {
            // --- FIX: Added a safety check for 'p.amazonCode' before calling toLowerCase ---
            const product = state.products.find(p =>
                p.amazonCode && p.amazonCode.toLowerCase() === prodData.amazonCode.toLowerCase() &&
                p.supplierId === supplier.id
            );

            if (product) {
                product.title = prodData.title;
                product.price = prodData.price;
                product.code = prodData.code;
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
        list.push(itemData);
    } else {
        const index = list.findIndex(i => i.id === state.editingItemId);
        if (index > -1) {
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
    state.editingOrderId = null; // Clear editing state
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

    if (state.editingOrderId) {
        const orderIndex = state.orderHistory.findIndex(o => o.id === state.editingOrderId);
        if (orderIndex > -1) {
            const updatedOrder = {
                ...state.orderHistory[orderIndex],
                orderNumber: state.orderDetails.orderNumber,
                orderDate: state.orderDetails.orderDate,
                supplierId: state.selectedSupplierId,
                supplierName: supplier ? supplier.name : 'N/A',
                totalPrice: grandTotal,
                isPaid: state.orderDetails.isPaid,
                items: [...state.cart]
            };
            state.orderHistory[orderIndex] = updatedOrder;
        }
    } else {
        const newOrder = {
            id: Date.now(),
            orderNumber: state.orderDetails.orderNumber || `PO-${Date.now()}`,
            orderDate: state.orderDetails.orderDate,
            supplierId: state.selectedSupplierId,
            supplierName: supplier ? supplier.name : 'N/A',
            totalPrice: grandTotal,
            isPaid: state.orderDetails.isPaid,
            items: [...state.cart]
        };
        state.orderHistory.unshift(newOrder);
    }

    state.cart = [];
    state.orderDetails.orderNumber = '';
    state.editingOrderId = null;
}

export function loadOrderForEditing(orderId) {
    const order = state.orderHistory.find(o => o.id === orderId);
    if (!order) return;

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