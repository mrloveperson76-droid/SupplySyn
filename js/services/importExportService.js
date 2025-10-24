// js/services/importExportService.js

import { showInfoAlert, showVerificationModal } from '../modal.js';
import { showLoader, hideLoader } from '../loader.js';

/**
 * --- DEFINITIVE FIX V8 ---
 * A final, robust comparison function to resolve all import loop scenarios.
 * This version correctly handles both numeric type coercion and empty/zero value equivalence.
 *
 * - It safely normalizes null and undefined values.
 * - For numeric comparisons, it explicitly treats empty strings as 0 before
 * parsing, ensuring that an empty cell in the spreadsheet is seen as
 * identical to a 0 in the application data.
 * - It compares the final numeric values, correctly equating `15.9` (number)
 * with `"15.90"` (string).
 *
 * @param {*} fileValue - The value from the import file.
 * @param {*} appValue - The value from the application state.
 * @param {boolean} [isNumeric=false] - A flag to indicate if the comparison is for a numeric field.
 * @returns {boolean} - True if the values are considered different, otherwise false.
 */
function areValuesDifferent(fileValue, appValue, isNumeric = false) {
    const v1 = fileValue ?? '';
    const v2 = appValue ?? '';

    if (isNumeric) {
        // Coerce empty strings and null to 0 for a reliable numeric comparison.
        const num1 = (v1 === '' || v1 === null) ? 0 : parseFloat(v1);
        const num2 = (v2 === '' || v2 === null) ? 0 : parseFloat(v2);

        // If both values, after coercion, are not valid numbers (e.g., they were text),
        // then consider them the same.
        if (isNaN(num1) && isNaN(num2)) {
            return false;
        }

        // Return true only if the final numeric values are different.
        return num1 !== num2;
    }

    // For all non-numeric fields, a simple string comparison is sufficient.
    return String(v1).trim() !== String(v2).trim();
}


/**
 * Validates the imported data before processing.
 * @param {Array} data The data from the imported file.
 * @returns {string|null} An error message string if validation fails, otherwise null.
 */
function preImportValidation(data) {
    if (!data || data.length === 0) {
        return "The file is empty or could not be read. Nothing to import.";
    }

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        const supplierName = row['Supplier Name'];
        const productTitle = row['Product Title'];
        const amazonCode = row['Amazon Code'];

        if (!supplierName || String(supplierName).trim() === '') {
            return `Validation Error on row ${rowNumber}: 'Supplier Name' is a compulsory column and cannot be empty.`;
        }

        if ((productTitle && String(productTitle).trim() !== '')) {
            if (!amazonCode || String(amazonCode).trim() === '') {
                return `Validation Error on row ${rowNumber}: 'Amazon Code' is compulsory when a 'Product Title' is present.`;
            }
        }
    }
    return null;
}


function handleFileImport(file, state) {
    if (typeof XLSX === 'undefined') {
        showInfoAlert("Import Error", "A required library (SheetJS) failed to load.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        showLoader(); // Show loader when processing starts
        // Use a timeout to allow the UI to update before the heavy processing begins
        setTimeout(() => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const validationError = preImportValidation(jsonData);
                if (validationError) {
                    showInfoAlert("Import Failed", validationError);
                    hideLoader(); // Hide loader on error
                    return;
                }
                
                processImportedData(jsonData, state);

            } catch (error) {
                console.error("Error processing file:", error);
                showInfoAlert("Import Error", "There was an error processing your file.");
            } finally {
                hideLoader(); // Always hide loader when done
            }
        }, 50); // 50ms delay
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
        
        const existingSupplier = state.suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase() && s.companyId === state.selectedCompanyId);
        
        if (!processedSupplierNames.has(supplierName.toLowerCase())) {
            const rowSupplierData = {
                name: supplierName,
                email: row['Supplier Email'],
                phone: row['Supplier Phone'],
                address: row['Supplier Address']
            };

            if (!existingSupplier) {
                changes.newSuppliers.push({ isNew: true, data: rowSupplierData, products: [] });
            } else {
                const supChanges = {};
                let hasUpdate = false;
                for (const key of ['email', 'phone', 'address']) {
                    if (areValuesDifferent(rowSupplierData[key], existingSupplier[key])) {
                        supChanges[key] = rowSupplierData[key] || '';
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
             const currentSupplierInState = existingSupplier || state.suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase() && s.companyId === state.selectedCompanyId);
             const existingProduct = currentSupplierInState 
                ? state.products.find(p => p.supplierId === currentSupplierInState.id && p.amazonCode?.toLowerCase() === amazonCode.toLowerCase())
                : null;

            const rowProductData = {
                title: row['Product Title'],
                price: row['Product Price'],
                code: row['Product Code (Supplier)'],
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

              if (areValuesDifferent(rowProductData.price, existingProduct.price, true)) {
                     prodChanges.price = parseFloat(rowProductData.price) || 0;
                     hasUpdate = true;
                }
                if (areValuesDifferent(rowProductData.title, existingProduct.title)) {
                     prodChanges.title = rowProductData.title || 'N/A';
                     hasUpdate = true;
                }
                 if (areValuesDifferent(rowProductData.code, existingProduct.code)) {
                     prodChanges.code = rowProductData.code || '';
                     hasUpdate = true;
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

    if (!userFileName || userFileName.trim() === "") return;

    if (!userFileName.toLowerCase().endsWith('.xlsx')) {
        userFileName += '.xlsx';
    }

    const exportData = [];
    const companySuppliers = state.suppliers.filter(s => s.companyId === state.selectedCompanyId);

    companySuppliers.forEach(supplier => {
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
                'Supplier Address': supplier.address
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