// js/listeners.js
import { generatePdf, generatePdfFromHistory } from './services/pdfService.js';
import * as State from './state.js';
import { renderAll, renderFloatingBasket, toggleOrderDetails } from './ui.js';
import { openModal, closeModal, showCustomConfirm, openCompanyModal, closeCompanyModal, openCompanyListModal, closeCompanyListModal } from './modal.js';
import { saveStateToFirestore } from './services/storageService.js';
import { handleFileImport, handleDataExport } from './services/importExportService.js';
import { getCurrentUser, updateUserProfile, changeUserPassword } from './services/authService.js';

// Function to update dashboard when data changes
export function updateDashboard() {
    // Check if dashboard is currently active
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView && dashboardView.classList.contains('active')) {
        // Re-render the dashboard
        import('./dashboard.js').then(dashboard => {
            dashboard.renderDashboard();
        });
    }
}

function renderAndSave() {
    try {
        renderAll();
        saveStateToFirestore(State.state);
        // Update dashboard if it's active
        updateDashboard();
    } catch (error) {
        console.error("A critical error occurred during the render and save process:", error);
        alert("An error occurred. Please check the console for more details.");
    }
}

function handlePlaceOrder() {
    // Check if cart is empty
    if (State.state.cart.length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
        return;
    }
    
    // Check if order number is provided
    const orderNumber = document.getElementById('order-number').value.trim();
    if (!orderNumber) {
        alert("Order number is required. Please enter an order number before placing the order.");
        document.getElementById('order-number').focus();
        return;
    }
    
    State.placeOrder();
    renderAndSave();
}

function handleFormSave() {
    if (State.state.editingItemType === 'supplier') {
        const name = document.getElementById('supplier-name').value;
        if (!name) { alert("Supplier name is required."); return; }
        const itemData = {
            id: State.state.editingItemId || Date.now(), name, photo: State.state.tempPhoto,
            email: document.getElementById('supplier-email').value,
            phone: document.getElementById('supplier-phone').value,
            address: document.getElementById('supplier-address').value,
            notes: document.getElementById('supplier-notes').value
        };
        State.saveItem(itemData);
    } else if (State.state.editingItemType === 'product') {
        const title = document.getElementById('product-title').value;
        const price = document.getElementById('product-price').value;
        const supplierId = document.getElementById('product-supplier').value;
        
        if (!title || !price) { alert("Product Title and Price are required."); return; }
        if (!supplierId) { alert("Please select a supplier."); return; }
        
        const itemData = {
            id: State.state.editingItemId || Date.now(), 
            supplierId: parseFloat(supplierId), 
            title, 
            price: parseFloat(price),
            photo: State.state.tempPhoto, 
            code: document.getElementById('product-code').value,
            amazonCode: document.getElementById('product-amazon-code').value, 
            desc: document.getElementById('product-desc').value
        };
        State.saveItem(itemData);
    }
    closeModal();
    renderAndSave();
}

function handleCompanyFormSave() {
    const idValue = document.getElementById('company-id').value;
    const id = idValue ? Number(idValue) : null;

    const name = document.getElementById('company-name').value;
    if (!name.trim()) {
        alert('Company name is required.');
        return;
    }

    const companyData = {
        name: name.trim(),
        address: document.getElementById('company-address').value.trim(),
        email: document.getElementById('company-email').value.trim(),
        phone: document.getElementById('company-phone').value.trim(),
        website: document.getElementById('company-website').value.trim()
    };

    if (id) {
        State.updateCompany({ id, ...companyData });
    } else {
        State.addCompany(companyData);
    }

    closeCompanyModal();
    renderAndSave();
}

// Function to switch between views and update URL hash
export function switchView(viewName, options = {}) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Handle supplier selection when navigating to products view
    if (viewName === 'products' && options.supplierId) {
        // Set the supplier filter dropdown to the selected supplier
        setTimeout(() => {
            const supplierFilter = document.getElementById('supplier-filter');
            if (supplierFilter) {
                // Convert supplierId to string to ensure consistency
                supplierFilter.value = options.supplierId.toString();
                renderAll();
            }
        }, 0);
    }
    
    // Clear selected supplier when navigating to views that should show all data
    // This ensures we see all orders when viewing history or dashboard, not just those from a specific supplier
    if (viewName === 'history' || viewName === 'suppliers' || viewName === 'dashboard') {
        State.state.selectedSupplierId = null;
    }
    
    // If switching to dashboard view, render the dashboard
    if (viewName === 'dashboard') {
        import('./dashboard.js').then(dashboard => {
            dashboard.renderDashboard();
        });
    }
    
    // Update URL hash to preserve state on refresh
    window.location.hash = viewName;
    
    // If switching to settings view, do nothing special for user settings
    if (viewName === 'settings') {
        // User settings are now handled via dropdown, no action needed
    }
    
    // If switching away from history view, collapse all order details
    if (viewName !== 'history') {
        collapseAllOrderDetails();
    }
}

// Function to get the current view from URL hash or default to suppliers
function getCurrentViewFromHash() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    const validViews = ['dashboard', 'suppliers', 'products', 'order', 'history', 'settings'];
    return validViews.includes(hash) ? hash : 'dashboard';
}

// Populate user profile form with current user data
function populateUserProfileForm() {
    // User profile form is now handled via modal, no action needed
}

export function initializeEventListeners() {
    // Set the initial view based on URL hash
    const initialView = getCurrentViewFromHash();
    switchView(initialView);
    
    // Collapse all order details on page load to ensure clean state
    if (initialView !== 'history') {
        collapseAllOrderDetails();
    }
    
    // Listen for hash changes (browser back/forward buttons)
    window.addEventListener('hashchange', () => {
        const view = getCurrentViewFromHash();
        switchView(view);
    });

    // Add event listener for supplier filter
    const supplierFilter = document.getElementById('supplier-filter');
    if (supplierFilter) {
        supplierFilter.addEventListener('change', renderAll);
    }

    // Add event listener for reset supplier filter button
    const resetSupplierFilterBtn = document.getElementById('reset-supplier-filter');
    if (resetSupplierFilterBtn) {
        resetSupplierFilterBtn.addEventListener('click', () => {
            if (supplierFilter) {
                supplierFilter.value = '';
                renderAll();
            }
        });
    }

    // Sidebar navigation - Add error handling
    try {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const viewName = item.dataset.view;
                switchView(viewName);
            });
        });
    } catch (error) {
        console.error("Error initializing navigation listeners:", error);
    }

    // Floating basket events
    const closeBasketBtn = document.getElementById('close-basket-btn');
    const resetBasketBtn = document.getElementById('reset-basket-btn');
    const goToOrderBtn = document.getElementById('go-to-order-btn');
    
    if (closeBasketBtn) {
        closeBasketBtn.addEventListener('click', () => {
            document.getElementById('floating-basket').classList.add('hidden');
        });
    }
    
    if (resetBasketBtn) {
        resetBasketBtn.addEventListener('click', () => {
            State.clearCart();
            renderAndSave();
        });
    }
    
    if (goToOrderBtn) {
        goToOrderBtn.addEventListener('click', () => {
            switchView('order');
            document.getElementById('floating-basket').classList.add('hidden');
        });
    }

    document.getElementById('company-filter-select').addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === 'add_new_company') {
            openCompanyModal();
        } else {
            State.selectCompany(Number(selectedValue));
            renderAndSave();
        }
    });

    document.getElementById('manage-companies-btn').addEventListener('click', openCompanyListModal);

    // Settings page event listeners
    const exportBackupBtn = document.getElementById('export-backup-btn');
    const importBackupBtn = document.getElementById('import-backup-btn');
    const importBackupFileInput = document.getElementById('import-backup-file-input');
    const importDataBtn = document.getElementById('import-data-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataFileInput = document.getElementById('import-data-file-input');
    
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', () => {
            import('./services/backupService.js').then(backupService => {
                backupService.exportBackup(State.state);
            });
        });
    }
    
    if (importBackupBtn) {
        importBackupBtn.addEventListener('click', () => {
            importBackupFileInput.click();
        });
    }
    
    if (importBackupFileInput) {
        importBackupFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                import('./services/backupService.js').then(backupService => {
                    backupService.importBackup(file, State.state, renderAndSave);
                });
            }
            event.target.value = null;
        });
    }
    
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            importDataFileInput.click();
        });
    }
    
    if (importDataFileInput) {
        importDataFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // Use existing import functionality
                handleFileImport(file, State.state);
            }
            event.target.value = null;
        });
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            // Use existing export functionality
            handleDataExport(State.state);
        });
    }

    document.getElementById('company-list-close-btn').addEventListener('click', closeCompanyListModal);

    document.getElementById('company-management-list').addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-company-btn');
        const deleteBtn = e.target.closest('.delete-company-btn');
        
        if (editBtn) {
            const companyId = Number(editBtn.dataset.id);
            closeCompanyListModal();
            openCompanyModal(companyId);
        }

        if (deleteBtn) {
            const companyId = Number(deleteBtn.dataset.id);
            if (State.state.companies.length <= 1) {
                alert("You cannot delete the only company.");
                return;
            }
            const company = State.state.companies.find(c => c.id === companyId);
            if (company) {
                showCustomConfirm('Delete Company?', `Delete "${company.name}" and all associated data? This cannot be undone.`, () => {
                    State.deleteCompany(companyId);
                    closeCompanyListModal();
                    renderAndSave();
                });
            }
        }
    });

    document.getElementById('company-save-btn').addEventListener('click', handleCompanyFormSave);
    document.getElementById('company-cancel-btn').addEventListener('click', closeCompanyModal);
    document.getElementById('company-delete-btn').addEventListener('click', () => {
        const id = Number(document.getElementById('company-id').value);
        if (id) {
            showCustomConfirm('Delete Company?', 'Are you sure you want to delete this company and all of its associated data? This cannot be undone.', () => {
                State.deleteCompany(id);
                closeCompanyModal();
                renderAndSave();
            });
        }
    });

    document.getElementById('add-supplier-btn').addEventListener('click', () => openModal('supplier'));
    document.getElementById('add-product-btn').addEventListener('click', () => openModal('product'));
    document.getElementById('modal-save-btn').addEventListener('click', handleFormSave);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('supplier-search').addEventListener('input', renderAll);
    document.getElementById('product-search').addEventListener('input', renderAll);
    document.getElementById('history-search').addEventListener('input', function(e) {
        // Show reset button when there's text in the search box
        const resetBtn = document.getElementById('reset-history-search');
        if (resetBtn) {
            resetBtn.style.display = e.target.value ? 'inline-block' : 'none';
        }
        renderAll();
    });
    
    // Add event listener for reset history search button
    const resetHistorySearchBtn = document.getElementById('reset-history-search');
    if (resetHistorySearchBtn) {
        resetHistorySearchBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('history-search');
            if (searchInput) {
                searchInput.value = '';
                resetHistorySearchBtn.style.display = 'none';
                renderAll();
            }
        });
    }
    document.getElementById('place-order-btn').addEventListener('click', handlePlaceOrder);
    document.getElementById('generate-pdf-btn').addEventListener('click', () => {
        if (State.state.cart.length === 0) { alert("Your cart is empty."); return; }
        generatePdf(State.state);
    });
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        if (State.state.cart.length === 0) return;
        showCustomConfirm('Clear Current Order?', 'This will clear the items in your current order. Are you sure?', () => {
            State.clearCart();
            renderAndSave();
        });
    });
    document.getElementById('vat-toggle').addEventListener('change', (e) => State.toggleVat(e.target.checked));
    document.getElementById('order-number').addEventListener('input', (e) => State.updateOrderDetails({ orderNumber: e.target.value }));
    document.getElementById('order-date').addEventListener('change', (e) => State.updateOrderDetails({ orderDate: e.target.value }));
    document.getElementById('payment-method').addEventListener('change', (e) => State.updateOrderDetails({ paymentMethod: e.target.value }));
    document.getElementById('paid-status-toggle').addEventListener('change', (e) => State.updateOrderDetails({ isPaid: e.target.checked }));

    // Supplier card events
    document.getElementById('supplier-list').addEventListener('click', (e) => {
        const supplierCard = e.target.closest('.supplier-card');
        if (!supplierCard) return;
        const id = Number(supplierCard.dataset.id);
        
        // Edit button
        if (e.target.closest('.edit-btn')) {
            openModal('supplier', id);
        } 
        // Delete button
        else if (e.target.closest('.delete-btn')) {
            const supplier = State.state.suppliers.find(s => s.id === id);
            showCustomConfirm('Delete Supplier?', `Delete ${supplier.name} and all their products? This cannot be undone.`, () => {
                State.deleteSupplier(id);
                renderAndSave();
            });
        } 
        // Show inventory button
        else if (e.target.closest('.show-inventory-btn')) {
            // Instead of selecting supplier, navigate to products view with supplier ID
            switchView('products', { supplierId: id });
        }
    });

    // Product card events
    document.getElementById('product-list').addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (!productCard) return;
        const id = Number(productCard.dataset.id);
        
        // Edit button
        if (e.target.closest('.edit-product-btn')) {
            openModal('product', id);
        } 
        // Delete button
        else if (e.target.closest('.delete-product-btn')) {
            const product = State.state.products.find(p => p.id === id);
            showCustomConfirm('Delete Product?', `Are you sure you want to delete ${product.title}?`, () => {
                State.deleteProduct(id);
                renderAndSave();
            });
        } 
        // Add to cart button
        else if (e.target.closest('.add-to-cart-btn')) {
            State.addToCart(id);
            renderAndSave();
        }
    });

    document.getElementById('cart-list').addEventListener('click', (e) => {
        const listItem = e.target.closest('.list-item');
        if (!listItem) return;
        const id = Number(listItem.dataset.id);
        if (e.target.closest('.increase-qty')) { State.updateCartQuantity(id, 1); }
        else if (e.target.closest('.decrease-qty')) { State.updateCartQuantity(id, -1); }
        renderAndSave();
    });

    document.getElementById('order-history-list').addEventListener('click', (e) => {
        const previewBtn = e.target.closest('.preview-btn');
        const reprintBtn = e.target.closest('.reprint-btn');
        const deleteBtn = e.target.closest('.delete-order-btn');
        const viewBtn = e.target.closest('.view-btn'); // New view button

        if (viewBtn) {
            const orderId = Number(viewBtn.dataset.id);
            const order = State.state.orderHistory.find(o => o.id === orderId);
            if (order) {
                toggleOrderDetails(orderId, order);
            }
        }

        if (previewBtn) {
            const orderId = Number(previewBtn.dataset.id);
            showCustomConfirm('Load Order?', 'This will replace your current order with the selected historical order. Are you sure?', () => {
                State.loadOrderForEditing(orderId);
                renderAll();
                // Switch to order view when loading an order
                switchView('order');
            });
        }

        if (reprintBtn) {
            const orderId = Number(reprintBtn.dataset.id);
            const orderToReprint = State.state.orderHistory.find(o => o.id === orderId);
            if (orderToReprint) {
                // Pass all required state arrays to the function
                generatePdfFromHistory(orderToReprint, State.state.products, State.state.suppliers, State.state.companies);
            }
        }

        if (deleteBtn) {
            const orderId = Number(deleteBtn.dataset.id);
            showCustomConfirm('Delete Order?', 'Are you sure you want to permanently delete this order from your history?', () => {
                State.deleteOrder(orderId);
                renderAndSave();
            });
        }
    });
    
    // Add keyboard navigation for switching views
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + 1-4 to switch views
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    switchView('suppliers');
                    break;
                case '2':
                    e.preventDefault();
                    switchView('products');
                    break;
                case '3':
                    e.preventDefault();
                    switchView('order');
                    break;
                case '4':
                    e.preventDefault();
                    switchView('history');
                    break;
            }
        }
    });
}

// Function to collapse all order details on the history page
function collapseAllOrderDetails() {
    // Get all order details containers
    const detailContainers = document.querySelectorAll('.order-details-expanded');
    detailContainers.forEach(container => {
        container.style.display = 'none';
    });
    
    // Reset all view buttons to show "View" instead of "Hide"
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.innerHTML = '<i class="fas fa-search"></i> View';
        button.title = 'View order details';
    });
}
