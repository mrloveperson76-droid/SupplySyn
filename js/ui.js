// js/ui.js
import { state } from './state.js';

const supplierList = document.getElementById('supplier-list');
const productList = document.getElementById('product-list');
const cartList = document.getElementById('cart-list');
const productsTitle = document.getElementById('products-title');
const addProductBtn = document.getElementById('add-product-btn');
const priceBreakdownEl = document.getElementById('price-breakdown');
const companyFilterSelect = document.getElementById('company-filter-select');

// Floating basket elements
const floatingBasket = document.getElementById('floating-basket');
const basketItems = document.getElementById('basket-items');
const basketTotal = document.getElementById('basket-total');
const closeBasketBtn = document.getElementById('close-basket-btn');

function renderCompanyFilter() {
    const originalValue = companyFilterSelect.value;
    companyFilterSelect.innerHTML = '';
    state.companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        if (company.id === state.selectedCompanyId) {
            option.selected = true;
        }
        companyFilterSelect.appendChild(option);
    });
    const addOption = document.createElement('option');
    addOption.value = 'add_new_company';
    addOption.textContent = '+ Add New Company';
    companyFilterSelect.appendChild(addOption);

    if (originalValue && state.companies.some(c => c.id == originalValue)) {
        companyFilterSelect.value = originalValue;
    }
}


function renderOrderDetails() {
    const { orderNumber, orderDate, paymentMethod, isPaid } = state.orderDetails;
    document.getElementById('order-number').value = orderNumber || '';
    document.getElementById('order-date').value = orderDate || new Date().toISOString().slice(0, 10);
    document.getElementById('payment-method').value = paymentMethod || 'Credit Card';
    document.getElementById('paid-status-toggle').checked = isPaid || false;
}

function renderOrderHistory() {
    const historyList = document.getElementById('order-history-list');
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    historyList.innerHTML = '';

    // Always clear selectedSupplierId when viewing order history to show all orders
    // This ensures we see all orders for the company, not just those from a specific supplier
    state.selectedSupplierId = null;

    let filtered = state.orderHistory.filter(order => order.companyId === state.selectedCompanyId);

    if (searchTerm) {
        filtered = filtered.filter(order =>
            order.orderNumber.toLowerCase().includes(searchTerm) ||
            order.supplierName.toLowerCase().includes(searchTerm)
        );
    }

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

        // Calculate total number of items in the order
        const totalItems = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        el.innerHTML = `
            <div class="history-item-header">
                <span class="order-number">${order.orderNumber}</span>
                <span>$${order.totalPrice.toFixed(2)}</span>
            </div>
            <div class="history-item-details">
                <span>${new Date(order.orderDate).toLocaleDateString()}</span> |
                <span>${order.supplierName}</span> |
                <span>${totalItems} items</span> |
                ${statusBadge}
            </div>
            <div class="history-item-actions">
                <button class="view-btn" data-id="${order.id}" title="View order details"><i class="fas fa-search"></i> View</button>
                <button class="preview-btn" data-id="${order.id}" title="Preview/Edit this order"><i class="fas fa-eye"></i> Edit</button>
                <button class="reprint-btn" data-id="${order.id}" title="Reprint PDF for this order"><i class="fas fa-print"></i> Reprint</button>
                <button class="delete-btn delete-order-btn" data-id="${order.id}" title="Delete this order"><i class="fas fa-trash"></i> Delete</button>
            </div>
            <div class="order-details-expanded" id="order-details-${order.id}" style="display: none;"></div>
        `;
        historyList.appendChild(el);
    });
    
    // Reset all view buttons to their default state (showing "View" instead of "Hide")
    const viewButtons = historyList.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.innerHTML = '<i class="fas fa-search"></i> View';
        button.title = 'View order details';
    });
}

// Function to toggle order details visibility
export function toggleOrderDetails(orderId, order) {
    const detailsContainer = document.getElementById(`order-details-${orderId}`);
    const viewBtn = document.querySelector(`.view-btn[data-id="${orderId}"]`);
    
    if (detailsContainer.style.display === 'none' || detailsContainer.style.display === '') {
        // Show details
        detailsContainer.style.display = 'block';
        detailsContainer.innerHTML = generateOrderDetailsHTML(order);
        viewBtn.innerHTML = '<i class="fas fa-search"></i> Hide';
        viewBtn.title = 'Hide order details';
    } else {
        // Hide details
        detailsContainer.style.display = 'none';
        viewBtn.innerHTML = '<i class="fas fa-search"></i> View';
        viewBtn.title = 'View order details';
    }
}

// Function to generate HTML for order details
export function generateOrderDetailsHTML(order) {
    // Find supplier and products for this order
    const supplier = state.suppliers.find(s => s.id === order.supplierId);
    const orderItems = order.items || [];
    
    // Generate items HTML
    let itemsHTML = '';
    let netTotal = 0;
    
    orderItems.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product) {
            const itemTotal = product.price * item.quantity;
            netTotal += itemTotal;
            
            itemsHTML += `
                <div class="order-item-row">
                    <span class="order-item-name">${product.title}</span>
                    <span class="order-item-quantity">${item.quantity}</span>
                    <span class="order-item-price">$${itemTotal.toFixed(2)}</span>
                </div>
            `;
        }
    });
    
    const vatAmount = order.isVatEnabled ? netTotal * 0.20 : 0;
    const grandTotal = netTotal + vatAmount;
    
    return `
        <div class="order-details-grid">
            <div class="order-detail-card">
                <h4>Order Information</h4>
                <div class="order-detail-item">
                    <span>Order #:</span>
                    <span>${order.orderNumber}</span>
                </div>
                <div class="order-detail-item">
                    <span>Date:</span>
                    <span>${new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <div class="order-detail-item">
                    <span>Status:</span>
                    <span>${order.isPaid ? 'PAID' : 'UNPAID'}</span>
                </div>
            </div>
            
            <div class="order-detail-card">
                <h4>Supplier Information</h4>
                <div class="order-detail-item">
                    <span>Name:</span>
                    <span>${supplier ? supplier.name : 'N/A'}</span>
                </div>
                <div class="order-detail-item">
                    <span>Email:</span>
                    <span>${supplier ? supplier.email || 'N/A' : 'N/A'}</span>
                </div>
                <div class="order-detail-item">
                    <span>Phone:</span>
                    <span>${supplier ? supplier.phone || 'N/A' : 'N/A'}</span>
                </div>
            </div>
            
            <div class="order-detail-card">
                <h4>Payment Details</h4>
                <div class="order-detail-item">
                    <span>Method:</span>
                    <span>${order.paymentMethod || 'N/A'}</span>
                </div>
                <div class="order-detail-item">
                    <span>VAT:</span>
                    <span>${order.isVatEnabled ? 'Yes (20%)' : 'No'}</span>
                </div>
            </div>
        </div>
        
        <div class="order-items-list">
            <h4>Order Items</h4>
            ${itemsHTML || '<div class="empty-state">No items found</div>'}
        </div>
        
        <div class="order-total-section">
            <div class="order-total-line">
                <span>Net Total:</span>
                <span>$${netTotal.toFixed(2)}</span>
            </div>
            ${order.isVatEnabled ? `
            <div class="order-total-line">
                <span>VAT (20%):</span>
                <span>$${vatAmount.toFixed(2)}</span>
            </div>` : ''}
            <div class="order-total-line total">
                <span>Grand Total:</span>
                <span>$${grandTotal.toFixed(2)}</span>
            </div>
        </div>
    `;
}

export function renderAll() {
    renderCompanyFilter();
    renderSupplierFilter();
    renderSuppliers();
    renderOrderHistory();
    renderProducts();
    renderCart();
    renderOrderDetails();
    renderFloatingBasket();
}

export function renderCompanyManagementList() {
    const listEl = document.getElementById('company-management-list');
    listEl.innerHTML = '';

    if (state.companies.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No companies found.</div>';
        return;
    }

    state.companies.forEach(company => {
        const el = document.createElement('div');
        el.className = 'list-item';

        el.innerHTML = `
            <div class="item-info">
                <strong>${company.name}</strong>
                <small>${company.email || 'No email provided'}</small>
            </div>
            <div class="item-actions">
                <button class="edit-company-btn button" data-id="${company.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="delete-company-btn button" data-id="${company.id}"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        listEl.appendChild(el);
    });
}

function renderSuppliers() {
    const searchTerm = document.getElementById('supplier-search').value.toLowerCase();
    supplierList.innerHTML = '';

    // Clear selectedSupplierId when viewing suppliers to ensure we see all suppliers
    state.selectedSupplierId = null;

    const filtered = state.suppliers.filter(s => {
        if (s.companyId !== state.selectedCompanyId) return false;
        const nameMatch = s.name?.toLowerCase().includes(searchTerm);
        const emailMatch = s.email?.toLowerCase().includes(searchTerm);
        const phoneMatch = s.phone?.toLowerCase().includes(searchTerm);
        const addressMatch = s.address?.toLowerCase().includes(searchTerm);
        return nameMatch || emailMatch || phoneMatch || addressMatch;
    });

    if (filtered.length === 0) {
        supplierList.innerHTML = '<div class="empty-state">No suppliers found.</div>';
        return;
    }

    // Update the suppliers title with instruction text
    const suppliersTitle = document.querySelector('#suppliers-view .panel-header h2');
    if (suppliersTitle) {
        suppliersTitle.innerHTML = `
            <i class="fas fa-users"></i> Suppliers
            <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-color-light); margin-left: 10px;">
                Choose Supplier to View Inventory
            </span>
        `;
    }

    filtered.forEach(supplier => {
        const photoHTML = supplier.photo ? 
            `<img src="${supplier.photo}" alt="${supplier.name}" class="photo-thumb">` : 
            `<i class="fas fa-user"></i>`;
        
        const el = document.createElement('div');
        el.className = 'supplier-card';
        el.dataset.id = supplier.id;
        el.innerHTML = `
            <div class="supplier-card-header">
                <div class="photo-container">${photoHTML}</div>
                <h3 title="${supplier.name}">${supplier.name}</h3>
            </div>
            <div class="supplier-card-body">
                <p title="${supplier.email || 'No email provided'}"><i class="fas fa-envelope"></i> ${supplier.email || 'No email'}</p>
                <p title="${supplier.phone || 'No phone provided'}"><i class="fas fa-phone"></i> ${supplier.phone || 'No phone'}</p>
            </div>
            <div class="supplier-card-footer">
                <button class="edit-btn button" title="Edit ${supplier.name}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn button" title="Delete ${supplier.name}"><i class="fas fa-trash"></i></button>
                <button class="show-inventory-btn button" title="Show Inventory for ${supplier.name}"><i class="fas fa-box"></i> Inventory</button>
            </div>
        `;
        supplierList.appendChild(el);
    });
}

function renderProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const supplierFilter = document.getElementById('supplier-filter').value;
    productList.innerHTML = '';
    
    const companyProducts = state.products.filter(p => p.companyId === state.selectedCompanyId);

    // Update the products title
    productsTitle.innerHTML = '<i class="fas fa-box"></i> Inventory';
    // Always show the add product button
    addProductBtn.classList.remove('hidden');

    // Filter products based on supplier filter and search term
    let filtered = companyProducts;
    
    if (supplierFilter) {
        // Convert supplierFilter to float for proper comparison with decimal IDs
        const supplierId = parseFloat(supplierFilter);
        filtered = filtered.filter(p => p.supplierId === supplierId);
        // Find supplier name for the title
        const supplier = state.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            productsTitle.innerHTML = `<i class="fas fa-box"></i> Products from ${supplier.name}`;
        }
    }

    // Apply search filter
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchTerm) || 
            p.code?.toLowerCase().includes(searchTerm) || 
            p.amazonCode?.toLowerCase().includes(searchTerm)
        );
    }

    // Show empty state if no products
    if (filtered.length === 0) {
        if (supplierFilter) {
            productList.innerHTML = '<div class="empty-state">No products found for this supplier.</div>';
        } else {
            productList.innerHTML = '<div class="empty-state">No products found. Add some products to get started.</div>';
        }
        return;
    }

    // Render products
    filtered.forEach(product => {
        const photoHTML = product.photo ? 
            `<img src="${product.photo}" alt="${product.title}" class="photo-thumb">` : 
            `<i class="fas fa-box"></i>`;
        
        const el = document.createElement('div');
        el.className = 'product-card';
        el.dataset.id = product.id;
        el.innerHTML = `
            <div class="product-card-header">
                <div class="photo-container">${photoHTML}</div>
                <h3 title="${product.title}">${product.title}</h3>
            </div>
            <div class="product-card-body">
                <p title="Price: $${parseFloat(product.price).toFixed(2)}"><i class="fas fa-tag"></i> $${parseFloat(product.price).toFixed(2)}</p>
                <p title="Supplier Code: ${product.code || 'N/A'}"><i class="fas fa-barcode"></i> ${product.code || 'N/A'}</p>
                <p title="Amazon Code: ${product.amazonCode || 'N/A'}"><i class="fas fa-barcode"></i> ${product.amazonCode || 'N/A'}</p>
            </div>
            <div class="product-card-footer">
                <button class="edit-product-btn button" title="Edit ${product.title}"><i class="fas fa-edit"></i></button>
                <button class="delete-product-btn button" title="Delete ${product.title}"><i class="fas fa-trash"></i></button>
                <button class="add-to-cart-btn button" title="Add ${product.title} to Cart"><i class="fas fa-cart-plus"></i> Add</button>
            </div>
        `;
        productList.appendChild(el);
    });
}

// Add function to render supplier filter options
function renderSupplierFilter() {
    const supplierFilter = document.getElementById('supplier-filter');
    if (!supplierFilter) return;
    
    // Store current value to preserve selection
    const currentValue = supplierFilter.value;
    
    // Clear existing options except the first one
    while (supplierFilter.options.length > 1) {
        supplierFilter.remove(1);
    }
    
    // Get suppliers for current company
    const companySuppliers = state.suppliers.filter(s => s.companyId === state.selectedCompanyId);
    
    // Add suppliers to the dropdown
    companySuppliers.forEach(supplier => {
        const option = document.createElement('option');
        // Convert supplier.id to string to ensure consistency
        option.value = supplier.id.toString();
        option.textContent = supplier.name;
        supplierFilter.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentValue && companySuppliers.some(s => s.id.toString() == currentValue)) {
        supplierFilter.value = currentValue;
    } else if (state.selectedSupplierId) {
        // If we have a selected supplier ID (from navigation), use it
        // Convert to string to ensure consistency
        supplierFilter.value = state.selectedSupplierId.toString();
        // Clear the state.selectedSupplierId as we're now using the dropdown
        state.selectedSupplierId = null;
    }
}

function renderCart() {
    cartList.innerHTML = '';
    let netTotal = 0;
    
    if (state.cart.length === 0) {
        cartList.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
        priceBreakdownEl.innerHTML = '';
        // We still need to manage the "Create New Order" button even when cart is empty
    } else {
        state.cart.forEach(item => {
            const product = state.products.find(p => p.id === item.productId);
            if (!product) return;
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
    
    // Manage the "Create New Order" button based on cart status
    const cartHeader = document.querySelector('#order-view .panel-header');
    if (cartHeader) {
        // Find the header-actions container
        let headerActions = cartHeader.querySelector('.header-actions');
        if (!headerActions) {
            headerActions = document.createElement('div');
            headerActions.className = 'header-actions';
            cartHeader.appendChild(headerActions);
        }
        
        // Manage the "Create New Order" button based on cart status
        const createOrderBtn = document.getElementById('create-new-order-btn');
        if (state.cart.length === 0) {
            // Add "Create New Order" button only when cart is empty
            if (!createOrderBtn) {
                const newCreateOrderBtn = document.createElement('button');
                newCreateOrderBtn.id = 'create-new-order-btn';
                newCreateOrderBtn.className = 'button';
                newCreateOrderBtn.innerHTML = '<i class="fas fa-plus"></i> Create New Order';
                newCreateOrderBtn.title = 'Create a new order';
                headerActions.appendChild(newCreateOrderBtn);
                
                // Add event listener
                setTimeout(() => {
                    document.getElementById('create-new-order-btn').addEventListener('click', () => {
                        // Clear current cart and switch to suppliers view
                        state.cart = [];
                        import('./listeners.js').then(listeners => {
                            listeners.switchView('suppliers');
                        });
                    });
                }, 0);
            }
        } else {
            // Remove "Create New Order" button when cart is not empty
            if (createOrderBtn) {
                createOrderBtn.remove();
            }
        }
    }
}

// Render the floating basket
export function renderFloatingBasket() {
    if (state.cart.length === 0) {
        floatingBasket.classList.add('hidden');
        return;
    }
    
    basketItems.innerHTML = '';
    let total = 0;
    
    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) return;
        
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        
        const basketItem = document.createElement('div');
        basketItem.className = 'basket-item';
        basketItem.innerHTML = `
            <div class="basket-item-info">
                <h4>${product.title}</h4>
                <p>$${product.price.toFixed(2)} each</p>
            </div>
            <div class="basket-item-quantity">
                <span>${item.quantity}</span>
            </div>
            <div class="basket-item-price">$${itemTotal.toFixed(2)}</div>
        `;
        basketItems.appendChild(basketItem);
    });
    
    basketTotal.textContent = `Total: $${total.toFixed(2)}`;
    floatingBasket.classList.remove('hidden');
}

// Add a function to update the view when the selected supplier changes
export function updateViewOnSupplierSelect() {
    // If we're on the products view, we might want to ensure it's still visible
    const productsView = document.getElementById('products-view');
    if (productsView && productsView.classList.contains('active')) {
        // Refresh the products view
        renderProducts();
    }
}
