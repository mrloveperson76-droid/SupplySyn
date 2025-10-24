// js/listeners.js
import { generatePdf, generatePdfFromHistory } from './services/pdfService.js';
import * as State from './state.js';
import { renderAll } from './ui.js';
import { openModal, closeModal, showCustomConfirm, openCompanyModal, closeCompanyModal, openCompanyListModal, closeCompanyListModal } from './modal.js';
import { saveStateToLocalStorage } from './services/storageService.js';

function renderAndSave() {
    renderAll();
    saveStateToLocalStorage(State.state);
}

function handlePlaceOrder() {
    if (State.state.cart.length === 0) {
        alert("Your cart is empty. Please add items before placing an order.");
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
        if (!title || !price) { alert("Product Title and Price are required."); return; }
        const itemData = {
            id: State.state.editingItemId || Date.now(), supplierId: State.state.selectedSupplierId, title, price: parseFloat(price),
            photo: State.state.tempPhoto, code: document.getElementById('product-code').value,
            amazonCode: document.getElementById('product-amazon-code').value, desc: document.getElementById('product-desc').value
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

export function initializeEventListeners() {
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
    document.getElementById('history-search').addEventListener('input', renderAll);
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

    document.getElementById('supplier-list').addEventListener('click', (e) => {
        const listItem = e.target.closest('.list-item');
        if (!listItem) return;
        const id = Number(listItem.dataset.id);
        if (e.target.closest('.edit-btn')) {
            openModal('supplier', id);
        } else if (e.target.closest('.delete-btn')) {
            const supplier = State.state.suppliers.find(s => s.id === id);
            showCustomConfirm('Delete Supplier?', `Delete ${supplier.name} and all their products? This cannot be undone.`, () => {
                State.deleteSupplier(id);
                renderAndSave();
            });
        } else {
            State.selectSupplier(id);
            renderAll();
        }
    });

    document.getElementById('product-list').addEventListener('click', (e) => {
        const listItem = e.target.closest('.list-item');
        if (!listItem) return;
        const id = Number(listItem.dataset.id);
        if (e.target.closest('.add-to-cart-btn')) { State.addToCart(id); renderAndSave(); }
        else if (e.target.closest('.edit-product-btn')) { openModal('product', id); }
        else if (e.target.closest('.delete-product-btn')) {
            const product = State.state.products.find(p => p.id === id);
            showCustomConfirm('Delete Product?', `Are you sure you want to delete ${product.title}?`, () => {
                State.deleteProduct(id);
                renderAndSave();
            });
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

        if (previewBtn) {
            const orderId = Number(previewBtn.dataset.id);
            showCustomConfirm('Load Order?', 'This will replace your current order with the selected historical order. Are you sure?', () => {
                State.loadOrderForEditing(orderId);
                renderAll();
            });
        }

        if (reprintBtn) {
            const orderId = Number(reprintBtn.dataset.id);
            const orderToReprint = State.state.orderHistory.find(o => o.id === orderId);
            if (orderToReprint) {
                generatePdfFromHistory(orderToReprint, State.state.products, State.state.suppliers);
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
}