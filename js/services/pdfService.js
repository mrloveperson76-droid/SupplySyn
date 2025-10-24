// js/services/pdfService.js

/**
 * Internal function to generate the core PDF layout.
 * @param {object} doc - The jsPDF document instance.
 * @param {object} data - The data for the PDF.
 */
function _generatePdfLayout(doc, { company, supplier, orderDetails, items, isReprint = false }) {
    let y = 20;

    // --- Add Company Header ---
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(company.name || "Purchase Order", 14, y);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (company.address) {
        y += 6;
        doc.text(company.address, 14, y);
    }
    if (company.email || company.phone) {
        y += 5;
        doc.text(`${company.email || ''} | ${company.phone || ''}`, 14, y);
    }
    if (company.website) {
        y += 5;
        doc.text(company.website, 14, y);
    }
    y += 10;

    doc.setFontSize(18);
    doc.text(isReprint ? "Purchase Order (Reprint)" : "Purchase Order", 105, y, { align: "center" });
    y += 15;

    // --- Supplier Details ---
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

    // --- Order Metadata ---
    doc.text(`Order #: ${orderDetails.orderNumber || ''}`, 14, y);
    doc.text(`Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}`, 140, y);
    y += 7;
    doc.text(`Payment: ${orderDetails.paymentMethod || 'N/A'}`, 14, y);
    
    doc.setFont(undefined, 'bold');
    doc.text(`Status:`, 140, y);
    doc.setTextColor(orderDetails.isPaid ? '#34c759' : '#ff3b30');
    doc.text(orderDetails.isPaid ? 'PAID' : 'UNPAID', 158, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    y += 15;

    // --- Table Header ---
    doc.setFont(undefined, 'bold');
    doc.text("Item Title", 14, y);
    doc.text("Supplier Code", 75, y);
    doc.text("Amazon Code", 110, y);
    doc.text("Qty", 145, y);
    doc.text("Unit Price", 175, y, { align: 'right' });
    doc.text("Net Total", 196, y, { align: 'right' });
    y += 5;
    doc.line(14, y, 196, y);
    y += 4;
    doc.setFont(undefined, 'normal');

    // --- Table Rows ---
    let netTotal = 0;
    items.forEach(item => {
        const itemTotal = item.product.price * item.quantity;
        netTotal += itemTotal;
        const startY = y;
        const titleLines = doc.splitTextToSize(item.product.title || '', 60);
        doc.text(titleLines, 14, y);
        let maxLines = titleLines.length;
        const supCodeLines = doc.splitTextToSize(item.product.code || '', 35);
        doc.text(supCodeLines, 75, y);
        maxLines = Math.max(maxLines, supCodeLines.length);
        const amzCodeLines = doc.splitTextToSize(item.product.amazonCode || '', 35);
        doc.text(amzCodeLines, 110, y);
        maxLines = Math.max(maxLines, amzCodeLines.length);
        doc.text(item.quantity.toString(), 147, y, { align: 'center' });
        doc.text(`$${item.product.price.toFixed(2)}`, 175, y, { align: 'right' });
        doc.text(`$${itemTotal.toFixed(2)}`, 196, y, { align: 'right' });
        y = startY + (maxLines * 7) + 3;
    });

    // --- Totals ---
    doc.line(14, y, 196, y);
    y += 7;

    doc.setFont(undefined, 'bold');
    doc.text(`Net Total:`, 140, y);
    doc.text(`$${netTotal.toFixed(2)}`, 196, y, { align: 'right' });
    y += 7;

    const vatAmount = orderDetails.totalPrice ? (orderDetails.totalPrice - netTotal) : (netTotal * 0.20);

    if (orderDetails.vatEnabled || vatAmount > 0.005) { // Check if VAT was applied
        doc.text(`VAT (20%):`, 140, y);
        doc.text(`$${vatAmount.toFixed(2)}`, 196, y, { align: 'right' });
        y += 7;
        doc.setFontSize(14);
        const grandTotal = netTotal + vatAmount;
        doc.text(`Grand Total:`, 140, y);
        doc.text(`$${grandTotal.toFixed(2)}`, 196, y, { align: 'right' });
    }
}


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

    const company = state.companies.find(c => c.id === state.selectedCompanyId);
    const supplier = state.suppliers.find(s => s.id === state.selectedSupplierId);
    const items = state.cart.map(cartItem => ({
        ...cartItem,
        product: state.products.find(p => p.id === cartItem.productId)
    })).filter(item => item.product); // Ensure product exists

    const data = {
        company,
        supplier,
        orderDetails: { ...state.orderDetails, vatEnabled: state.vatEnabled },
        items
    };
    
    _generatePdfLayout(doc, data);

    const fileName = `Order_${state.orderDetails.orderNumber || 'General'}_${Date.now()}.pdf`;
    doc.save(fileName);
}

export function generatePdfFromHistory(order, allProducts, allSuppliers, allCompanies) {
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
    
    const company = allCompanies.find(c => c.id === order.companyId);
    const supplier = allSuppliers.find(s => s.id === order.supplierId);
    const items = order.items.map(item => ({
        ...item,
        product: allProducts.find(p => p.id === item.productId)
    })).filter(item => item.product);

    const data = {
        company,
        supplier,
        orderDetails: order,
        items,
        isReprint: true
    };
    
    _generatePdfLayout(doc, data);
    
    const fileName = `Reprint_Order_${order.orderNumber || 'General'}_${Date.now()}.pdf`;
    doc.save(fileName);
}