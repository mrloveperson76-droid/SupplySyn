// js/dashboard.js
import { state } from './state.js';

// Function to render the dashboard
export function renderDashboard() {
    // Clear selectedSupplierId when viewing dashboard to ensure we see all data
    state.selectedSupplierId = null;
    
    // Render company filter
    renderDashboardCompanyFilter();
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Render charts
    renderCharts();
    
    // Render recent orders
    renderRecentOrders();
    
    // Add click event listeners to summary cards
    addSummaryCardEventListeners();
}

// Function to add event listeners to summary cards
function addSummaryCardEventListeners() {
    // Add click event listener to Total Products card
    const totalProductsCard = document.querySelector('#total-products').closest('.summary-card');
    if (totalProductsCard) {
        totalProductsCard.addEventListener('click', () => {
            // Import the listeners module to switch views
            import('./listeners.js').then(listeners => {
                // Switch to the products view
                listeners.switchView('products');
                
                // Reset the supplier filter to show all items
                const supplierFilter = document.getElementById('supplier-filter');
                if (supplierFilter) {
                    supplierFilter.value = '';
                }
                
                // Trigger a re-render to apply the filter
                import('./ui.js').then(ui => {
                    ui.renderAll();
                });
            });
        });
    }
    
    // Add click event listener to Total Suppliers card
    const totalSuppliersCard = document.querySelector('#total-suppliers').closest('.summary-card');
    if (totalSuppliersCard) {
        totalSuppliersCard.addEventListener('click', () => {
            // Import the listeners module to switch views
            import('./listeners.js').then(listeners => {
                // Switch to the suppliers view
                listeners.switchView('suppliers');
            });
        });
    }
    
    // Add click event listener to Total Orders card
    const totalOrdersCard = document.querySelector('#total-orders').closest('.summary-card');
    if (totalOrdersCard) {
        totalOrdersCard.addEventListener('click', () => {
            // Import the listeners module to switch views
            import('./listeners.js').then(listeners => {
                // Switch to the history view
                listeners.switchView('history');
            });
        });
    }
    
    // Add click event listener to Total Sales card
    const totalSalesCard = document.querySelector('#total-sales').closest('.summary-card');
    if (totalSalesCard) {
        totalSalesCard.addEventListener('click', () => {
            showSalesDetailsModal();
        });
    }
    
    // Add click event listener to Total VAT card
    const totalVATCard = document.querySelector('#total-vat').closest('.summary-card');
    if (totalVATCard) {
        totalVATCard.addEventListener('click', () => {
            showVATDetailsModal();
        });
    }
    
    // Add click event listener to Pending Payments card
    const pendingPaymentsCard = document.querySelector('#pending-payments').closest('.summary-card');
    if (pendingPaymentsCard) {
        pendingPaymentsCard.addEventListener('click', () => {
            showPendingPaymentsModal();
        });
    }
}

// Function to view order details
function viewOrderDetails(orderId, orderNumber) {
    // Import the listeners module to switch views
    import('./listeners.js').then(listeners => {
        // Switch to the history view
        listeners.switchView('history');
        
        // After a short delay to ensure the view is rendered, search for the order and expand details
        setTimeout(() => {
            // If we have an order number, search for it
            if (orderNumber) {
                const searchInput = document.getElementById('history-search');
                if (searchInput) {
                    searchInput.value = orderNumber;
                    // Trigger the search
                    const event = new Event('input', { bubbles: true });
                    searchInput.dispatchEvent(event);
                }
            }
            
            // Find the order in the history list
            const order = state.orderHistory.find(o => o.id === orderId);
            if (order) {
                // Wait a bit more for the list to be rendered after search
                setTimeout(() => {
                    // Find the view button for this order and click it
                    const viewBtn = document.querySelector(`.view-btn[data-id="${orderId}"]`);
                    if (viewBtn) {
                        viewBtn.click();
                    } else {
                        // If we can't find the specific view button, toggle the order details using UI function
                        import('./ui.js').then(ui => {
                            // Check if the details container exists and its current state
                            const detailsContainer = document.getElementById(`order-details-${orderId}`);
                            if (detailsContainer) {
                                // Toggle the display
                                if (detailsContainer.style.display === 'none' || detailsContainer.style.display === '') {
                                    detailsContainer.style.display = 'block';
                                    detailsContainer.innerHTML = ui.generateOrderDetailsHTML(order);
                                } else {
                                    detailsContainer.style.display = 'none';
                                }
                            } else {
                                // If no container exists, create it and show details
                                ui.toggleOrderDetails(orderId, order);
                            }
                        });
                    }
                }, 100);
            }
        }, 100);
    });
}

// Function to render company filter for dashboard
function renderDashboardCompanyFilter() {
    const companyFilter = document.getElementById('dashboard-company-filter');
    if (!companyFilter) return;
    
    companyFilter.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Companies';
    companyFilter.appendChild(defaultOption);
    
    // Add company options
    state.companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        option.selected = state.selectedCompanyId === company.id;
        companyFilter.appendChild(option);
    });
    
    // Add event listener
    companyFilter.addEventListener('change', (e) => {
        const selectedCompanyId = e.target.value ? Number(e.target.value) : null;
        if (selectedCompanyId && selectedCompanyId !== state.selectedCompanyId) {
            state.selectedCompanyId = selectedCompanyId;
            renderDashboard();
        }
    });
}

// Function to calculate and update dashboard stats
function updateDashboardStats() {
    const selectedCompanyId = state.selectedCompanyId;
    
    // Filter data by selected company
    const companySuppliers = state.suppliers.filter(s => s.companyId === selectedCompanyId);
    const companyProducts = state.products.filter(p => p.companyId === selectedCompanyId);
    // For dashboard, we want to show all orders for the company, not just for a specific supplier
    const companyOrders = state.orderHistory.filter(o => o.companyId === selectedCompanyId);
    
    // Calculate stats
    const totalSuppliers = companySuppliers.length;
    const totalProducts = companyProducts.length;
    const totalOrders = companyOrders.length;
    
    // Calculate total sales and VAT
    let totalSales = 0;
    let totalVAT = 0;
    let pendingOrdersCount = 0;
    let pendingOrdersAmount = 0;
    
    companyOrders.forEach(order => {
        totalSales += order.totalPrice || 0;
        if (!order.isPaid) {
            pendingOrdersCount++;
            pendingOrdersAmount += order.totalPrice || 0;
        }
    });
    
    // Calculate VAT (20% of sales)
    totalVAT = totalSales * 0.20;
    
    // Update UI elements
    document.getElementById('total-suppliers').textContent = totalSuppliers;
    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-sales').textContent = `$${totalSales.toFixed(2)}`;
    document.getElementById('total-vat').textContent = `$${totalVAT.toFixed(2)}`;
    document.getElementById('pending-payments').textContent = `${pendingOrdersCount} orders ($${pendingOrdersAmount.toFixed(2)})`;
}

// Function to render charts
function renderCharts() {
    const selectedCompanyId = state.selectedCompanyId;
    
    // Filter data by selected company
    const companySuppliers = state.suppliers.filter(s => s.companyId === selectedCompanyId);
    const companyProducts = state.products.filter(p => p.companyId === selectedCompanyId);
    // For charts, we want to show all orders for the company, not just for a specific supplier
    const companyOrders = state.orderHistory.filter(o => o.companyId === selectedCompanyId);
    
    // Render orders per supplier chart
    renderOrdersPerSupplierChart(companyOrders, companySuppliers);
    
    // Render products distribution chart
    renderProductsDistributionChart(companyProducts, companySuppliers);
    
    // Render monthly sales trend chart
    renderMonthlySalesChart(companyOrders);
}

// Function to render orders per supplier chart
function renderOrdersPerSupplierChart(orders, suppliers) {
    const ctx = document.getElementById('orders-per-supplier-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Calculate orders per supplier
    const supplierOrderCount = {};
    
    orders.forEach(order => {
        const supplierName = order.supplierName || 'Unknown';
        supplierOrderCount[supplierName] = (supplierOrderCount[supplierName] || 0) + 1;
    });
    
    // Prepare data for chart
    const labels = Object.keys(supplierOrderCount);
    const data = Object.values(supplierOrderCount);
    
    // Create chart
    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders',
                data: data,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Orders: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Function to render products distribution chart
function renderProductsDistributionChart(products, suppliers) {
    const ctx = document.getElementById('products-distribution-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Calculate products per supplier
    const supplierProductCount = {};
    
    products.forEach(product => {
        // Find supplier for this product
        const supplier = suppliers.find(s => s.id === product.supplierId);
        const supplierName = supplier ? supplier.name : 'Unknown';
        supplierProductCount[supplierName] = (supplierProductCount[supplierName] || 0) + 1;
    });
    
    // Prepare data for chart
    const labels = Object.keys(supplierProductCount);
    const data = Object.values(supplierProductCount);
    
    // Create chart
    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}`;
                        }
                    }
                }
            }
        }
    });
}

// Function to render monthly sales trend chart
function renderMonthlySalesChart(orders) {
    const ctx = document.getElementById('monthly-sales-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (ctx.chart) {
        ctx.chart.destroy();
    }
    
    // Group orders by month
    const monthlySales = {};
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const monthYear = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlySales[monthYear]) {
            monthlySales[monthYear] = 0;
        }
        
        monthlySales[monthYear] += order.totalPrice || 0;
    });
    
    // Sort by month
    const sortedMonths = Object.keys(monthlySales).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    });
    const data = sortedMonths.map(month => monthlySales[month]);
    
    // Create chart
    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales ($)',
                data: data,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Sales: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to render recent orders
function renderRecentOrders() {
    const selectedCompanyId = state.selectedCompanyId;
    const companyOrders = state.orderHistory.filter(o => o.companyId === selectedCompanyId);
    
    // Sort orders by date (newest first)
    const sortedOrders = [...companyOrders].sort((a, b) => 
        new Date(b.orderDate) - new Date(a.orderDate)
    );
    
    // Get last 5 orders
    const recentOrders = sortedOrders.slice(0, 5);
    
    const ordersList = document.getElementById('recent-orders-list');
    if (!ordersList) return;
    
    if (recentOrders.length === 0) {
        ordersList.innerHTML = '<div class="empty-state">No orders found.</div>';
        return;
    }
    
    ordersList.innerHTML = '';
    
    recentOrders.forEach(order => {
        const orderEl = document.createElement('div');
        orderEl.className = 'list-item';
        // Make the entire order card clickable
        orderEl.dataset.orderId = order.id;
        orderEl.dataset.orderNumber = order.orderNumber || '';
        
        // Format date
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString();
        
        // Payment status
        const paymentStatus = order.isPaid ? 'Paid' : 'Unpaid';
        const paymentClass = order.isPaid ? 'paid' : 'unpaid';
        
        orderEl.innerHTML = `
            <div class="order-info">
                <strong>${order.orderNumber || 'N/A'}</strong>
                <span>${order.supplierName || 'N/A'}</span>
            </div>
            <div class="order-date">${formattedDate}</div>
            <div class="order-amount">$${(order.totalPrice || 0).toFixed(2)}</div>
            <div class="order-actions">
                <button class="button toggle-payment-btn ${paymentClass}" data-order-id="${order.id}" data-is-paid="${order.isPaid}">${paymentStatus}</button>
            </div>
        `;
        
        ordersList.appendChild(orderEl);
    });
    
    // Add event listeners for clicking on the entire order card
    const orderCards = ordersList.querySelectorAll('.list-item');
    orderCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons
            if (e.target.closest('button')) {
                return;
            }
            
            const orderId = Number(card.dataset.orderId);
            const orderNumber = card.dataset.orderNumber;
            viewOrderDetails(orderId, orderNumber);
        });
    });
    
    // Add event listeners for toggle payment buttons in recent orders
    const togglePaymentButtons = ordersList.querySelectorAll('.toggle-payment-btn');
    togglePaymentButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = Number(e.target.dataset.orderId);
            const isPaid = e.target.dataset.isPaid === 'true';
            togglePaymentStatus(orderId, !isPaid);
        });
    });
}

// Function to toggle payment status
function togglePaymentStatus(orderId, newPaymentStatus) {
    // Find the order in the state
    const order = state.orderHistory.find(o => o.id === orderId);
    if (order) {
        // Update the payment status
        order.isPaid = newPaymentStatus;
        
        // Re-render the dashboard to update the UI
        renderDashboard();
    }
}

// Function to show sales details in a modal
function showSalesDetailsModal() {
    const selectedCompanyId = state.selectedCompanyId;
    // Show all orders for the company, not just for a specific supplier
    const companyOrders = state.orderHistory.filter(o => o.companyId === selectedCompanyId);
    
    // Calculate total sales
    let totalSales = 0;
    companyOrders.forEach(order => {
        totalSales += order.totalPrice || 0;
    });
    
    // Create modal content
    let ordersHTML = '';
    companyOrders.forEach(order => {
        ordersHTML += `
            <tr>
                <td>${order.orderNumber || 'N/A'}</td>
                <td>${order.supplierName || 'N/A'}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>$${(order.totalPrice || 0).toFixed(2)}</td>
                <td><button class="button view-order-btn" data-order-id="${order.id}" data-order-number="${order.orderNumber}">View</button></td>
            </tr>
        `;
    });
    
    const modalHTML = `
        <div class="modal-content" style="max-width: 800px; width: 90%;">
            <h3>Sales Details</h3>
            <div class="modal-form-field">
                <p><strong>Total Sales: $${totalSales.toFixed(2)}</strong></p>
            </div>
            <div class="modal-form-field">
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Supplier</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersHTML || '<tr><td colspan="5">No orders found</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="modal-actions">
                <button id="close-sales-modal" class="secondary-button">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    showCustomModal(modalHTML, 'close-sales-modal');
}

// Function to show VAT details in a modal
function showVATDetailsModal() {
    const selectedCompanyId = state.selectedCompanyId;
    // Show all orders for the company, not just for a specific supplier
    const companyOrders = state.orderHistory.filter(o => o.companyId === selectedCompanyId);
    
    // Calculate total sales and VAT
    let totalSales = 0;
    companyOrders.forEach(order => {
        totalSales += order.totalPrice || 0;
    });
    
    const totalVAT = totalSales * 0.20;
    
    // Create modal content
    let ordersHTML = '';
    companyOrders.forEach(order => {
        const orderVAT = (order.totalPrice || 0) * 0.20;
        ordersHTML += `
            <tr>
                <td>${order.orderNumber || 'N/A'}</td>
                <td>${order.supplierName || 'N/A'}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>$${(order.totalPrice || 0).toFixed(2)}</td>
                <td>$${orderVAT.toFixed(2)}</td>
                <td><button class="button view-order-btn" data-order-id="${order.id}" data-order-number="${order.orderNumber}">View</button></td>
            </tr>
        `;
    });
    
    const modalHTML = `
        <div class="modal-content" style="max-width: 900px; width: 90%;">
            <h3>VAT Details</h3>
            <div class="modal-form-field">
                <p><strong>Total Sales: $${totalSales.toFixed(2)}</strong></p>
                <p><strong>Total VAT (20%): $${totalVAT.toFixed(2)}</strong></p>
            </div>
            <div class="modal-form-field">
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Order Number</th>
                            <th>Supplier</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>VAT (20%)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersHTML || '<tr><td colspan="6">No orders found</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="modal-actions">
                <button id="close-vat-modal" class="secondary-button">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    showCustomModal(modalHTML, 'close-vat-modal');
}

// Function to show pending payments in a modal
function showPendingPaymentsModal() {
    const selectedCompanyId = state.selectedCompanyId;
    // Show all pending orders for the company, not just for a specific supplier
    const companyOrders = state.orderHistory.filter(o => o.companyId === selectedCompanyId && !o.isPaid);
    
    // Calculate pending payments
    let pendingOrdersCount = companyOrders.length;
    let pendingOrdersAmount = 0;
    companyOrders.forEach(order => {
        pendingOrdersAmount += order.totalPrice || 0;
    });
    
    // Create modal content
    let ordersHTML = '';
    companyOrders.forEach(order => {
        // Calculate total number of items in the order
        const totalItems = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        ordersHTML += `
            <tr>
                <td>${order.orderNumber || 'N/A'}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>${order.supplierName || 'N/A'}</td>
                <td>${totalItems}</td>
                <td>$${(order.totalPrice || 0).toFixed(2)}</td>
                <td><button class="button view-order-btn" data-order-id="${order.id}" data-order-number="${order.orderNumber}">View</button></td>
            </tr>
        `;
    });
    
    const modalHTML = `
        <div class="modal-content" style="max-width: 900px; width: 90%;">
            <h3>Pending Payments</h3>
            <div class="modal-form-field">
                <p><strong>Pending Orders: ${pendingOrdersCount} orders</strong></p>
                <p><strong>Total Amount: $${pendingOrdersAmount.toFixed(2)}</strong></p>
            </div>
            <div class="modal-form-field">
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Total Items</th>
                            <th>Total Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ordersHTML || '<tr><td colspan="6">No pending orders found</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="modal-actions">
                <button id="close-pending-modal" class="secondary-button">Close</button>
            </div>
        </div>
    `;
    
    // Show modal
    showCustomModal(modalHTML, 'close-pending-modal');
}

// Function to show a custom modal
function showCustomModal(modalHTML, closeBtnId) {
    // Remove existing modal if it exists
    const existingModal = document.getElementById('dashboard-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'dashboard-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Add event listener to close button
    const closeBtn = document.getElementById(closeBtnId);
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    // Add event listeners for view order buttons
    const viewOrderButtons = modal.querySelectorAll('.view-order-btn');
    viewOrderButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const orderId = Number(e.target.dataset.orderId);
            const orderNumber = e.target.dataset.orderNumber;
            viewOrderDetails(orderId, orderNumber);
            // Close the modal
            document.body.removeChild(modal);
        });
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
