// js/modal.js
import { state } from './state.js';
import { applyImportChanges } from './state.js';
import { renderAll } from './ui.js';
import { saveStateToLocalStorage } from './services/storageService.js';

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const customAlert = document.getElementById('custom-alert');

const verificationModal = document.getElementById('verification-modal');
const verificationModalBody = document.getElementById('verification-modal-body');

let alertConfirmCallback = null;

export function showInfoAlert(title, message) {
    const alertTitle = document.getElementById('custom-alert-title');
    const alertMessage = document.getElementById('custom-alert-message');
    const confirmBtn = document.getElementById('alert-confirm-btn');
    const cancelBtn = document.getElementById('alert-cancel-btn');

    alertTitle.textContent = title;

    if (typeof message === 'object' && message !== null) {
        alertMessage.innerHTML = `
            <strong>Import successful!</strong><br><br>
            New Suppliers Added: ${message.newSuppliers}<br>
            New Products Added: ${message.newProducts}<br>
            Existing Suppliers Updated: ${message.updatedSuppliers}<br>
            Existing Products Updated: ${message.updatedProducts}
        `;
    } else {
        alertMessage.textContent = message;
    }

    confirmBtn.textContent = 'OK';
    cancelBtn.style.display = 'none';

    customAlert.classList.remove('hidden');

    alertConfirmCallback = () => {
        confirmBtn.textContent = 'Confirm';
        cancelBtn.style.display = 'inline-flex';
        hideCustomConfirm();
    };
}


export function openModal(type, id = null) {
    state.editingItemType = type;
    state.editingItemId = id;
    state.tempPhoto = null;
    modalForm.innerHTML = '';

    if (type === 'supplier') {
        const supplier = state.suppliers.find(s => s.id === id) || {};
        modalTitle.textContent = id ? 'Edit Supplier' : 'Add New Supplier';
        state.tempPhoto = supplier.photo || null;
        modalForm.innerHTML = `
            <div class="modal-photo-field">
                <div id="photo-preview" class="modal-photo-preview"><i class="fas fa-user"></i></div>
                <div class="modal-photo-controls">
                    <label for="photo-input" class="button"><i class="fas fa-upload"></i> Upload Photo</label>
                    <input type="file" id="photo-input" accept="image/*" style="display: none;">
                    <button type="button" id="remove-photo-btn">Remove Photo</button>
                </div>
            </div>
            <div class="modal-form-field"><label for="supplier-name">Supplier Name</label><input type="text" id="supplier-name" value="${supplier.name || ''}" required></div>
            <div class="modal-form-field"><label for="supplier-email">Email</label><input type="email" id="supplier-email" value="${supplier.email || ''}"></div>
            <div class="modal-form-field"><label for="supplier-phone">Phone</label><input type="tel" id="supplier-phone" value="${supplier.phone || ''}"></div>
            <div class="modal-form-field"><label for="supplier-address">Address</label><textarea id="supplier-address" rows="2">${supplier.address || ''}</textarea></div>
            <div class="modal-form-field"><label for="supplier-notes">Notes</label><textarea id="supplier-notes" rows="3">${supplier.notes || ''}</textarea></div>
        `;
    } else if (type === 'product') {
        const product = state.products.find(p => p.id === id) || {};
        modalTitle.textContent = id ? 'Edit Product' : 'Add New Product';
        state.tempPhoto = product.photo || null;
        modalForm.innerHTML = `
            <div class="modal-photo-field">
                <div id="photo-preview" class="modal-photo-preview"><i class="fas fa-box"></i></div>
                <div class="modal-photo-controls">
                    <label for="photo-input" class="button"><i class="fas fa-upload"></i> Upload Photo</label>
                    <input type="file" id="photo-input" accept="image/*" style="display: none;">
                    <button type="button" id="remove-photo-btn">Remove Photo</button>
                </div>
            </div>
            <div class="modal-form-field"><label for="product-title">Item Title</label><input type="text" id="product-title" value="${product.title || ''}" required></div>
            <div class="modal-form-field"><label for="product-code">Supplier Code</label><input type="text" id="product-code" value="${product.code || ''}"></div>
            <div class="modal-form-field"><label for="product-amazon-code">Amazon Code</label><input type="text" id="product-amazon-code" value="${product.amazonCode || ''}"></div>
            <div class="modal-form-field"><label for="product-price">Purchase Price</label><input type="number" id="product-price" step="0.01" min="0" value="${product.price || ''}" required></div>
            <div class="modal-form-field"><label for="product-desc">Description</label><textarea id="product-desc" rows="3">${product.desc || ''}</textarea></div>
        `;
    }
    setupPhotoControls();
    modal.classList.remove('hidden');
    modal.querySelector('input, textarea').focus();
}

export function closeModal() {
    modal.classList.add('hidden');
}

function setupPhotoControls() {
    const preview = document.getElementById('photo-preview');
    const photoInput = document.getElementById('photo-input');
    const removeBtn = document.getElementById('remove-photo-btn');

    const updatePreview = () => {
        if (state.tempPhoto) {
            preview.innerHTML = '';
            preview.style.backgroundImage = `url(${state.tempPhoto})`;
        } else {
            preview.style.backgroundImage = 'none';
            preview.innerHTML = state.editingItemType === 'supplier' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-box"></i>';
        }
    };

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                state.tempPhoto = event.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    removeBtn.addEventListener('click', () => {
        state.tempPhoto = null;
        photoInput.value = null;
        updatePreview();
    });

    updatePreview();
}

export function showCustomConfirm(title, message, callback) {
    document.getElementById('custom-alert-title').textContent = title;
    document.getElementById('custom-alert-message').textContent = message;

    document.getElementById('alert-confirm-btn').textContent = 'Confirm';
    document.getElementById('alert-cancel-btn').style.display = 'inline-flex';

    customAlert.classList.remove('hidden');
    alertConfirmCallback = callback;
}

export function hideCustomConfirm() {
    customAlert.classList.add('hidden');
    alertConfirmCallback = null;
}

/**
 * --- BUG FIX ---
 * Added hideCustomConfirm() to ensure the dialog closes after the action.
 */
document.getElementById('alert-confirm-btn').addEventListener('click', () => {
    if (alertConfirmCallback) {
        alertConfirmCallback();
    }
    hideCustomConfirm(); // This was the missing line
});

document.getElementById('alert-cancel-btn').addEventListener('click', hideCustomConfirm);

function renderVerificationItem(item, type) {
    const isSupplier = type.includes('supplier');
    const itemClass = item.isNew ? 'new' : 'update';
    const itemId = isSupplier ? item.data.name : `${item.data.supplierName}-${item.data.amazonCode}`;

    let fieldsHtml = '';
    if (isSupplier) {
        fieldsHtml = `
            <div class="verification-field"><label>Email</label><input type="text" data-field="email" value="${item.data.email || ''}"> ${item.isNew ? '' : `<div class="original-value">${item.original.email || 'N/A'}</div>`}</div>
            <div class="verification-field"><label>Phone</label><input type="text" data-field="phone" value="${item.data.phone || ''}"> ${item.isNew ? '' : `<div class="original-value">${item.original.phone || 'N/A'}</div>`}</div>
            <div class="verification-field"><label>Address</label><input type="text" data-field="address" value="${item.data.address || ''}"> ${item.isNew ? '' : `<div class="original-value">${item.original.address || 'N/A'}</div>`}</div>
        `;
    } else { // Product
        fieldsHtml = `
            <div class="verification-field"><label>Product Title</label><input type="text" data-field="title" value="${item.data.title || ''}"> ${item.isNew ? '' : `<div class="original-value">${item.original.title || 'N/A'}</div>`}</div>
            <div class="verification-field"><label>Product Price</label><input type="number" step="0.01" data-field="price" value="${item.data.price || 0}"> ${item.isNew ? '' : `<div class="original-value">${item.original.price || 'N/A'}</div>`}</div>
            <div class="verification-field"><label>Supplier Code</label><input type="text" data-field="code" value="${item.data.code || ''}"> ${item.isNew ? '' : `<div class="original-value">${item.original.code || 'N/A'}</div>`}</div>
        `;
    }

    let productsHtml = '';
    if (isSupplier && item.products && item.products.length > 0) {
        productsHtml += '<div class="verification-product-list">';
        item.products.forEach(product => {
            productsHtml += renderVerificationItem(product, 'product');
        });
        productsHtml += '</div>';
    }

    return `
        <div class="verification-item ${itemClass}" data-item-id="${itemId}" data-item-type="${type}">
            <div class="verification-item-header">
                <input type="checkbox" class="item-checkbox" checked>
                <strong>${isSupplier ? item.data.name : item.data.amazonCode} (${item.isNew ? 'NEW' : 'UPDATE'})</strong>
                <span>${isSupplier ? '' : `Supplier: ${item.data.supplierName}`}</span>
            </div>
            <div class="verification-item-body">
                <div class="verification-fields">${fieldsHtml}</div>
                ${productsHtml}
            </div>
        </div>
    `;
}


export function showVerificationModal(changes) {
    let content = '';

    if (changes.newSuppliers.length > 0) {
        content += '<div class="verification-section"><h4>New Suppliers & Their Products</h4>';
        changes.newSuppliers.forEach(supplier => content += renderVerificationItem(supplier, 'supplier'));
        content += '</div>';
    }
    if (changes.updatedSuppliers.length > 0) {
        content += '<div class="verification-section"><h4>Updates to Existing Suppliers</h4>';
        changes.updatedSuppliers.forEach(supplier => content += renderVerificationItem(supplier, 'supplier-update'));
        content += '</div>';
    }
    if (changes.newProductsForExistingSuppliers.length > 0) {
        content += '<div class="verification-section"><h4>New Products for Existing Suppliers</h4>';
        changes.newProductsForExistingSuppliers.forEach(product => content += renderVerificationItem(product, 'product'));
        content += '</div>';
    }
    if (changes.updatedProducts.length > 0) {
        content += '<div class="verification-section"><h4>Updates to Existing Products</h4>';
        changes.updatedProducts.forEach(product => content += renderVerificationItem(product, 'product-update'));
        content += '</div>';
    }

    verificationModalBody.innerHTML = content;
    verificationModal.classList.remove('hidden');
}

function gatherVerifiedChanges() {
    const changesToApply = {
        newSuppliers: [], updatedSuppliers: [],
        newProducts: [], updatedProducts: []
    };

    const sections = verificationModalBody.querySelectorAll('.verification-section');
    sections.forEach(section => {
        const topLevelItems = section.querySelectorAll(':scope > .verification-item');
        
        topLevelItems.forEach(item => {
            const checkbox = item.querySelector(':scope > .verification-item-header .item-checkbox');
            if (!checkbox.checked) return;

            const type = item.dataset.itemType;
            const data = {};
            item.querySelectorAll(':scope > .verification-item-body > .verification-fields input[data-field]').forEach(input => {
                data[input.dataset.field] = input.type === 'number' ? parseFloat(input.value) : input.value;
            });

            const supplierNameText = item.querySelector('span')?.textContent.replace('Supplier: ', '').trim();
            const strongText = item.querySelector('strong').textContent.split(' ')[0];

            if (type === 'supplier') {
                changesToApply.newSuppliers.push({ name: strongText, ...data });

                const nestedProductItems = item.querySelectorAll('.verification-product-list .verification-item');
                nestedProductItems.forEach(productItem => {
                    const productCheckbox = productItem.querySelector(':scope > .verification-item-header .item-checkbox');
                    if (productCheckbox.checked) {
                        const productData = {};
                        productItem.querySelectorAll(':scope > .verification-item-body > .verification-fields input[data-field]').forEach(input => {
                            productData[input.dataset.field] = input.type === 'number' ? parseFloat(input.value) : input.value;
                        });
                        const amazonCode = productItem.querySelector('strong').textContent.split(' ')[0];
                        changesToApply.newProducts.push({ amazonCode, supplierName: strongText, ...productData });
                    }
                });
            } else if (type === 'supplier-update') {
                changesToApply.updatedSuppliers.push({ name: strongText, ...data });
            } else if (type === 'product') {
                 changesToApply.newProducts.push({ amazonCode: strongText, supplierName: supplierNameText, ...data });
            } else if (type === 'product-update') {
                 changesToApply.updatedProducts.push({ amazonCode: strongText, supplierName: supplierNameText, ...data });
            }
        });
    });

    return changesToApply;
}


document.getElementById('verification-confirm-btn').addEventListener('click', () => {
    const verifiedChanges = gatherVerifiedChanges();
    if (Object.values(verifiedChanges).every(arr => arr.length === 0)) {
        showInfoAlert("No Changes", "No items were selected to import or update.");
        return;
    }

    const summary = {
        newSuppliers: verifiedChanges.newSuppliers.length,
        newProducts: verifiedChanges.newProducts.length,
        updatedSuppliers: verifiedChanges.updatedSuppliers.length,
        updatedProducts: verifiedChanges.updatedProducts.length,
    };
    
    applyImportChanges(verifiedChanges);
    saveStateToLocalStorage(state);
    renderAll();
    verificationModal.classList.add('hidden');
    
    showInfoAlert("Import Complete", summary);
});

document.getElementById('verification-cancel-btn').addEventListener('click', () => {
    verificationModal.classList.add('hidden');
});

document.getElementById('verification-select-all').addEventListener('click', () => {
    verificationModalBody.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = true);
});

document.getElementById('verification-deselect-all').addEventListener('click', () => {
    verificationModalBody.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = false);
});