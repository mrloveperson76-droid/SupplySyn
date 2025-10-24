// js/services/pdfService.js

export function generatePdf(state) {
    if (state.cart.length === 0) {
        alert("Cart is empty.");
        return;
    }
    if (typeof window.jspdf === 'undefined') {
        alert("Error: PDF library is missing.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const supplier = state.suppliers.find(s => s.id === state.selectedSupplierId);
    const { orderNumber, orderDate, paymentMethod, isPaid } = state.orderDetails;
    let netTotal = 0;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Purchase Order", 105, y, { align: "center" });
    y += 15;
    
    // --- Supplier Details Section ---
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Supplier Details:", 14, y);
    y += 7;
    doc.setFont(undefined, 'normal');

    if (supplier) {
        if (supplier.name) { doc.text(`Name: ${supplier.name}`, 14, y); y += 7; }
        if (supplier.address) {
            const addressLines = doc.splitTextToSize(`Address: ${supplier.address}`, 180);
            doc.text(addressLines, 14, y);
            y += (addressLines.length * 7);
        }
        if (supplier.email) { doc.text(`Email: ${supplier.email}`, 14, y); y += 7; }
        if (supplier.phone) { doc.text(`Phone: ${supplier.phone}`, 14, y); y += 7; }
    } else {
        doc.text("No supplier selected.", 14, y); y += 7;
    }
    y += 5;

    // --- Order Details Section ---
    doc.text(`Order #: ${orderNumber || ''}`, 14, y);
    doc.text(`Date: ${new Date(orderDate).toLocaleDateString()}`, 140, y);
    y += 7;
    doc.text(`Payment: ${paymentMethod}`, 14, y);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Status:`, 140, y);
    if (isPaid) doc.setTextColor(0, 150, 0);
    else doc.setTextColor(255, 0, 0);
    doc.text(isPaid ? 'PAID' : 'UNPAID', 158, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    y += 15;

    // --- START: Corrected Table Header ---
    doc.setFont(undefined, 'bold');
    doc.text("Item Title", 14, y);
    doc.text("Supplier Code", 75, y);
    doc.text("Amazon Code", 110, y);
    doc.text("Qty", 145, y);
    doc.text("Unit Price", 175, y, { align: 'right' }); // FIX: Pushed further right
    doc.text("Net Total", 196, y, { align: 'right' });
    y += 5;
    doc.line(14, y, 196, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    // --- END: Corrected Table Header ---

    // --- START: Corrected Table Rows ---
    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (!product) return;

        const itemTotal = product.price * item.quantity;
        netTotal += itemTotal;
        
        const startY = y;

        const titleLines = doc.splitTextToSize(product.title || '', 60);
        doc.text(titleLines, 14, y);
        let maxLines = titleLines.length;

        const supCodeLines = doc.splitTextToSize(product.code || '', 35);
        doc.text(supCodeLines, 75, y);
        maxLines = Math.max(maxLines, supCodeLines.length);
        
        const amzCodeLines = doc.splitTextToSize(product.amazonCode || '', 35);
        doc.text(amzCodeLines, 110, y);
        maxLines = Math.max(maxLines, amzCodeLines.length);

        doc.text(item.quantity.toString(), 147, y, { align: 'center' });
        doc.text(`$${product.price.toFixed(2)}`, 175, y, { align: 'right' }); // FIX: Pushed further right
        doc.text(`$${itemTotal.toFixed(2)}`, 196, y, { align: 'right' });
        
        y = startY + (maxLines * 7) + 3; 
    });
    // --- END: Corrected Table Rows ---

    doc.line(14, y, 196, y);
    y += 7;

    // --- Totals Section ---
    doc.setFont(undefined, 'bold');
    doc.text(`Net Total:`, 140, y);
    doc.text(`$${netTotal.toFixed(2)}`, 196, y, { align: 'right' });
    y += 7;

    if (state.vatEnabled) {
        const vatAmount = netTotal * 0.20;
        doc.text(`VAT (20%):`, 140, y);
        doc.text(`$${vatAmount.toFixed(2)}`, 196, y, { align: 'right' });
        y += 7;
        
        doc.setFontSize(14);
        const grandTotal = netTotal + vatAmount;
        doc.text(`Grand Total:`, 140, y);
        doc.text(`$${grandTotal.toFixed(2)}`, 196, y, { align: 'right' });
    }

    const fileName = `Order_${orderNumber || 'General'}_${Date.now()}.pdf`;
    doc.save(fileName);
}
// ADD THIS NEW FUNCTION to pdfService.js

export function generatePdfFromHistory(order, allProducts, allSuppliers) {
    if (!order || order.items.length === 0) {
        alert("Cannot generate PDF. The selected order has no items.");
        return;
    }
    if (typeof window.jspdf === 'undefined') {
        alert("Error: PDF library is missing.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const supplier = allSuppliers.find(s => s.id === order.supplierId);
    let netTotal = 0;
    let y = 20;

    doc.setFontSize(18);
    doc.text("Purchase Order (Reprint)", 105, y, { align: "center" });
    y += 15;

    // Details are sourced from the 'order' object, not the global state
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Supplier Details:", 14, y);
    y += 7;
    doc.setFont(undefined, 'normal');

    if (supplier) {
        if (supplier.name) { doc.text(`Name: ${supplier.name}`, 14, y); y += 7; }
        if (supplier.address) {
            const addressLines = doc.splitTextToSize(`Address: ${supplier.address}`, 180);
            doc.text(addressLines, 14, y);
            y += (addressLines.length * 7);
        }
    }
    y += 5;

    doc.text(`Order #: ${order.orderNumber || ''}`, 14, y);
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 140, y);
    y += 7;
    doc.text(`Payment: ${order.paymentMethod || 'N/A'}`, 14, y);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Status:`, 140, y);
    if (order.isPaid) doc.setTextColor(0, 150, 0);
    else doc.setTextColor(255, 0, 0);
    doc.text(order.isPaid ? 'PAID' : 'UNPAID', 158, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    y += 15;

    doc.setFont(undefined, 'bold');
    doc.text("Item Title", 14, y);
    doc.text("Qty", 145, y);
    doc.text("Unit Price", 175, y, { align: 'right' });
    doc.text("Net Total", 196, y, { align: 'right' });
    y += 5;
    doc.line(14, y, 196, y);
    y += 4;
    doc.setFont(undefined, 'normal');

    order.items.forEach(item => {
        const product = allProducts.find(p => p.id === item.productId);
        if (!product) return;

        const itemTotal = product.price * item.quantity;
        netTotal += itemTotal;
        const startY = y;
        const titleLines = doc.splitTextToSize(product.title || '', 120);
        doc.text(titleLines, 14, y);
        
        doc.text(item.quantity.toString(), 147, y, { align: 'center' });
        doc.text(`$${product.price.toFixed(2)}`, 175, y, { align: 'right' });
        doc.text(`$${itemTotal.toFixed(2)}`, 196, y, { align: 'right' });
        
        y = startY + (titleLines.length * 7) + 3;
    });

    doc.line(14, y, 196, y);
    y += 7;

    // Totals are calculated from the historical order items
    // This example assumes VAT status at the time of reprint, not original order
    const vatAmount = (order.totalPrice - netTotal).toFixed(2);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Net Total:`, 140, y);
    doc.text(`$${netTotal.toFixed(2)}`, 196, y, { align: 'right' });
    y += 7;

    if (parseFloat(vatAmount) > 0) {
        doc.text(`VAT (20%):`, 140, y);
        doc.text(`$${vatAmount}`, 196, y, { align: 'right' });
        y += 7;
    }
    
    doc.setFontSize(14);
    doc.text(`Grand Total:`, 140, y);
    doc.text(`$${order.totalPrice.toFixed(2)}`, 196, y, { align: 'right' });

    const fileName = `Reprint_Order_${order.orderNumber || 'General'}_${Date.now()}.pdf`;
    doc.save(fileName);
}