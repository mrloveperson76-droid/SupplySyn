// js/services/importExportService.js

import { showInfoAlert, showVerificationModal } from '../modal.js';

/**
 * --- NEW FUNCTION ---
 * Validates the imported data before processing.
 * Checks for mandatory fields and correct data types.
 * @param {Array} data The data from the imported file.
 * @returns {string|null} An error message string if validation fails, otherwise null.
 */
function preImportValidation(data) {
    if (!data || data.length === 0) {
        return "The file is empty or could not be read. Nothing to import.";
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel rows are 1-based, plus header

        const supplierName = row['Supplier Name'];
        const productTitle = row['Product Title'];

        // Rule 1: Supplier Name is mandatory
        if (!supplierName || String(supplierName).trim() === '') {
            return `Validation Error on row ${rowNumber}: 'Supplier Name' cannot be empty.`;
        }
        // Rule 2: Supplier Name cannot be a number
        if (!isNaN(supplierName)) {
            return `Validation Error on row ${rowNumber}: 'Supplier Name' cannot be a number.`;
        }

        // If a product title exists, it must be valid.
        if (productTitle !== undefined && String(productTitle).trim() !== '') {
             // Rule 3: Product Title cannot be a number
            if (!isNaN(productTitle)) {
                return `Validation Error on row ${rowNumber}: 'Product Title' cannot be a number.`;
            }
        }
    }

    return null; // All checks passed
}


function handleFileImport(file, state) {
    if (typeof XLSX === 'undefined') {
        console.error("SheetJS library (XLSX) not found. Make sure the library is loaded correctly.");
        showInfoAlert("Import Error", "A required library (SheetJS) failed to load. Please check your internet connection and try again.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // --- UPDATED: Run pre-import validation first ---
            const validationError = preImportValidation(jsonData);
            if (validationError) {
                showInfoAlert("Import Failed", validationError);
                return;
            }
            
            processImportedData(jsonData, state);

        } catch (error) {
            console.error("Error processing file:", error);
            showInfoAlert("Import Error", "There was an error processing your file. Please ensure it's a valid Excel or CSV file.");
        }
    };
    reader.readAsArrayBuffer(file);
}

function processImportedData(data, state) {
    const changes = {
        newSuppliers: [],
        updatedSuppliers: [],
        newProductsForExistingSuppliers: [],
        updatedProducts: []
    };

    const processedSupplierNames = new Set();
    const processedProductKeys = new Set();

    data.forEach(row => {
        const supplierName = row['Supplier Name']?.trim();
        if (!supplierName) return;

        const amazonCode = row['Amazon Code']?.toString().trim();
        const productKey = `${supplierName.toLowerCase()}-${amazonCode}`;
        
        const existingSupplier = state.suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
        
        if (!processedSupplierNames.has(supplierName.toLowerCase())) {
            const rowSupplierData = {
                name: supplierName,
                email: row['Supplier Email'] || '',
                phone: row['Supplier Phone'] || '',
                address: row['Supplier Address'] || ''
            };

            if (!existingSupplier) {
                changes.newSuppliers.push({ isNew: true, data: rowSupplierData, products: [] });
            } else {
                const supChanges = {};
                let hasUpdate = false;
                for (const key of ['email', 'phone', 'address']) {
                    if (rowSupplierData[key] && rowSupplierData[key] !== existingSupplier[key]) {
                        supChanges[key] = rowSupplierData[key];
                        hasUpdate = true;
                    }
                }
                if (hasUpdate) {
                    changes.updatedSuppliers.push({
                        isNew: false,
                        data: { ...existingSupplier, ...supChanges },
                        original: { ...existingSupplier }
                    });
                }
            }
            processedSupplierNames.add(supplierName.toLowerCase());
        }

        if (amazonCode && !processedProductKeys.has(productKey)) {
             const existingProduct = state.products.find(p => {
                if (p.amazonCode?.toLowerCase() !== amazonCode.toLowerCase()) return false;
                const pSupplier = state.suppliers.find(s => s.id === p.supplierId);
                return pSupplier && pSupplier.name.toLowerCase() === supplierName.toLowerCase();
            });

            const rowProductData = {
                title: row['Product Title'] || 'N/A',
                price: parseFloat(row['Product Price']) || 0,
                code: row['Product Code (Supplier)']?.toString() || '',
                amazonCode: amazonCode,
                supplierName: supplierName
            };

            if (!existingProduct) {
                const newProdPayload = { isNew: true, data: rowProductData };
                const newSupplierParent = changes.newSuppliers.find(s => s.data.name.toLowerCase() === supplierName.toLowerCase());
                if (newSupplierParent) {
                    newSupplierParent.products.push(newProdPayload);
                } else {
                    changes.newProductsForExistingSuppliers.push(newProdPayload);
                }
            } else {
                const prodChanges = {};
                let hasUpdate = false;
                for (const key of ['title', 'price', 'code']) {
                     if (rowProductData[key] && rowProductData[key].toString() !== existingProduct[key].toString()) {
                        prodChanges[key] = rowProductData[key];
                        hasUpdate = true;
                    }
                }
                if (hasUpdate) {
                    changes.updatedProducts.push({
                        isNew: false,
                        data: { ...existingProduct, ...prodChanges, supplierName },
                        original: { ...existingProduct }
                    });
                }
            }
            processedProductKeys.add(productKey);
        }
    });

    const totalChanges = changes.newSuppliers.length + changes.updatedSuppliers.length +
        changes.newProductsForExistingSuppliers.length + changes.updatedProducts.length;

    if (totalChanges === 0) {
        showInfoAlert("Import Complete", "No new data or updates found. Nothing was imported.");
    } else {
        showVerificationModal(changes);
    }
}

function handleDataExport(state) {
    const defaultFileName = `SupplySync_Export_${new Date().toISOString().slice(0, 10)}`;
    let userFileName = prompt("Please update the export file name:", defaultFileName);

    if (userFileName === null || userFileName.trim() === "") {
        console.log("Export cancelled by user.");
        return;
    }

    if (!userFileName.toLowerCase().endsWith('.xlsx')) {
        userFileName += '.xlsx';
    }

    const exportData = [];
    state.suppliers.forEach(supplier => {
        const productsOfSupplier = state.products.filter(p => p.supplierId === supplier.id);

        if (productsOfSupplier.length > 0) {
            productsOfSupplier.forEach(product => {
                exportData.push({
                    'Supplier Name': supplier.name,
                    'Supplier Email': supplier.email,
                    'Supplier Phone': supplier.phone,
                    'Supplier Address': supplier.address,
                    'Product Title': product.title,
                    'Product Price': product.price,
                    'Product Code (Supplier)': product.code,
                    'Amazon Code': product.amazonCode
                });
            });
        } else {
            exportData.push({
                'Supplier Name': supplier.name,
                'Supplier Email': supplier.email,
                'Supplier Phone': supplier.phone,
                'Supplier Address': supplier.address,
                'Product Title': '',
                'Product Price': '',
                'Product Code (Supplier)': '',
                'Amazon Code': ''
            });
        }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SupplySync Data");
    
    XLSX.writeFile(workbook, userFileName);
}

export function initializeImportExportEventListeners(state) {
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const fileInput = document.getElementById('import-file-input');

    importBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            handleFileImport(file, state);
        }
        event.target.value = null;
    });

    exportBtn.addEventListener('click', () => handleDataExport(state));
}