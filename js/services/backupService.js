// js/services/backupService.js

/**
 * Export all application data as a JSON backup file
 * @param {object} state - The application state object
 */
export function exportBackup(state) {
    try {
        const backupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            companies: state.companies,
            suppliers: state.suppliers,
            products: state.products,
            orderHistory: state.orderHistory
        };
        
        const defaultFileName = `SupplySync_Backup_${new Date().toISOString().slice(0, 10)}`;
        let userFileName = prompt("Please update the export file name:", defaultFileName);

        if (!userFileName || userFileName.trim() === "") return;

        if (!userFileName.toLowerCase().endsWith('.json')) {
            userFileName += '.json';
        }
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = userFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Backup exported successfully!');
    } catch (error) {
        console.error('Backup export failed:', error);
        alert('Failed to export backup. Please check the console for details.');
    }
}

/**
 * Import backup data from a JSON file
 * @param {File} file - The JSON backup file
 * @param {object} state - The application state object
 * @param {function} renderAndSave - Function to re-render and save the application state
 */
export function importBackup(file, state, renderAndSave) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // Validate backup data
            if (!backupData.version || !backupData.companies || !backupData.suppliers || !backupData.products) {
                alert('Invalid backup file format.');
                return;
            }
            
            // Confirm import
            if (!confirm('This will replace all current data with the backup data. Are you sure you want to continue?')) {
                return;
            }
            
            // Restore data
            state.companies = backupData.companies;
            state.suppliers = backupData.suppliers;
            state.products = backupData.products;
            state.orderHistory = backupData.orderHistory || [];
            
            // Set default company if none selected
            if (!state.companies.some(c => c.id === state.selectedCompanyId)) {
                state.selectedCompanyId = state.companies[0]?.id || 1;
            }
            
            // Clear other state properties
            state.cart = [];
            state.selectedSupplierId = null;
            state.editingOrderId = null;
            
            // Re-render and save
            renderAndSave();
            
            alert('Backup imported successfully!');
        } catch (error) {
            console.error('Backup import failed:', error);
            alert('Failed to import backup. Please check the console for details.');
        }
    };
    reader.readAsText(file);
}