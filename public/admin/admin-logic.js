import { db, auth } from '/js/firebase-services.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// State
let currentTab = 'overview';
let products = [];
let categories = [];
let orders = [];

// Initialize
async function initAdmin() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/auth';
            return;
        }

        setupTabListeners();
        setupGlobalListeners();
        await loadInitialData();
        renderCurrentTab();
    });
}

function setupTabListeners() {
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            switchTab(tab);
        });
    });

    document.getElementById('adminLogout')?.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '/';
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
    renderCurrentTab();
}

async function loadInitialData() {
    try {
        const catSnap = await getDocs(collection(db, "categories"));
        categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const prodSnap = await getDocs(collection(db, "products"));
        products = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));
        const orderSnap = await getDocs(ordersQuery);
        orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        updateStats();
    } catch (error) {
        console.error("Error loading admin data:", error);
    }
}

function renderCurrentTab() {
    const content = document.getElementById('adminContent');
    if (!content) return;

    switch (currentTab) {
        case 'overview':
            renderOverview();
            break;
        case 'products':
            renderProductsManagement();
            break;
        case 'categories':
            renderCategoriesManagement();
            break;
        case 'orders':
            renderOrdersManagement();
            break;
        case 'settings':
            content.innerHTML = `<div class="stat-card"><span class="stat-label">Shop Settings</span><p>General store configuration coming soon.</p></div>`;
            break;
    }
}

function setupGlobalListeners() {
    const orderToggle = document.getElementById('orderToggle');
    if (orderToggle) {
        orderToggle.addEventListener('click', () => {
            orderToggle.classList.toggle('active');
            const isActive = orderToggle.classList.contains('active');
            console.log('Accepting orders:', isActive);
        });
    }
}

function updateStats() {
    const totalOrdersEl = document.getElementById('totalOrders');
    const expectedRevenueEl = document.getElementById('expectedRevenue');
    const paidRevenueEl = document.getElementById('paidRevenue');
    const activeProductsEl = document.getElementById('activeProducts');

    if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    if (activeProductsEl) activeProductsEl.textContent = products.filter(p => p.visible !== false).length;

    // Revenue categories
    // Expected: All orders (assuming COD is expected until paid)
    // Paid: Orders with status 'Paid' or 'Shipped'
    const expectedRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const paidRevenue = orders.filter(o => ['Paid', 'Shipped'].includes(o.status))
        .reduce((sum, order) => sum + (order.total || 0), 0);

    if (expectedRevenueEl) expectedRevenueEl.textContent = `$${expectedRevenue.toFixed(2)}`;
    if (paidRevenueEl) paidRevenueEl.textContent = `$${paidRevenue.toFixed(2)}`;
}

function renderOverview() {
    const content = document.getElementById('adminContent');
    const expectedRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidRevenue = orders.filter(o => ['Paid', 'Shipped'].includes(o.status))
        .reduce((sum, o) => sum + (o.total || 0), 0);

    content.innerHTML = `
        <div class="dashboard-stats">
            <div class="stat-card">
                <span class="stat-label">Total Orders</span>
                <p class="stat-value">${orders.length}</p>
            </div>
            <div class="stat-card">
                <span class="stat-label">Expected Revenue</span>
                <p class="stat-value">$${expectedRevenue.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <span class="stat-label">Paid Revenue</span>
                <p class="stat-value">$${paidRevenue.toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <span class="stat-label">Active Products</span>
                <p class="stat-value">${products.filter(p => p.visible !== false).length}</p>
            </div>
        </div>
        
        <div class="recent-activity">
            <div class="view-actions">
                <h2>Recent Orders</h2>
                <button class="btn btn-outline" onclick="window.switchTab('orders')">View All</button>
            </div>
            <div class="table-wrapper">
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.slice(0, 5).map(order => `
                                <tr>
                                    <td>#${order.id.slice(-6)}</td>
                                    <td>${order.customerName || 'Guest'}</td>
                                    <td>$${(order.total || 0).toFixed(2)}</td>
                                    <td><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                                    <td>${order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderProductsManagement() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="view-actions">
            <h2>Product Catalog</h2>
            <button class="btn btn-primary" id="addNewProduct">Add New Product</button>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><img src="${product.images?.thumbnail || '../assets/placeholder.jpg'}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;"></td>
                            <td><strong>${product.name}</strong></td>
                            <td>${product.category}</td>
                            <td>$${product.price}</td>
                            <td>${product.stock || 0}</td>
                            <td><span class="status-badge ${product.visible ? 'status-paid' : 'status-pending'}">${product.visible ? 'Visible' : 'Hidden'}</span></td>
                            <td>
                                <button class="btn-text" onclick="window.editProduct('${product.id}')">Edit</button>
                                <button class="btn-text" style="color: var(--color-terracotta)" onclick="window.deleteProduct('${product.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('addNewProduct')?.addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('productModal').classList.add('active');
    });

    // Populate Category Select in modal
    const catSelect = document.getElementById('prodCategory');
    if (catSelect) {
        catSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
}

function renderCategoriesManagement() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="view-actions">
            <h2>Categories</h2>
            <button class="btn btn-primary" id="addNewCategory">Add Category</button>
        </div>
        <div class="table-container" style="max-width: 800px;">
            <table>
                <thead>
                    <tr>
                        <th>Category Name</th>
                        <th>Products</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(cat => `
                        <tr>
                            <td><strong>${cat.name}</strong></td>
                            <td>${products.filter(p => p.category === cat.name).length} products</td>
                            <td>
                                <button class="btn-text" onclick="window.editCategory('${cat.id}')">Rename</button>
                                <button class="btn-text" style="color: var(--color-terracotta)" onclick="window.deleteCategory('${cat.id}')">Remove</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderOrdersManagement() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="view-actions">
            <h2>Order Fulfillment</h2>
            <div class="filter-group">
                <select class="admin-select">
                    <option>All Orders</option>
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Shipped</option>
                </select>
            </div>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>#${order.id.slice(-6)}</td>
                            <td>
                                <div>${order.customerName || 'N/A'}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted)">${order.customerEmail || ''}</div>
                            </td>
                            <td>${order.products?.length || 0} items</td>
                            <td>$${(order.total || 0).toFixed(2)}</td>
                            <td><span class="status-badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span></td>
                            <td>
                                <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;">Update Status</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Product Management Helpers
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodImage').value = product.images?.thumbnail || '';

    document.getElementById('productModal').classList.add('active');
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        // deleteDoc(doc(db, "products", id));
        console.log('Delete product:', id);
    }
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

// Global exposure
window.switchTab = switchTab;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', initAdmin);
