// js/ui.js
import { state } from './state.js';

const supplierList = document.getElementById('supplier-list');
const productList = document.getElementById('product-list');
const cartList = document.getElementById('cart-list');
const productsTitle = document.getElementById('products-title');
const addProductBtn = document.getElementById('add-product-btn');
const priceBreakdownEl = document.getElementById('price-breakdown');

// START: New Function
function renderOrderDetails() {
    const { orderNumber, orderDate, paymentMethod, isPaid } = state.orderDetails;
    document.getElementById('order-number').value = orderNumber || '';
    document.getElementById('order-date').value = orderDate || new Date().toISOString().slice(0, 10);
    document.getElementById('payment-method').value = paymentMethod || 'Credit Card';
    document.getElementById('paid-status-toggle').checked = isPaid || false;
}

// Replace the existing renderOrderHistory function in ui.js
function renderOrderHistory() {
    const historyList = document.getElementById('order-history-list');
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    historyList.innerHTML = '';

    // START: Updated Filtering Logic
    let filtered = state.orderHistory;

    // 1. Filter by selected supplier if one is active
    if (state.selectedSupplierId) {
        filtered = filtered.filter(order => order.supplierId === state.selectedSupplierId);
    }

    // 2. Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(order =>
            order.orderNumber.toLowerCase().includes(searchTerm) ||
            order.supplierName.toLowerCase().includes(searchTerm)
        );
    }
    // END: Updated Filtering Logic

    if (filtered.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No past orders found.</div>';
        return;
    }

    filtered.forEach(order => {
        const el = document.createElement('div');
        el.className = 'history-item';
        const statusBadge = order.isPaid
            ? '<span class="paid-badge">PAID</span>'
            : '<span class="unpaid-badge">UNPAID</span>';

        // START: Added Action Buttons
        el.innerHTML = `
            <div class="history-item-header">
                <span class="order-number">${order.orderNumber}</span>
                <span>$${order.totalPrice.toFixed(2)}</span>
            </div>
            <div class="history-item-details">
                <span>${new Date(order.orderDate).toLocaleDateString()}</span> |
                <span>${order.supplierName}</span> |
                ${statusBadge}
            </div>
            <div class="history-item-actions">
                <button class="preview-btn" data-id="${order.id}" title="Preview/Edit this order"><i class="fas fa-eye"></i> Edit</button>
                <button class="reprint-btn" data-id="${order.id}" title="Reprint PDF for this order"><i class="fas fa-print"></i> Reprint</button>
                <button class="delete-btn delete-order-btn" data-id="${order.id}" title="Delete this order"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        // END: Added Action Buttons
        historyList.appendChild(el);
    });
}

// END: New Function

export function renderAll() {
    renderSuppliers();
    renderOrderHistory();
    renderProducts();
    renderCart();
    renderOrderDetails(); // Add this line
}

function renderSuppliers() {
    const searchTerm = document.getElementById('supplier-search').value.toLowerCase();
    supplierList.innerHTML = '';

    const filtered = state.suppliers.filter(s => {
        const nameMatch = s.name && s.name.toLowerCase().includes(searchTerm);
        const emailMatch = s.email && s.email.toLowerCase().includes(searchTerm);
        const phoneMatch = s.phone && s.phone.toLowerCase().includes(searchTerm);
        const addressMatch = s.address && s.address.toLowerCase().includes(searchTerm);
        return nameMatch || emailMatch || phoneMatch || addressMatch;
    });

    if (filtered.length === 0) {
        supplierList.innerHTML = '<div class="empty-state">No suppliers found.</div>';
        return;
    }

    filtered.forEach(supplier => {
        const el = document.createElement('div');
        el.className = 'list-item' + (supplier.id === state.selectedSupplierId ? ' selected' : '');
        el.dataset.id = supplier.id;
        const photoHTML = supplier.photo ? `<img src="${supplier.photo}" alt="${supplier.name}" class="photo-thumb">` : `<i class="fas fa-user"></i>`;
        el.innerHTML = `
            <div class="photo-container">${photoHTML}</div>
            <div class="item-info">
                <strong>${supplier.name}</strong>
                <small>${supplier.email || 'No email'}</small>
            </div>
            <div class="item-actions">
                <button class="edit-btn" title="Edit ${supplier.name}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="Delete ${supplier.name}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        supplierList.appendChild(el);
    });
}

function renderProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    productList.innerHTML = '';
    
    if (!state.selectedSupplierId) {
        productsTitle.innerHTML = '<i class="fas fa-box"></i> Products';
        addProductBtn.classList.add('hidden');
        productList.innerHTML = '<div class="empty-state">Select a supplier to see their products.</div>';
        return;
    }

    const supplier = state.suppliers.find(s => s.id === state.selectedSupplierId);
    if (!supplier) {
        productsTitle.innerHTML = '<i class="fas fa-box"></i> Products';
        productList.innerHTML = '<div class="empty-state">Error: Supplier not found.</div>';
        return;
    }
    
    productsTitle.innerHTML = `<i class="fas fa-box"></i> Products from ${supplier.name}`;
    addProductBtn.classList.remove('hidden');

    const filtered = state.products.filter(p => 
        p.supplierId === state.selectedSupplierId &&
        (p.title.toLowerCase().includes(searchTerm) || 
         (p.code && p.code.toLowerCase().includes(searchTerm)) || 
         (p.amazonCode && p.amazonCode.toLowerCase().includes(searchTerm)))
    );

    if (filtered.length === 0) {
        productList.innerHTML = '<div class="empty-state">No products found for this supplier.</div>';
        return;
    }

    filtered.forEach(product => {
        const el = document.createElement('div');
        el.className = 'list-item product-item';
        el.dataset.id = product.id;
        const photoHTML = product.photo ? `<img src="${product.photo}" alt="${product.title}" class="photo-thumb">` : `<i class="fas fa-box"></i>`;
        el.innerHTML = `
            <div class="photo-container">${photoHTML}</div>
            <div class="item-info">
                <strong>${product.title}</strong>
                <small>$${parseFloat(product.price).toFixed(2)}</small>
                <div class="code-info">
                    <span>${product.code || 'N/A'}</span> / <span>${product.amazonCode || 'N/A'}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="edit-product-btn" title="Edit ${product.title}"><i class="fas fa-edit"></i></button>
                <button class="delete-product-btn" title="Delete ${product.title}"><i class="fas fa-trash"></i></button>
                <button class="add-to-cart-btn" title="Add to Cart"><i class="fas fa-plus"></i></button>
            </div>
        `;
        productList.appendChild(el);
    });
}

function renderCart() {
    cartList.innerHTML = '';
    let netTotal = 0;
    
    if (state.cart.length === 0) {
        cartList.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
        priceBreakdownEl.innerHTML = ''; // Clear prices
        return;
    }

    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) return; // Should not happen, but good practice
        netTotal += product.price * item.quantity;
        const el = document.createElement('div');
        el.className = 'list-item';
        el.dataset.id = item.productId;
        el.innerHTML = `
            <div class="item-info">
                <strong>${product.title}</strong>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn decrease-qty" title="Decrease quantity">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn increase-qty" title="Increase quantity">+</button>
            </div>
            <span>$${(product.price * item.quantity).toFixed(2)}</span>
        `;
        cartList.appendChild(el);
    });
    
    const vatAmount = state.vatEnabled ? netTotal * 0.20 : 0;
    const grandTotal = netTotal + vatAmount;
    priceBreakdownEl.innerHTML = `
        <div class="price-line">
            <span>Net Price</span>
            <span>$${netTotal.toFixed(2)}</span>
        </div>
        ${state.vatEnabled ? `
        <div class="price-line">
            <span>VAT (20%)</span>
            <span>$${vatAmount.toFixed(2)}</span>
        </div>` : ''}
        <div class="price-line total">
            <span>Grand Total</span>
            <span>$${grandTotal.toFixed(2)}</span>
        </div>
    `;
}