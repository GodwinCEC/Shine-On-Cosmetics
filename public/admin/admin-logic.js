import { db, auth } from '/js/firebase-services.js';
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
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '/auth';
            return;
        }

        // Simple check for now - in a real app, verify 'admin' role in Firestore
        // const userDoc = await getDoc(doc(db, "users", user.uid));
        // if (userDoc.data()?.role !== 'admin') { ... }

        setupTabListeners();
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
        auth.signOut().then(() => {
            window.location.href = '/';
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.getElementById('pageTitle').textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
    renderCurrentTab();
}

async function loadInitialData() {
    // Show loading states
    try {
        // Fetch Categories
        const catSnap = await getDocs(collection(db, "categories"));
        categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Products
        const prodSnap = await getDocs(collection(db, "products"));
        products = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Recent Orders
        const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));
        const orderSnap = await getDocs(ordersQuery);
        orders = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        updateStats();
    } catch (error) {
        console.error("Error loading admin data:", error);
    }
}

function updateStats() {
    const totalOrders = document.getElementById('totalOrders');
    const totalRevenue = document.getElementById('totalRevenue');
    const activeProducts = document.getElementById('activeProducts');

    if (totalOrders) totalOrders.textContent = orders.length; // Simplified for recent
    if (activeProducts) activeProducts.textContent = products.filter(p => p.visible !== false).length;

    // Revenue calculation
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    if (totalRevenue) totalRevenue.textContent = `$${revenue.toFixed(2)}`;
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
            content.innerHTML = `<div class="stat-card"><h2>Shop Settings</h2><p>General store configuration coming soon.</p></div>`;
            break;
    }
}

function renderOverview() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="dashboard-stats">
            <div class="stat-card">
                <h3>Total Orders</h3>
                <p class="stat-value">${orders.length}</p>
            </div>
            <div class="stat-card">
                <h3>Estimated Revenue</h3>
                <p class="stat-value">$${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}</p>
            </div>
            <div class="stat-card">
                <h3>Products</h3>
                <p class="stat-value">${products.length}</p>
            </div>
        </div>
        
        <div class="recent-activity">
            <div class="view-actions">
                <h2>Recent Orders</h2>
                <button class="btn btn-outline" onclick="window.switchTab('orders')">View All</button>
            </div>
            <div class="table-container">
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
                        ${orders.map(order => `
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
        // Modal logic
        alert('Product creation form modal would open here.');
    });
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

// Global exposure for simple onclick handlers (for demo/simplicity)
window.switchTab = switchTab;
window.editProduct = (id) => console.log('Edit product', id);
window.deleteProduct = (id) => console.log('Delete product', id);
window.editCategory = (id) => console.log('Edit category', id);
window.deleteCategory = (id) => console.log('Delete category', id);

document.addEventListener('DOMContentLoaded', initAdmin);
