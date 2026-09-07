import { auth, db } from "../js/firebase-config.js?v=0.1.3";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Elements ─────────────────────────────────────────────
const pageTitle = document.getElementById('pageTitle');
const adminContent = document.getElementById('adminContent');
const adminName = document.getElementById('adminName');
const orderToggle = document.getElementById('orderToggle');
const menuToggle = document.getElementById('menuToggle');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const adminSidebar = document.getElementById('adminSidebar');

// ── Mobile Menu Toggle ───────────────────────────────────
menuToggle?.addEventListener('click', () => {
    adminSidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});

sidebarClose?.addEventListener('click', closeSidebar);
sidebarOverlay?.addEventListener('click', closeSidebar);

function closeSidebar() {
    adminSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ── Auth Guard ───────────────────────────────────────────
let cachedOrders = [];
let orderFilters = {
    search: '',
    status: 'all',
    payment: 'all',
    sort: 'newest',
    startDate: '',
    endDate: ''
};

async function runAuthGuard() {
    try {
        // 1. Wait until the auth state is fully determined (restored from storage)
        // This is the most reliable way in Firebase 10+ to avoid initial null flickers
        await auth.authStateReady();
        const user = auth.currentUser;

        if (!user) {
            console.log("Auth Guard [v2]: No user found. Redirecting to login.");
            const currentPath = window.location.pathname;
            window.location.href = `/auth?redirect=${encodeURIComponent(currentPath)}`;
            return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));

        // 2. Not an Admin? Go to personal dashboard
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            console.warn("Unauthorized access attempt. Redirecting to user profile.");
            window.location.href = "/dashboard";
            return;
        }

        // 3. Access Granted
        console.log("Admin access granted for:", user.email);
        adminName.textContent = user.displayName || "Admin";

        // Initialize routing
        handleRouting();

        // Reveal content only after verification
        const layout = document.querySelector('.admin-layout');
        if (layout) {
            layout.style.opacity = '1';
            layout.style.visibility = 'visible';
        }

        // 4. Set up a listener for subsequent state changes
        onAuthStateChanged(auth, (updatedUser) => {
            if (!updatedUser) {
                console.log("User logged out. Redirecting...");
                window.location.href = "/auth";
            }
        });

    } catch (error) {
        console.error("Auth Guard Error:", error);
        if (error.code === 'permission-denied') {
            window.location.href = "/dashboard";
        } else {
            if (auth.currentUser) {
                console.error("Authenticated but failed to fetch profile data.");
                adminContent.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--error)">
                    <h3>Error Loading Profile</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
                </div>`;
                const layout = document.querySelector('.admin-layout');
                if (layout) {
                    layout.style.opacity = '1';
                    layout.style.visibility = 'visible';
                }
            } else {
                window.location.href = "/auth";
            }
        }
    }
}

// Start the guard immediately
runAuthGuard();

let activeTab = 'overview';
// ── Tab Management ───────────────────────────────────────
const tabs = document.querySelectorAll('.nav-item');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        switchTab(target);
        closeSidebar(); // Close sidebar on mobile after selection
    });
});

function switchTab(tabId, updateHash = true) {
    if (updateHash) {
        window.location.hash = tabId;
        return;
    }

    activeTab = tabId;
    
    // Update UI
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    const title = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    if (pageTitle) pageTitle.textContent = title;

    // Load Content
    renderTabContent(tabId);
}

function handleRouting() {
    const hash = window.location.hash.substring(1) || 'overview';

    if (hash === 'add-product') {
        renderProductForm();
        return;
    }

    if (hash.startsWith('edit-product/')) {
        const id = hash.split('/')[1];
        renderProductForm(id);
        return;
    }

    const validTabs = ['overview', 'products', 'categories', 'tags', 'users', 'contacts', 'settings'];
    const targetTab = validTabs.includes(hash) ? hash : 'overview';
    switchTab(targetTab, false);
}

window.addEventListener('hashchange', handleRouting);

// ── Content Rendering ────────────────────────────────────
function renderTabContent(tabId) {
    adminContent.innerHTML = `<div class="loading-state" style="text-align:center;padding:4rem;color:var(--text-m);">Loading ${tabId}...</div>`;

    switch (tabId) {
        case 'overview':
            renderOverview();
            break;
        case 'products':
            renderProducts();
            break;
        case 'categories':
            renderCategories();
            break;
        case 'tags':
            renderTags();
            break;
        case 'users':
            renderUsers();
            break;
        case 'contacts':
            renderContacts();
            break;
        case 'settings':
            renderSettings();
            break;
    }
}

// ── Overview Tab ─────────────────────────────────────────
async function renderOverview() {
    adminContent.innerHTML = `
        <div class="dashboard-stats">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">📦</span>
                    <span class="stat-label">Total Orders</span>
                </div>
                <p class="stat-value" id="totalOrders">...</p>
                <span class="stat-trend">—</span>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">💰</span>
                    <span class="stat-label">Expected Revenue</span>
                </div>
                <p class="stat-value" id="expectedRevenue">...</p>
                <span class="stat-trend">—</span>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">✅</span>
                    <span class="stat-label">Paid Revenue</span>
                </div>
                <p class="stat-value" id="paidRevenue">...</p>
                <span class="stat-trend">—</span>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">🛍️</span>
                    <span class="stat-label" id="productsSoldLabel">Sold Products</span>
                </div>
                <p class="stat-value" id="activeProducts">...</p>
                <span class="stat-trend">—</span>
            </div>
        </div>

        <div class="recent-activity">
            <div class="section-header" style="margin-bottom:1.5rem">
                <h2>All Orders</h2>
            </div>
            
            <div class="filter-bar">
                <div class="filter-main">
                    <div class="filter-group">
                        <span class="filter-label">Search</span>
                        <div class="search-container">
                            <span class="search-icon">🔍</span>
                            <input type="text" class="search-input" id="orderSearch" placeholder="Name, Email, or #Order" oninput="handleOrderSearch()">
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <span class="filter-label">Status View</span>
                        <div class="filter-buttons" id="statusFilterButtons">
                            <button class="filter-btn active" onclick="handleBtnFilter(this, 'status', 'all')">All</button>
                            <button class="filter-btn" onclick="handleBtnFilter(this, 'status', 'pending')">Pending</button>
                            <button class="filter-btn" onclick="handleBtnFilter(this, 'status', 'confirmed')">Confirmed</button>
                            <button class="filter-btn" onclick="handleBtnFilter(this, 'status', 'delivered')">Delivered</button>
                        </div>
                    </div>

                    <div class="filter-group">
                        <span class="filter-label">Payment</span>
                        <div class="filter-buttons" id="paymentFilterButtons">
                            <button class="filter-btn active" onclick="handleBtnFilter(this, 'payment', 'all')">All</button>
                            <button class="filter-btn" onclick="handleBtnFilter(this, 'payment', 'paid')">Paid</button>
                            <button class="filter-btn" onclick="handleBtnFilter(this, 'payment', 'pending')">Unpaid</button>
                        </div>
                    </div>
                </div>

                <div class="filter-main" style="border-top: 1px solid var(--sand); padding-top: 1rem; margin-top: 0.5rem;">
                    <div class="filter-group">
                        <span class="filter-label">Date Range</span>
                        <div style="display:flex; gap:0.75rem; align-items:center">
                            <input type="date" class="search-input" id="startDate" style="padding-left:1rem; width:160px" onchange="handleDateFilter()">
                            <span style="color:var(--text-m); font-size:0.75rem">to</span>
                            <input type="date" class="search-input" id="endDate" style="padding-left:1rem; width:160px" onchange="handleDateFilter()">
                            <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.75rem; border-radius:10px" onclick="resetDates()">Clear Dates</button>
                        </div>
                    </div>

                    <div class="filter-group" style="margin-left:auto">
                        <span class="filter-label">Sort By</span>
                        <select class="search-input" id="sortFilter" style="padding-left:1rem; width:180px; border-radius:12px" onchange="handleSortFilter()">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="amount-high">Highest Price</option>
                            <option value="amount-low">Lowest Price</option>
                        </select>
                    </div>
                </div>
            </div>



            <div class="table-container">
                <div class="table-scroll">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Manage</th>
                            </tr>
                        </thead>
                        <tbody id="overviewOrdersBody">
                            <tr><td colspan="6" class="table-loading">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;


    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        const productsSnap = await getDocs(collection(db, "products"));

        cachedOrders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calc Revenue
        let expectedRevenue = 0;
        let paidRevenue = 0;
        ordersSnap.forEach(doc => {
            const data = doc.data();
            expectedRevenue += (data.totalAmount || 0);
            if (data.payment?.status === 'paid' || data.paymentStatus === 'paid' || data.status === 'delivered') {
                paidRevenue += (data.totalAmount || 0);
            }
        });

        if (activeTab !== 'overview') return;

        const totOrders = document.getElementById('totalOrders');
        const expRevenueEl = document.getElementById('expectedRevenue');
        const paidRevenueEl = document.getElementById('paidRevenue');
        const actProducts = document.getElementById('activeProducts');

        // Initial stat assignment (will be overwritten by applyFilteredOverviewOrders)
        if (totOrders) totOrders.textContent = ordersSnap.size;
        if (expRevenueEl) expRevenueEl.textContent = `GH₵${expectedRevenue.toFixed(2)}`;
        if (paidRevenueEl) paidRevenueEl.textContent = `GH₵${paidRevenue.toFixed(2)}`;
        if (actProducts) actProducts.textContent = '0'; // Placeholder

        applyFilteredOverviewOrders();

    } catch (e) {
        console.error("Overview Stats Error:", e);
    }
}

window.handleOrderSearch = () => {
    orderFilters.search = document.getElementById('orderSearch').value.toLowerCase();
    applyFilteredOverviewOrders();
};

window.handleBtnFilter = (btn, filterType, value) => {
    btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    orderFilters[filterType] = value;
    applyFilteredOverviewOrders();
};

window.handleDateFilter = () => {
    orderFilters.startDate = document.getElementById('startDate').value;
    orderFilters.endDate = document.getElementById('endDate').value;
    applyFilteredOverviewOrders();
};

window.handleSortFilter = () => {
    orderFilters.sort = document.getElementById('sortFilter').value;
    applyFilteredOverviewOrders();
};

window.resetDates = () => {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    orderFilters.startDate = '';
    orderFilters.endDate = '';
    applyFilteredOverviewOrders();
};


function applyFilteredOverviewOrders() {
    const tbody = document.getElementById('overviewOrdersBody');
    if (!tbody) return;

    let filtered = cachedOrders.filter(o => {
        const matchSearch = (o.customer?.name || o.customerName || '').toLowerCase().includes(orderFilters.search) ||
            (o.customer?.email || o.userEmail || '').toLowerCase().includes(orderFilters.search) ||
            (o.orderNumber || o.id).toLowerCase().includes(orderFilters.search);

        const matchStatus = orderFilters.status === 'all' || (o.status || 'pending') === orderFilters.status;

        const isPaid = o.payment?.status === 'paid' || o.paymentStatus === 'paid' || o.status === 'delivered';
        const matchPayment = orderFilters.payment === 'all' || (orderFilters.payment === 'paid' ? isPaid : !isPaid);

        // Date Filter logic
        const date = o.createdAt ? (o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt)) : new Date();
        const orderDateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

        let matchDate = true;
        if (orderFilters.startDate && orderDateStr < orderFilters.startDate) matchDate = false;
        if (orderFilters.endDate && orderDateStr > orderFilters.endDate) matchDate = false;

        return matchSearch && matchStatus && matchPayment && matchDate;
    });


    // Recalculate stats based on filtered orders
    let filteredTotalRevenue = 0;
    let filteredPaidRevenue = 0;
    let filteredUniqueProducts = new Set();

    filtered.forEach(o => {
        filteredTotalRevenue += (o.totalAmount || 0);
        const isPaid = o.payment?.status === 'paid' || o.paymentStatus === 'paid' || o.status === 'delivered';
        if (isPaid) filteredPaidRevenue += (o.totalAmount || 0);

        // Track unique products in these orders
        if (o.items && Array.isArray(o.items)) {
            o.items.forEach(item => {
                if (item.id) filteredUniqueProducts.add(item.id);
            });
        }
    });

    const totOrdersEl = document.getElementById('totalOrders');
    const expRevenueEl = document.getElementById('expectedRevenue');
    const paidRevenueEl = document.getElementById('paidRevenue');
    const actProductsEl = document.getElementById('activeProducts');
    const productsSoldLabel = document.getElementById('productsSoldLabel');

    if (totOrdersEl) totOrdersEl.textContent = filtered.length;
    if (expRevenueEl) expRevenueEl.textContent = `GH₵${filteredTotalRevenue.toFixed(2)}`;
    if (paidRevenueEl) paidRevenueEl.textContent = `GH₵${filteredPaidRevenue.toFixed(2)}`;
    if (actProductsEl) actProductsEl.textContent = filteredUniqueProducts.size;

    if (productsSoldLabel) {
        const isFilterActive = orderFilters.search || orderFilters.status !== 'all' || orderFilters.payment !== 'all' || orderFilters.startDate || orderFilters.endDate;
        productsSoldLabel.textContent = isFilterActive ? 'Products Sold' : 'Sold Products';
    }

    // Sort
    filtered.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds : (new Date(a.createdAt).getTime() / 1000);
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds : (new Date(b.createdAt).getTime() / 1000);

        if (orderFilters.sort === 'newest') return timeB - timeA;
        if (orderFilters.sort === 'oldest') return timeA - timeB;
        if (orderFilters.sort === 'amount-high') return (b.totalAmount || 0) - (a.totalAmount || 0);
        if (orderFilters.sort === 'amount-low') return (a.totalAmount || 0) - (b.totalAmount || 0);
        return 0;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-m);padding:2rem">No orders match these filters.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const customerName = o.customer?.name || o.customerName || 'Guest';
        const date = o.createdAt ? (o.createdAt.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt)) : new Date();
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <tr>
                <td style="font-weight:600">#${o.orderNumber || o.id.slice(-8).toUpperCase()}</td>
                <td>${customerName}</td>
                <td style="font-weight:600;color:var(--caramel)">GH₵${(o.totalAmount || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${(o.status || 'pending').toLowerCase()}">${o.status || 'Pending'}</span></td>
                <td style="color:var(--text-m);font-size:0.8125rem">${formattedDate}</td>
                <td>
                    <button class="btn-manage" onclick="window.viewOrderDetails('${o.id}')">Manage</button>
                </td>
            </tr>
        `;
    }).join('');
}


// ── Products Tab ─────────────────────────────────────────
window.renderProducts = async function () {
    renderProductList();
}

window.renderProductList = async function () {
    adminContent.innerHTML = `
        <div class="tab-header-actions" style="margin-bottom:1rem;">
            <h2>Manage Products</h2>
            <div style="display:flex;gap:0.75rem">
                <button class="btn btn-outline" onclick="renderBulkProductForm()">+ Bulk Add (5)</button>
                <button class="btn btn-primary" onclick="window.location.hash='add-product'">+ Add Product</button>
            </div>
        </div>

        <div class="admin-filter-bar" style="margin-bottom:2rem; display:flex; gap:1rem; flex-wrap:wrap; background:white; padding:1.25rem; border-radius:1rem; box-shadow:var(--sh-sm);">
            <div style="flex:1; position:relative; min-width:200px;">
                <i class="fas fa-search" style="position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:var(--text-m); font-size:0.9rem"></i>
                <input type="text" id="prodSearch" placeholder="Search product name..." style="width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border:1px solid #eee; border-radius:0.75rem; font-family:var(--f-sans); font-size:0.9rem; outline:none; transition:border-color 0.3s">
            </div>
            <select id="prodFilterCat" style="padding:0.75rem 1rem; border:1px solid #eee; border-radius:0.75rem; font-family:var(--f-sans); outline:none;">
                <option value="">All Categories</option>
            </select>
            <select id="prodFilterGender" style="padding:0.75rem 1rem; border:1px solid #eee; border-radius:0.75rem; font-family:var(--f-sans); outline:none;">
                <option value="">All Genders</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Unisex">Unisex</option>
            </select>
            <select id="prodSortOrder" style="padding:0.75rem 1rem; border:1px solid #eee; border-radius:0.75rem; font-family:var(--f-sans); outline:none;">
                <option value="name">Sort: A-Z</option>
                <option value="price-asc">Price: Low-High</option>
                <option value="price-desc">Price: High-Low</option>
                <option value="category">Group by Category</option>
            </select>
        </div>

        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Feat.</th>
                            <th>Vis.</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminProductList">
                        <tr><td colspan="7" class="table-loading">Loading products...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    try {
        const querySnapshot = await getDocs(query(collection(db, "products"), orderBy("name")));
        const catSnapshot = await getDocs(collection(db, "categories"));

        if (activeTab !== 'products') return;
        const productList = document.getElementById('adminProductList');
        const catFilter = document.getElementById('prodFilterCat');
        if (!productList) return;
        // Populate Category Filter
        catSnapshot.forEach(doc => {
            const opt = document.createElement('option');
            opt.value = doc.data().name;
            opt.textContent = doc.data().name;
            catFilter.appendChild(opt);
        });

        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const renderFilteredList = () => {
            const searchTerm = document.getElementById('prodSearch').value.toLowerCase();
            const filterCat = document.getElementById('prodFilterCat').value;
            const sortOrder = document.getElementById('prodSortOrder').value;

            let filtered = allProducts.filter(p => {
                const matchesName = p.name.toLowerCase().includes(searchTerm);
                const matchesCat = !filterCat || 
                    (p.categories && Array.isArray(p.categories) ? p.categories.includes(filterCat) : p.category === filterCat);
                const matchesGender = !document.getElementById('prodFilterGender').value || p.gender === document.getElementById('prodFilterGender').value;
                return matchesName && matchesCat && matchesGender;
            });

            // Sorting
            if (sortOrder === 'price-asc') filtered.sort((a, b) => a.price - b.price);
            else if (sortOrder === 'price-desc') filtered.sort((a, b) => b.price - a.price);
            else if (sortOrder === 'category' || sortOrder === 'name') {
                filtered.sort((a, b) => {
                    if (sortOrder === 'category') {
                        const catA = (a.categories && Array.isArray(a.categories) ? a.categories[0] : a.category || '').toLowerCase();
                        const catB = (b.categories && Array.isArray(b.categories) ? b.categories[0] : b.category || '').toLowerCase();
                        if (catA !== catB) return catA.localeCompare(catB);
                    }
                    return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
                });
            }

            if (filtered.length === 0) {
                productList.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-m);padding:2rem;">No products matching filters.</td></tr>`;
                return;
            }

            let currentCategory = null;
            let rowsHtml = '';

            filtered.forEach(p => {
                const primaryCat = p.categories && Array.isArray(p.categories) ? p.categories[0] : p.category;
                // Grouping Header
                if (sortOrder === 'category' && primaryCat !== currentCategory) {
                    currentCategory = primaryCat;
                    rowsHtml += `
                        <tr class="table-group-header" style="background:#f9f9f9;">
                            <td colspan="7" style="font-family:var(--f-heading); font-weight:700; padding:1.25rem 1.5rem; font-size:0.85rem; color:var(--caramel); text-transform:uppercase; letter-spacing:0.05em">
                                ${currentCategory || 'Uncategorized'}
                            </td>
                        </tr>
                    `;
                }

                const coverImage = (p.images && p.images.length > 0) ? p.images[0].thumbnail : (p.image || '');
                const catsList = p.categories && Array.isArray(p.categories) ? p.categories : [p.category || 'Uncategorized'];
                const catsBadges = catsList.map(c => `<span class="label-tag" style="margin-bottom:0.25rem; font-size:0.65rem; padding:0.25rem 0.75rem; background:var(--milk); border-radius:99px; display:inline-block; margin-right:0.25rem">${c}</span>`).join('');

                rowsHtml += `
                    <tr>
                        <td>
                            <div class="prod-thumb" style="width:40px;height:40px;border-radius:6px;overflow:hidden;background:#eee;">
                                <img src="${coverImage}" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=200'" style="width:100%;height:100%;object-fit:cover;">
                            </div>
                        </td>
                        <td><div style="font-weight:600;color:var(--espresso)">${p.name}</div></td>
                        <td><div style="display:flex; flex-wrap:wrap; gap:0.25rem">${catsBadges}</div></td>
                        <td style="font-weight:700;color:var(--caramel)">GH₵${p.price}</td>
                        <td>
                            <button class="toggle-switch ${p.isFeatured ? 'active' : ''}" 
                                    onclick="toggleProductFeatured('${p.id}', ${!!p.isFeatured}, this)" style="width:40px;height:22px">
                                <span class="toggle-slider"></span>
                            </button>
                        </td>
                        <td>
                            <button class="toggle-switch ${p.isVisible !== false ? 'active' : ''}" 
                                    onclick="toggleProductVisibility('${p.id}', ${p.isVisible !== false}, this)" style="width:40px;height:22px">
                                <span class="toggle-slider"></span>
                            </button>
                        </td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon" onclick="editProduct('${p.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                                <button class="btn-icon delete" onclick="deleteProduct('${p.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            productList.innerHTML = rowsHtml;
        };

        // Attach listeners
        document.getElementById('prodSearch').addEventListener('input', renderFilteredList);
        document.getElementById('prodFilterCat').addEventListener('change', renderFilteredList);
        document.getElementById('prodFilterGender').addEventListener('change', renderFilteredList);
        document.getElementById('prodSortOrder').addEventListener('change', renderFilteredList);

        // Initial Render
        renderFilteredList();

    } catch (e) {
        console.error("Error loading products:", e);
        productList.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--error)">Error loading data.</td></tr>`;
    }
}

window.renderProductForm = async (productId = null) => {
    adminContent.innerHTML = `
        <div class="tab-header-actions" style="margin-bottom:2rem;">
            <h2>${productId ? 'Edit Product' : 'Add New Product'}</h2>
            <button class="btn btn-outline" onclick="window.location.hash='products'">← Back to Products</button>
        </div>
        
        <form id="inlineProductForm" class="full-page-form" data-edit-id="${productId || ''}">
            <div class="form-grid">
                <div class="form-section">
                    <h3>Basic Details</h3>
                    <div class="form-row">
                        <div class="form-group full">
                            <label>Product Name</label>
                            <input type="text" id="prodName" placeholder="e.g. Silk Glow Serum" required />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group full">
                            <label>Categories (Select all that apply)</label>
                            <div id="prodCategoriesContainer" class="tag-selection-grid" style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.5rem">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Price (GH₵)</label>
                            <input type="number" id="prodPrice" step="0.01" placeholder="25.00" required />
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>Inventory & Properties</h3>
                    <div class="form-row">
                        <!-- <div class="form-group">
                            <label>Stock Quantity</label>
                            <input type="number" id="prodStock" placeholder="10" required />
                        </div> -->
                        <div class="form-group">
                            <label>Target Gender</label>
                            <select id="prodGender">
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Unisex">Unisex</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group" style="display:flex; align-items:center; gap:0.75rem">
                            <label style="margin-bottom:0">Product Visible</label>
                            <button type="button" class="toggle-switch" id="prodVisible" style="width:40px;height:22px">
                                <span class="toggle-slider"></span>
                            </button>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group full">
                            <label>Short Description</label>
                            <textarea id="prodDesc" placeholder="Describe the product..." rows="3"></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-section full-width">
                    <h3>Product Tags</h3>
                    <div class="form-group full">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem">
                            <label style="margin-bottom:0">Select Tags (Recommended tags appear first)</label>
                            <div style="display:flex; gap:0.5rem;">
                                <input type="text" id="quickAddTagName" placeholder="New tag..." style="width:140px; padding:0.5rem 0.75rem; font-size:0.8125rem; border-radius:8px; border:1px solid var(--sand); outline:none;">
                                <button type="button" class="btn btn-outline" style="padding:0.5rem 1rem; font-size:0.75rem; border-radius:8px" id="quickAddTagBtn">Quick Add</button>
                            </div>
                        </div>
                        <div id="productTagsList" class="tag-selection-grid">
                            <!-- Populated dynamically -->
                            <div style="color:var(--text-m); font-size:0.875rem">Select a category to see recommended tags...</div>
                        </div>
                    </div>
                </div>

                <div class="form-section full-width">
                    <h3>Product Images</h3>
                    <div class="form-group full">
                        <label>Upload Images (First image acts as cover)</label>
                        <input type="file" id="prodImageFiles" multiple accept="image/jpeg,image/png,image/webp" />
                    </div>
                    <div id="imagePreviewGrid" class="image-preview-grid"></div>
                </div>
            </div>

            <div class="form-actions" style="justify-content:flex-start; margin-top: 2rem;">
                <button type="submit" class="btn btn-primary" id="saveProductBtn">Save Product</button>
            </div>
        </form>
    `;

    // Populate Categories Grid
    const catContainer = document.getElementById('prodCategoriesContainer');
    const { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { ref, uploadBytes, getDownloadURL, deleteObject } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js");
    const catSnap = await getDocs(collection(db, "categories"));
    const categoriesList = catSnap.docs.map(d => d.data().name);
    let selectedCategories = new Set();

    // Fetch All Tags for selection
    const tagSnap = await getDocs(collection(db, "tags"));
    const allTags = tagSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let selectedTagIds = new Set();

    const renderCategoriesSelection = () => {
        if (!catContainer) return;
        catContainer.innerHTML = categoriesList.map(cat => `
            <label class="tag-checkbox-label ${selectedCategories.has(cat) ? 'active' : ''}">
                <input type="checkbox" value="${cat}" ${selectedCategories.has(cat) ? 'checked' : ''} onchange="window.toggleProductCategory('${cat}', this)">
                ${cat}
            </label>
        `).join('');
    };

    window.toggleProductCategory = (cat, el) => {
        if (el.checked) {
            selectedCategories.add(cat);
            el.parentElement.classList.add('active');
        } else {
            selectedCategories.delete(cat);
            el.parentElement.classList.remove('active');
        }
        renderTagsSelection(Array.from(selectedCategories));
    };

    const renderTagsSelection = (selectedCats = []) => {
        const list = document.getElementById('productTagsList');
        if (!list) return;

        const recommended = allTags.filter(t => t.categories && t.categories.some(c => selectedCats.includes(c)));
        const others = allTags.filter(t => !t.categories || !t.categories.some(c => selectedCats.includes(c)));

        let html = '';
        if (recommended.length > 0) {
            html += `<div class="tag-section-divider">Recommended for selected categories</div>`;
            html += recommended.map(t => `
                <label class="tag-checkbox-label ${selectedTagIds.has(t.id) ? 'active' : ''}">
                    <input type="checkbox" value="${t.id}" ${selectedTagIds.has(t.id) ? 'checked' : ''} onchange="window.toggleProductTag('${t.id}', this)">
                    ${t.name}
                </label>
            `).join('');
        }

        if (others.length > 0) {
            html += `<div class="tag-section-divider">${recommended.length > 0 ? 'Other Tags' : 'Available Tags'}</div>`;
            html += others.map(t => `
                <label class="tag-checkbox-label ${selectedTagIds.has(t.id) ? 'active' : ''}">
                    <input type="checkbox" value="${t.id}" ${selectedTagIds.has(t.id) ? 'checked' : ''} onchange="window.toggleProductTag('${t.id}', this)">
                    ${t.name}
                </label>
            `).join('');
        }

        if (allTags.length === 0) {
            html = `<div style="color:var(--text-m); font-size:0.875rem">No tags found. Use the quick add to create one.</div>`;
        }

        list.innerHTML = html;
    };

    window.toggleProductTag = (id, el) => {
        if (el.checked) {
            selectedTagIds.add(id);
            el.parentElement.classList.add('active');
        } else {
            selectedTagIds.delete(id);
            el.parentElement.classList.remove('active');
        }
    };

    window.quickAddTag = async () => {
        const input = document.getElementById('quickAddTagName');
        const btn = document.getElementById('quickAddTagBtn');
        const name = input.value.trim();
        if (!name) return;

        btn.disabled = true;
        btn.textContent = '...';

        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const currentCats = Array.from(selectedCategories);

        try {
            const { setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
            await setDoc(doc(db, "tags", slug), {
                name: name,
                slug: slug,
                categories: currentCats,
                createdAt: new Date().toISOString()
            });

            // Add to local state and select it
            allTags.push({ id: slug, name, categories: currentCats });
            selectedTagIds.add(slug);
            input.value = '';
            renderTagsSelection(currentCats);
            await syncTagsToGlobal();
        } catch (e) {
            console.error("Quick add failed", e);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Quick Add';
        }
    };

    document.getElementById('quickAddTagBtn').onclick = window.quickAddTag;

    let existingImages = [];

    if (productId) {
        const pDoc = await getDoc(doc(db, "products", productId));
        if (pDoc.exists()) {
            const p = pDoc.data();
            document.getElementById('prodName').value = p.name || '';
            
            // Set selected categories
            if (p.categories && Array.isArray(p.categories)) {
                selectedCategories = new Set(p.categories);
            } else if (p.category) {
                selectedCategories = new Set([p.category]);
            }

            document.getElementById('prodPrice').value = p.price || 0;
            document.getElementById('prodDesc').value = p.description || '';
            // if (document.getElementById('prodStock')) document.getElementById('prodStock').value = p.stock || 0;
            document.getElementById('prodGender').value = p.gender || 'Female';
            document.getElementById('prodVisible').classList.toggle('active', p.isVisible !== false);

            // Migrate old single-image data
            if (p.images && Array.isArray(p.images)) {
                existingImages = p.images;
            } else if (p.image) {
                existingImages = [{ full: p.image, thumbnail: p.image }];
            }
            renderImagePreviews(existingImages);

            // Set selected tags
            if (p.tags && Array.isArray(p.tags)) {
                selectedTagIds = new Set(p.tags);
            }
            renderCategoriesSelection();
            renderTagsSelection(Array.from(selectedCategories));
        }
    } else {
        renderCategoriesSelection();
        renderTagsSelection([]);
    }

    const { optimizeImage, createImagePreview } = await import('../js/image-optimizer.js');

    // Track new selected files
    let selectedFiles = [];

    document.getElementById('prodImageFiles').addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (let file of files) {
            selectedFiles.push(file);
        }
        await renderAllPreviews();
    });

    async function renderAllPreviews() {
        const grid = document.getElementById('imagePreviewGrid');
        grid.innerHTML = '';

        // Render existing images first
        existingImages.forEach((img, idx) => {
            grid.innerHTML += `
               <div class="preview-item">
                   <img src="${img.thumbnail}" />
                   <button type="button" class="remove-btn" onclick="removeExistingImage(${idx})">×</button>
               </div>
            `;
        });

        // Render newly selected files
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const dataUrl = await createImagePreview(file);
            grid.innerHTML += `
               <div class="preview-item new-file">
                   <img src="${dataUrl}" />
                   <button type="button" class="remove-btn" onclick="removeNewFile(${i})">×</button>
               </div>
            `;
        }
    }

    // Define inner global functions for the remove buttons
    window.removeExistingImage = (idx) => {
        existingImages.splice(idx, 1);
        renderAllPreviews();
    };

    window.removeNewFile = (idx) => {
        selectedFiles.splice(idx, 1);
        renderAllPreviews();
    };

    function renderImagePreviews(images) {
        // Just empty wrap around main loader
        renderAllPreviews();
    }

    document.getElementById('prodVisible').addEventListener('click', () => {
        document.getElementById('prodVisible').classList.toggle('active');
    });

    document.getElementById('inlineProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveProductBtn');
        const catsArray = Array.from(selectedCategories);
        if (catsArray.length === 0) {
            alert("Please select at least one category.");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const { storage } = await import('../js/firebase-config.js');
            const data = {
                name: document.getElementById('prodName').value,
                categories: catsArray,
                category: catsArray[0] || '',
                price: parseFloat(document.getElementById('prodPrice').value),
                description: document.getElementById('prodDesc').value,
                stock: document.getElementById('prodStock') ? parseInt(document.getElementById('prodStock').value) : (productId ? 1 : 1), // Default to 1 if UI removed
                gender: document.getElementById('prodGender').value,
                isVisible: document.getElementById('prodVisible').classList.contains('active'),
                tags: Array.from(selectedTagIds),
                updatedAt: new Date().toISOString()
            };

            // Handle ID assignment
            const pId = productId || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now();

            // Upload new images
            const finalImages = [...existingImages];

            if (selectedFiles.length > 0) {
                saveBtn.textContent = 'Optimizing & Uploading...';

                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    // Create thumb and full
                    const thumbResult = await optimizeImage(file, 'thumbnail');
                    const fullResult = await optimizeImage(file, 'full');

                    const timestamp = Date.now();
                    const thumbPath = `products/${pId}/thumb_${timestamp}_${i}.webp`;
                    const fullPath = `products/${pId}/full_${timestamp}_${i}.webp`;

                    await uploadBytes(ref(storage, thumbPath), thumbResult.blob);
                    await uploadBytes(ref(storage, fullPath), fullResult.blob);

                    const thumbUrl = await getDownloadURL(ref(storage, thumbPath));
                    const fullUrl = await getDownloadURL(ref(storage, fullPath));

                    finalImages.push({ thumbnail: thumbUrl, full: fullUrl });
                }
            }

            data.images = finalImages;

            if (productId) {
                await updateDoc(doc(db, "products", productId), data);
            } else {
                data.isFeatured = false;
                data.createdAt = new Date().toISOString();
                await setDoc(doc(db, "products", pId), data);
            }

            renderProducts();
        } catch (err) {
            console.error("Save Product Error:", err);
            alert("Failed to save product.");
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Product';
        }
    });
};

window.renderBulkProductForm = async () => {
    adminContent.innerHTML = `
        <div class="tab-header-actions" style="margin-bottom:2rem;">
            <h2>Bulk Add Products (Multi-Entry)</h2>
            <button class="btn btn-outline" onclick="renderProducts()">← Back to Products</button>
        </div>
        
        <form id="bulkProductForm" class="full-page-form">
            <div class="bulk-grid">
                ${[1, 2, 3, 4, 5].map(i => `
                    <div class="bulk-card" data-index="${i - 1}">
                        <div class="bulk-card-header">
                            <span class="bulk-card-num">#${i}</span>
                            <div style="flex:1; display:flex; align-items:center; justify-content:space-between">
                                <input type="text" placeholder="Product Name" class="bulk-name" style="width:70%" />
                                <div style="display:flex; align-items:center; gap:0.5rem">
                                    <span style="font-size:0.65rem; font-family:var(--f-heading); text-transform:uppercase; color:var(--text-m)">Visible</span>
                                    <button type="button" class="toggle-switch active bulk-visible" style="width:36px;height:20px">
                                        <span class="toggle-slider"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bulk-card-body">
                            <div class="bulk-row-split">
                                <div class="form-group">
                                    <label>Category</label>
                                    <select class="bulk-cat"><option value="">Category...</option></select>
                                </div>
                                <div class="form-group">
                                    <label>Price (GH₵)</label>
                                    <input type="number" step="0.01" placeholder="0.00" class="bulk-price" />
                                </div>
                                <div class="form-group">
                                    <label>Gender</label>
                                    <select class="bulk-gender">
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Unisex">Unisex</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Description</label>
                                <textarea class="bulk-desc" rows="2" placeholder="Tell more about this product..."></textarea>
                            </div>

                            <div class="form-group">
                                <label>Images (Select multiple)</label>
                                <input type="file" class="bulk-file-input" multiple accept="image/*" id="bulkInput_${i - 1}" />
                                <div id="bulkPrevGrid_${i - 1}" class="image-preview-grid mini"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="form-actions" style="justify-content:flex-start; margin-top: 3rem; background: var(--white); padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--sh-md); position: sticky; bottom: 1rem; z-index: 100;">
                <button type="submit" class="btn btn-primary" id="saveBulkBtn">Save All 5 Products</button>
                <p style="margin-left:auto;color:var(--text-m);font-size:0.875rem">Only cards with product names will be processed.</p>
            </div>
        </form>
    `;

    const { collection, getDocs, setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js");
    const { optimizeImage, createImagePreview } = await import('../js/image-optimizer.js');
    const { storage } = await import('../js/firebase-config.js');

    // Populate Category Dropdowns
    const catSnap = await getDocs(collection(db, "categories"));
    const catOptions = `<option value="">Category...</option>` + catSnap.docs.map(d => `<option value="${d.data().name}">${d.data().name}</option>`).join('');
    document.querySelectorAll('.bulk-cat').forEach(el => el.innerHTML = catOptions);

    // Image previews and storage
    const rowFileArrays = [[], [], [], [], []];

    document.querySelectorAll('.bulk-file-input').forEach((el, idx) => {
        el.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            const grid = document.getElementById(`bulkPrevGrid_${idx}`);

            // Append new files
            for (let file of files) {
                rowFileArrays[idx].push(file);
                const dataUrl = await createImagePreview(file);
                const prevItem = document.createElement('div');
                prevItem.className = 'preview-item mini';
                prevItem.innerHTML = `<img src="${dataUrl}" /><button type="button" class="remove-btn">×</button>`;

                const fileIdx = rowFileArrays[idx].length - 1;
                prevItem.querySelector('.remove-btn').onclick = () => {
                    rowFileArrays[idx].splice(fileIdx, 1);
                    prevItem.remove();
                };

                grid.appendChild(prevItem);
            }
        });
    });

    // Toggle visibility in bulk form
    document.querySelectorAll('.bulk-visible').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('active'));
    });

    document.getElementById('bulkProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveBulkBtn');
        const cards = document.querySelectorAll('.bulk-card');

        let validRows = [];
        cards.forEach((card, idx) => {
            const name = card.querySelector('.bulk-name').value.trim();
            if (name) {
                validRows.push({
                    idx,
                    name,
                    category: card.querySelector('.bulk-cat').value,
                    price: parseFloat(card.querySelector('.bulk-price').value) || 0,
                    gender: card.querySelector('.bulk-gender').value,
                    description: card.querySelector('.bulk-desc').value,
                    isVisible: card.querySelector('.bulk-visible').classList.contains('active'),
                    files: rowFileArrays[idx]
                });
            }
        });

        if (validRows.length === 0) {
            alert("Please enter at least one product name.");
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = `Saving 0/${validRows.length}...`;

        try {
            for (let i = 0; i < validRows.length; i++) {
                const item = validRows[i];
                saveBtn.textContent = `Saving ${i + 1}/${validRows.length}: ${item.name}...`;

                const pId = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now();
                const productData = {
                    name: item.name,
                    categories: item.category ? [item.category] : [],
                    category: item.category || "",
                    price: item.price,
                    gender: item.gender,
                    description: item.description || "",
                    stock: 1,
                    isFeatured: false,
                    isVisible: item.isVisible,
                    images: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Batch upload images for this product
                if (item.files && item.files.length > 0) {
                    const finalImages = [];
                    for (let f = 0; f < item.files.length; f++) {
                        const file = item.files[f];
                        const thumbResult = await optimizeImage(file, 'thumbnail');
                        const fullResult = await optimizeImage(file, 'full');
                        const timestamp = Date.now();
                        const thumbPath = `products/${pId}/thumb_${timestamp}_${f}.webp`;
                        const fullPath = `products/${pId}/full_${timestamp}_${f}.webp`;

                        await uploadBytes(ref(storage, thumbPath), thumbResult.blob);
                        await uploadBytes(ref(storage, fullPath), fullResult.blob);

                        const thumbUrl = await getDownloadURL(ref(storage, thumbPath));
                        const fullUrl = await getDownloadURL(ref(storage, fullPath));

                        finalImages.push({ thumbnail: thumbUrl, full: fullUrl });
                    }
                    productData.images = finalImages;
                }

                await setDoc(doc(db, "products", pId), productData);
            }

            renderProducts();
        } catch (err) {
            console.error("Bulk Save Error:", err);
            alert("Failed to save some products. Check console.");
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save All Products';
        }
    });
};

window.toggleProductVisibility = async (id, currentStatus, btn) => {
    // Optimistic UI Update
    const isNowVisible = !currentStatus;
    btn.classList.toggle('active', isNowVisible);

    // Update the onclick to maintain consistency without full re-render
    btn.setAttribute('onclick', `toggleProductVisibility('${id}', ${isNowVisible}, this)`);

    const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await updateDoc(doc(db, "products", id), { isVisible: isNowVisible });
    } catch (err) {
        console.error("Visibility Toggle Error:", err);
        // Revert UI on failure
        btn.classList.toggle('active', currentStatus);
        btn.setAttribute('onclick', `toggleProductVisibility('${id}', ${currentStatus}, this)`);
        alert("Failed to update visibility. Check connection.");
    }
};

window.editProduct = (id) => window.location.hash = `edit-product/${id}`;

window.deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await deleteDoc(doc(db, "products", id));
        renderProducts();
    } catch (err) {
        console.error("Delete Error:", err);
    }
};

window.toggleProductFeatured = async (id, currentStatus, btn) => {
    // Optimistic UI Update
    const isNowFeatured = !currentStatus;
    btn.classList.toggle('active', isNowFeatured);

    // Update the onclick for subsequent toggles
    btn.setAttribute('onclick', `toggleProductFeatured('${id}', ${isNowFeatured}, this)`);

    const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await updateDoc(doc(db, "products", id), { isFeatured: isNowFeatured });
    } catch (err) {
        console.error("Toggle Error:", err);
        // Revert UI on failure
        btn.classList.toggle('active', currentStatus);
        btn.setAttribute('onclick', `toggleProductFeatured('${id}', ${currentStatus}, this)`);
        alert("Failed to update featured status. Check connection.");
    }
};

// ── Categories Tab ───────────────────────────────────────
async function renderCategories() {
    adminContent.innerHTML = `
        <div class="tab-header-actions">
            <h2>Manage Categories</h2>
            <button class="btn btn-primary" onclick="openCategoryModal()">+ Add Category</button>
        </div>
        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Category Name</th>
                            <th>Slug</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminCategoryList">
                        <tr><td colspan="3" class="table-loading">Loading categories...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const categoryList = document.getElementById('adminCategoryList');
    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    if (activeTab !== 'categories') return;

    try {
        const querySnapshot = await getDocs(collection(db, "categories"));
        if (activeTab !== 'categories') return;
        const categoryList = document.getElementById('adminCategoryList');
        if (!categoryList) return;

        if (querySnapshot.empty) {
            categoryList.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-m)">No categories found.</td></tr>`;
            return;
        }

        categoryList.innerHTML = querySnapshot.docs.map(doc => {
            const cat = doc.data();
            return `
                <tr>
                    <td style="font-weight:600;color:var(--text-h)">${cat.name}</td>
                    <td><code style="font-size:0.85rem;color:var(--text-m)">${cat.slug}</code></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon delete" onclick="deleteCategory('${doc.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading categories:", e);
        categoryList.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--error)">Error loading data.</td></tr>`;
    }
}

window.openCategoryModal = async () => {
    document.getElementById('categoryModal').style.display = 'flex';
    const { createImagePreview } = await import('../js/image-optimizer.js');
    document.getElementById('catImageFile').onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const preview = await createImagePreview(file);
            const previewEl = document.getElementById('catImagePreview');
            previewEl.style.display = 'block';
            previewEl.innerHTML = `<img src="${preview}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    };
};

window.closeCatModal = () => {
    document.getElementById('categoryModal').style.display = 'none';
    document.getElementById('categoryForm').reset();
    document.getElementById('catImagePreview').style.display = 'none';
};

window.handleCategorySubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const name = document.getElementById('catName').value.trim();
    if (!name) return;

    btn.disabled = true;
    btn.textContent = 'Saving...';

    const { setDoc, doc, updateDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js");
    const { storage } = await import('../js/firebase-config.js');
    const { optimizeImage } = await import('../js/image-optimizer.js');

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    try {
        let imageData = {};
        const file = document.getElementById('catImageFile').files[0];
        if (file) {
            btn.textContent = 'Optimizing Image...';
            const thumb = await optimizeImage(file, 'thumbnail');
            const full = await optimizeImage(file, 'full');
            const ts = Date.now();
            await uploadBytes(ref(storage, `categories/${slug}_thumb_${ts}.webp`), thumb.blob);
            await uploadBytes(ref(storage, `categories/${slug}_full_${ts}.webp`), full.blob);
            imageData = {
                thumbnail: await getDownloadURL(ref(storage, `categories/${slug}_thumb_${ts}.webp`)),
                full: await getDownloadURL(ref(storage, `categories/${slug}_full_${ts}.webp`))
            };
        }

        await setDoc(doc(db, "categories", slug), {
            name: name,
            slug: slug,
            image: imageData
        });

        // Sync to Global Doc for Home Page 1-read optimization
        await syncCategoriesToGlobal();

        closeCatModal();
        renderCategories();
    } catch (err) {
        console.error("Error adding category:", err);
        alert("Failed to add category.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Category';
    }
};

async function syncCategoriesToGlobal() {
    const { collection, getDocs, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const snap = await getDocs(collection(db, "categories"));
    const categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await updateDoc(doc(db, "app_settings", "global"), { categories });
}

window.deleteCategory = async (id) => {
    if (!confirm("Are you sure? This may affect products in this category.")) return;

    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await deleteDoc(doc(db, "categories", id));
        await syncCategoriesToGlobal();
        renderCategories();
    } catch (err) {
        console.error("Error deleting category:", err);
    }
};

// ── Tags Tab ─────────────────────────────────────────────
async function renderTags() {
    adminContent.innerHTML = `
        <div class="tab-header-actions" style="margin-bottom:1rem;">
            <h2>Manage Tags</h2>
            <button class="btn btn-primary" onclick="window.openTagModal()">+ Add Tag</button>
        </div>

        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Tag Name</th>
                            <th>Affiliated Categories</th>
                            <th>ID/Slug</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminTagList">
                        <tr><td colspan="4" class="table-loading">Loading tags...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    try {
        const querySnapshot = await getDocs(collection(db, "tags"));
        if (activeTab !== 'tags') return;
        const tagList = document.getElementById('adminTagList');
        if (!tagList) return;

        if (querySnapshot.empty) {
            tagList.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-m);padding:2rem;">No tags found. Create one to get started!</td></tr>`;
            return;
        }

        tagList.innerHTML = querySnapshot.docs.map(doc => {
            const tag = doc.data();
            const categories = (tag.categories || []).join(', ') || '<span style="color:var(--text-m);font-style:italic">None</span>';
            return `
                <tr>
                    <td style="font-weight:600;color:var(--text-h)">${tag.name}</td>
                    <td>${categories}</td>
                    <td><code style="font-size:0.85rem;color:var(--text-m)">${doc.id}</code></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="window.openTagModal('${doc.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-icon delete" onclick="deleteTag('${doc.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading tags:", e);
        const tagList = document.getElementById('adminTagList');
        if (tagList) tagList.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--error)">Error loading data.</td></tr>`;
    }
}

window.openTagModal = async (tagId = null) => {
    const modal = document.getElementById('tagModal');
    const form = document.getElementById('tagForm');
    const title = document.getElementById('tagModalTitle');
    const nameInput = document.getElementById('tagName');
    const saveBtn = document.getElementById('saveTagBtn');

    modal.style.display = 'flex';
    form.reset();
    form.dataset.editId = tagId || '';
    title.textContent = tagId ? 'Edit Tag' : 'Add Tag';
    saveBtn.textContent = tagId ? 'Update Tag' : 'Save Tag';

    const { collection, getDocs, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    // Populate Categories Checkboxes
    const container = document.getElementById('tagCategoryCheckboxes');
    const catSnap = await getDocs(collection(db, "categories"));
    const categories = catSnap.docs.map(d => d.data().name);

    let activeCats = [];
    if (tagId) {
        const tDoc = await getDoc(doc(db, "tags", tagId));
        if (tDoc.exists()) {
            const data = tDoc.data();
            nameInput.value = data.name || '';
            activeCats = data.categories || [];
        }
    }

    container.innerHTML = categories.map(name => `
        <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; cursor:pointer;">
            <input type="checkbox" name="tagCats" value="${name}" ${activeCats.includes(name) ? 'checked' : ''} />
            ${name}
        </label>
    `).join('');
};

window.closeTagModal = () => {
    document.getElementById('tagModal').style.display = 'none';
};

window.handleTagSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const tagId = form.dataset.editId;
    const btn = document.getElementById('saveTagBtn');
    const name = document.getElementById('tagName').value.trim();
    if (!name) return;

    const checkboxes = document.querySelectorAll('input[name="tagCats"]:checked');
    const categories = Array.from(checkboxes).map(cb => cb.value);

    btn.disabled = true;
    btn.textContent = 'Saving...';

    const { setDoc, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    try {
        if (tagId) {
            // Update existing
            await updateDoc(doc(db, "tags", tagId), {
                name: name,
                categories: categories,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Create new
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            await setDoc(doc(db, "tags", slug), {
                name: name,
                slug: slug,
                categories: categories,
                createdAt: new Date().toISOString()
            });
        }

        await syncTagsToGlobal();
        closeTagModal();
        renderTags();
    } catch (err) {
        console.error("Error saving tag:", err);
        alert("Failed to save tag.");
    } finally {
        btn.disabled = false;
        btn.textContent = tagId ? 'Update Tag' : 'Save Tag';
    }
};

window.deleteTag = async (id) => {
    if (!confirm("Are you sure? This will remove the tag from the system.")) return;

    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await deleteDoc(doc(db, "tags", id));
        await syncTagsToGlobal();
        renderTags();
    } catch (err) {
        console.error("Error deleting tag:", err);
    }
};

async function syncTagsToGlobal() {
    const { collection, getDocs, doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const snap = await getDocs(collection(db, "tags"));
    const tags = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    await updateDoc(doc(db, "app_settings", "global"), { tags });
}



window.viewOrderDetails = async (orderId) => {
    try {
        const oDoc = await getDoc(doc(db, "orders", orderId));

        if (oDoc.exists()) {
            const o = oDoc.data();
            const orderNum = o.orderNumber || orderId.slice(-8).toUpperCase();
            const orderModalTitle = document.getElementById('orderModalTitle');
            if (orderModalTitle) orderModalTitle.textContent = `Order # ${orderNum}`;

            const customerName = o.customer?.name || o.customerName || 'Guest';
            const customerEmail = o.customer?.email || o.userEmail || 'N/A';
            const customerPhone = o.customer?.phone || o.phone || 'N/A';
            let addressStr = 'N/A';
            if (typeof o.address === 'object') {
                if (o.address.hostel && o.address.hostel !== 'Other') {
                    addressStr = `${o.address.hostel}${o.address.location ? ', ' + o.address.location : ''}`;
                } else {
                    addressStr = `${o.address.street || ''}${o.address.street ? ', ' : ''}${o.address.city || ''}${o.address.location ? ' (' + o.address.location + ')' : ''}`;
                }
            } else {
                addressStr = o.address || 'N/A';
            }

            const isPaid = o.payment?.status === 'paid' || o.paymentStatus === 'paid';
            const status = o.status || 'pending';
            const items = Array.isArray(o.items) ? o.items : [];

            const detailsContent = document.getElementById('orderDetailsContent');
            if (!detailsContent) return;

            detailsContent.innerHTML = `
                <div class="modal-section">
                    <div class="modal-section-title">Customer Information</div>
                    <div class="modal-grid">
                        <div>
                            <div class="modal-label">Name</div>
                            <div class="modal-value">${customerName}</div>
                        </div>
                        <div>
                            <div class="modal-label">Phone</div>
                            <div class="modal-value">
                                <a href="tel:${customerPhone}" style="color:var(--caramel);text-decoration:none">${customerPhone}</a>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top:1.5rem">
                        <div class="modal-label">Email</div>
                        <div class="modal-value">${customerEmail}</div>
                    </div>
                    <div style="margin-top:1.5rem">
                        <div class="modal-label">Delivery Address</div>
                        <div class="modal-value">${addressStr}</div>
                    </div>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Order Items</div>
                    <div style="display:flex;flex-direction:column;gap:1rem">
                        ${items.length > 0 ? items.map(item => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--milk);border-radius:12px">
                                <div style="display:flex;align-items:center;gap:1rem">
                                    ${item.image ? `<img src="${item.image}" style="width:40px;height:40px;object-fit:cover;border-radius:8px">` : ''}
                                    <div>
                                        <div style="font-weight:600;color:var(--text-h)">${item.name}</div>
                                        <div style="font-size:0.8125rem;color:var(--text-m)">Qty: ${item.quantity}</div>
                                    </div>
                                </div>
                                <div style="font-weight:600;color:var(--caramel)">GH₵${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        `).join('') : '<p style="color:var(--text-m)">No items recorded.</p>'}
                    </div>
                    <div style="margin-top:1.5rem;padding:1.5rem;background:var(--coffee);color:var(--cream);border-radius:12px;display:flex;justify-content:space-between;align-items:center">
                        <span style="font-family:var(--f-heading);font-size:0.75rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase">Total Amount</span>
                        <span style="font-family:var(--f-display);font-size:1.5rem;font-weight:600">GH₵${(o.totalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>

                <div class="modal-section" style="border-bottom:none">
                    <div class="modal-section-title">Payment & Status</div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div style="display:flex;gap:0.5rem">
                            <span class="status-badge status-${status.toLowerCase()}">${status.toUpperCase()}</span>
                            <span class="status-badge" style="background:${isPaid ? 'rgba(143, 170, 127, 0.12)' : 'rgba(193, 122, 92, 0.12)'};color:${isPaid ? 'var(--sage)' : 'var(--error)'}">
                                ${isPaid ? 'PAID' : 'PENDING PAYMENT'}
                            </span>
                        </div>
                        <div style="font-size:0.8125rem;color:var(--text-m)">Ref: ${o.payment?.ref || 'N/A'}</div>
                    </div>
                </div>
            `;

            // Update Footer Actions
            let footerHtml = `
                <button class="btn btn-outline" onclick="window.closeOrderModal()">Close</button>
            `;

            if (status !== 'delivered' && status !== 'cancelled') {
                if (!isPaid) {
                    footerHtml = `
                        <button class="btn btn-outline" style="border-color:var(--caramel);color:var(--caramel)" onclick="window.verifyOrderPayment('${orderId}', '${orderNum}')">🔍 Verify Payment</button>
                        ${footerHtml}
                    `;
                } else {
                    footerHtml = `
                        <button class="btn btn-primary" style="background:var(--sage)" onclick="window.updateDeliveryStatus('${orderId}', 'delivered')">🚚 Mark Delivered</button>
                        <button class="btn btn-outline" style="border-color:var(--error);color:var(--error)" onclick="window.updateDeliveryStatus('${orderId}', 'cancelled')">Cancel Order</button>
                        ${footerHtml}
                    `;
                }
            } else if (status === 'delivered') {
                footerHtml = `
                    <div style="margin-right:auto;font-family:var(--f-heading);font-size:0.75rem;font-weight:700;color:var(--sage)">✓ DELIVERED</div>
                    ${footerHtml}
                `;
            }

            const modalFooter = document.querySelector('.modal-footer');
            if (modalFooter) modalFooter.innerHTML = footerHtml;

            const orderModal = document.getElementById('orderModal');
            if (orderModal) {
                orderModal.style.display = 'flex';
                orderModal.style.opacity = '1';
                orderModal.style.visibility = 'visible';
            }
        }
    } catch (error) {
        console.error("View Order Details Error:", error);
        alert("Failed to load order details.");
    }
};


window.verifyOrderPayment = async (orderId, orderNum) => {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Verifying...';

    const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js");
    const functions = getFunctions();
    const verifyPayment = httpsCallable(functions, 'verifyPayment');

    try {
        const result = await verifyPayment({ reference: orderNum });
        if (result.data.success) {
            alert('Payment verified successfully!');
            viewOrderDetails(orderId); // Refresh modal
            renderOrders(); // Refresh list
        } else {
            alert('Payment not found or not successful yet.');
        }
    } catch (err) {
        console.error("Verify Error:", err);
        alert('Verification failed. Check console.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

window.updateDeliveryStatus = async (id, newStatus) => {
    if (!confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;

    const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await updateDoc(doc(db, "orders", id), { status: newStatus });
        viewOrderDetails(id); // Refresh modal
        renderOrders(); // Refresh list
    } catch (err) {
        console.error("Update Order Error:", err);
        alert("Failed to update order.");
    }
};

window.closeOrderModal = () => document.getElementById('orderModal').style.display = 'none';

window.updateOrderStatus = async (id, newStatus) => {
    const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await updateDoc(doc(db, "orders", id), { status: newStatus });
        renderOrders();
    } catch (err) {
        console.error("Update Order Error:", err);
    }
};

// ── Users Tab ────────────────────────────────────────────
async function renderUsers() {
    adminContent.innerHTML = `
        <div class="tab-header-actions">
            <h2>Manage Users</h2>
        </div>
        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminUserList">
                        <tr><td colspan="5" class="table-loading">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const userList = document.getElementById('adminUserList');
    const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    if (activeTab !== 'users') return;

    try {
        const querySnapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
        if (activeTab !== 'users') return;
        const userList = document.getElementById('adminUserList');
        if (!userList) return;

        if (querySnapshot.empty) {
            userList.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-m)">No users found.</td></tr>`;
            return;
        }

        userList.innerHTML = querySnapshot.docs.map(doc => {
            const u = doc.data();
            const joinedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
            return `
                <tr>
                    <td style="font-weight:600;color:var(--text-h)">${u.name || 'Anonymous'}</td>
                    <td>${u.email}</td>
                    <td>
                        <span class="status-badge ${u.role === 'admin' ? 'status-delivered' : 'status-processing'}">
                            ${u.role || 'user'}
                        </span>
                    </td>
                    <td style="color:var(--text-m)">${joinedDate}</td>
                    <td>
                        <button class="btn btn-outline" style="padding:0.5rem 1rem;font-size:0.7rem" 
                                onclick="toggleUserRole('${doc.id}', '${u.role}')">
                            Make ${u.role === 'admin' ? 'User' : 'Admin'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading users:", e);
        userList.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--error)">Error loading data.</td></tr>`;
    }
}

window.toggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;

    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        renderUsers();
    } catch (err) {
        console.error("Update Role Error:", err);
        alert("Failed to update role. Check permissions.");
    }
};

// ── Settings Tab ─────────────────────────────────────────
async function renderSettings() {
    adminContent.innerHTML = `
            <div class="settings-card">
                <h3>Store Status</h3>
                <div class="setting-item">
                    <div class="setting-info">
                        <span class="setting-name">Accepting Orders</span>
                        <p class="setting-desc">Toggles whether customers can place new orders.</p>
                    </div>
                    <button class="toggle-switch" id="settingsOrderToggle" style="width:48px;height:26px">
                        <span class="toggle-slider"></span>
                    </button>
                </div>
                <div class="setting-item" style="border-top: 1px solid var(--sand); padding-top: 1.5rem; margin-top: 1.5rem">
                    <div class="setting-info">
                        <span class="setting-name">Use Hardcoded Products</span>
                        <p class="setting-desc">When enabled, the shop uses the local 'products-data.js' file. Disable to use live Firestore products.</p>
                    </div>
                    <button class="toggle-switch" id="dataToggle" style="width:48px;height:26px">
                        <span class="toggle-slider"></span>
                    </button>
                </div>
            </div>

            <div class="settings-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem">
                    <h3>Home Page Content</h3>
                    <button class="btn btn-primary" id="saveGlobalSettingsBtn" onclick="saveAllHomeSettings()">Save All Changes</button>
                </div>
                
                <!-- Hero Section -->
                <div class="settings-group-title">Hero Section</div>
                <div class="form-grid" style="grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2rem">
                    <div class="form-group">
                        <label>Subtitle</label>
                        <textarea id="heroSub" rows="2" placeholder="Basic and affordable care at your doorstep."></textarea>
                    </div>
                </div>

                <!-- Founder & Mission -->
                <div class="settings-group-title">Founder & Mission</div>
                <div class="form-grid" style="grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2rem">
                    <div class="form-group">
                        <label>Founder Name</label>
                        <input type="text" id="founderName" placeholder="Nana Akua Sasu">
                    </div>
                    <div class="form-group">
                        <label>Founder Bio</label>
                        <textarea id="founderBio" rows="4" placeholder="Description of the founder..."></textarea>
                    </div>
                </div>
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1.5rem; border-top: 1px solid var(--sand); padding-top: 1.5rem">
                         <div class="form-group">
                            <label>Mission Title</label>
                            <input type="text" id="missionTitle" placeholder="Beauty with Intention.">
                        </div>
                        <div class="form-group">
                            <label>Mission Icon (Emoji)</label>
                            <input type="text" id="missionIcon" placeholder="🌿">
                        </div>
                        <div class="form-group full">
                            <label>Mission Text</label>
                            <textarea id="missionText" rows="4"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Ticker Content -->
              <!--  <div class="settings-group-title">Ticker Items (One per line)</div>
                <div class="form-group full" style="margin-bottom: 2rem">
                    <textarea id="tickerItems" rows="5" placeholder="Pocket Friendly&#10;Glow naturally"></textarea>
                </div>-->
                
                <!-- Social Links -->
                <div class="settings-group-title">Social Links</div>
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem">
                    <div class="form-group">
                        <label>Instagram URL</label>
                        <input type="url" id="socialInsta" placeholder="https://instagram.com/...">
                        <div class="visibility-toggle" style="margin-top:0.5rem">
                            <input type="checkbox" id="socialInstaVis" checked> <span style="font-size:0.75rem">Visible</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>WhatsApp Number</label>
                        <input type="text" id="socialWhatsapp" placeholder="+233 ...">
                        <div class="visibility-toggle" style="margin-top:0.5rem">
                            <input type="checkbox" id="socialWhatsappVis" checked> <span style="font-size:0.75rem">Visible</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>TikTok URL</label>
                        <input type="url" id="socialTiktok" placeholder="https://tiktok.com/@...">
                        <div class="visibility-toggle" style="margin-top:0.5rem">
                            <input type="checkbox" id="socialTiktokVis" checked> <span style="font-size:0.75rem">Visible</span>
                        </div>
                    </div>
                </div>

                <!-- Reviews - Commented out per user request -->
                <!-- <div class="settings-group-title">Customer Reviews</div>
                <div id="reviewsManager" style="display:flex; flex-direction:column; gap: 1.5rem; margin-bottom: 2rem">
                </div>
                <button class="btn btn-outline" onclick="addReviewRow()">+ Add Review Card</button> -->

            </div>
        </div>
    `;

    // Initialize Toggles from Firestore
    const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
    const data = settingsDoc.exists() ? settingsDoc.data() : {};

    // Toggles
    const sOrderToggle = document.getElementById('settingsOrderToggle');
    const sDataToggle = document.getElementById('dataToggle');
    sOrderToggle.classList.toggle('active', !!data.acceptingOrders);
    sDataToggle.classList.toggle('active', !!data.useHardcodedData);
    sOrderToggle.onclick = () => toggleGlobalSetting('acceptingOrders', sOrderToggle);
    sDataToggle.onclick = () => toggleGlobalSetting('useHardcodedData', sDataToggle);

    // Populate Section Values from Firestore (Seeded if empty)
    if (!data.hero && !data.mission && !data.socials) {
        console.log("Seeding admin settings with hardcoded defaults...");
        // 1. Hero
        document.getElementById('heroSub').value = "Basic and affordable care at your doorstep.";

        // 2. Founder & Mission
        document.getElementById('founderName').value = "Nana Akua Sasu";
        document.getElementById('founderBio').value = "Driven by a passion for accessible beauty, Nana Akua founded Shine On Cosmetics with a clear vision: to bring high-quality skincare to every doorstep, regardless of budget.";

        document.getElementById('missionTitle').value = "Beauty with Intention.";
        document.getElementById('missionIcon').value = "🌿";
        document.getElementById('missionText').value = "We started Shine On with one conviction: high-performance skincare should be within everyone's reach. No compromise. No luxury tax. Just pure, effective care — delivered to your door.";

        // 3. Socials
        const defaultSocials = {
            instagram: 'https://www.instagram.com/n.akua_sasu',
            tiktok: 'https://www.tiktok.com/@nanaakuasasu',
            whatsapp: ''
        };
        document.getElementById('socialInsta').value = defaultSocials.instagram;
        document.getElementById('socialInstaVis').checked = true;
        document.getElementById('socialTiktok').value = defaultSocials.tiktok;
        document.getElementById('socialTiktokVis').checked = true;
        document.getElementById('socialWhatsapp').value = defaultSocials.whatsapp;
        document.getElementById('socialWhatsappVis').checked = true;
    } else {
        // Load existing dynamic data
        if (data.hero) {
            document.getElementById('heroSub').value = data.hero.sub || '';
        }
        if (data.mission) {
            const { founder, story } = data.mission;
            if (founder) {
                document.getElementById('founderName').value = founder.name || '';
                document.getElementById('founderBio').value = founder.description || '';
            }
            if (story) {
                document.getElementById('missionTitle').value = story.title || '';
                document.getElementById('missionIcon').value = story.icon || '';
                document.getElementById('missionText').value = story.text || '';
            }
        }
        if (data.socials) {
            document.getElementById('socialInsta').value = data.socials.instagram?.url || '';
            document.getElementById('socialInstaVis').checked = data.socials.instagram?.visible !== false;
            document.getElementById('socialWhatsapp').value = data.socials.whatsapp?.url || '';
            document.getElementById('socialWhatsappVis').checked = data.socials.whatsapp?.visible !== false;
            document.getElementById('socialTiktok').value = data.socials.tiktok?.url || '';
            document.getElementById('socialTiktokVis').checked = data.socials.tiktok?.visible !== false;
        }
    }

    // Reviews
    const reviewsManager = document.getElementById('reviewsManager');
    /*
    if (!data.reviews || data.reviews.length === 0) {
        // ... (seed data)
    } else {
        window.homeReviews = data.reviews.map(r => ({ ...r, isCollapsed: true }));
    }
    renderReviewRows();
    */

    const { optimizeImage, createImagePreview } = await import('../js/image-optimizer.js');

    // Preview listeners
    const heroInput = document.getElementById('heroImageFile');
    if (heroInput) {
        heroInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const preview = await createImagePreview(file);
                document.getElementById('heroImagePreview').innerHTML = `<img src="${preview}" style="width:100px; border-radius:8px; border:2px solid var(--caramel)">`;
            }
        };
    }

    const founderInput = document.getElementById('founderImageFile');
    if (founderInput) {
        founderInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const preview = await createImagePreview(file);
                document.getElementById('founderImagePreview').innerHTML = `<img src="${preview}" style="width:100px; border-radius:8px; border:2px solid var(--caramel)">`;
            }
        };
    }
}

function renderReviewRows() {
    const container = document.getElementById('reviewsManager');
    if (!container) return;
    const canDelete = window.homeReviews.length > 3;

    container.innerHTML = window.homeReviews.map((r, i) => `
        <div class="review-edit-card ${r.isCollapsed ? 'collapsed' : ''}" style="background:var(--milk); padding:1rem; border-radius:12px; position:relative; border: 1px solid ${r.visible !== false ? 'var(--caramel)' : 'var(--sand)'}; transition: all 0.3s">
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="toggleReviewCollapse(${i})">
                <div style="display:flex; align-items:center; gap: 1rem">
                    <div style="width:32px; height:32px; background:var(--sand); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem">${r.name?.charAt(0) || 'U'}</div>
                    <div>
                        <div style="font-weight:600; color:var(--text-h)">${r.name || 'New Review'}</div>
                        <div style="font-size:0.7rem; color:var(--text-m)">${r.role || 'No role'}</div>
                    </div>
                    ${r.visible === false ? '<span style="font-size:0.6rem; background:var(--sand); padding:2px 6px; border-radius:4px; color:var(--text-m)">HIDDEN</span>' : ''}
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center">
                     <span style="font-size:0.8rem; transform: rotate(${r.isCollapsed ? '0deg' : '180deg'}); transition: transform 0.3s">▼</span>
                </div>
            </div>

            <div class="review-card-content" style="display: ${r.isCollapsed ? 'none' : 'block'}; margin-top: 1.5rem; border-top: 1px solid var(--sand); padding-top: 1.5rem">
                ${canDelete ? `<button class="btn-icon delete" onclick="removeReviewRow(${i})" style="position:absolute; top:1rem; right:1rem">×</button>` : ''}
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap:1rem">
                    <div class="form-group">
                        <label>Customer Name</label>
                        <input type="text" class="rev-name" value="${r.name || ''}" oninput="updateReviewData(${i}, 'name', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Role / Badge</label>
                        <input type="text" class="rev-role" value="${r.role || ''}" oninput="updateReviewData(${i}, 'role', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Stars (1-5)</label>
                        <input type="number" class="rev-stars" min="1" max="5" value="${r.stars || 5}" oninput="updateReviewData(${i}, 'stars', parseInt(this.value))">
                    </div>
                    <div class="form-group">
                        <label>Visibility</label>
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem">
                            <input type="checkbox" ${r.visible !== false ? 'checked' : ''} onchange="updateReviewData(${i}, 'visible', this.checked); renderReviewRows()">
                            <span style="font-size:0.8rem; color:var(--text-m)">Show on Website</span>
                        </div>
                    </div>
                    <div class="form-group full">
                        <label>Review Text</label>
                        <textarea class="rev-text" rows="3" oninput="updateReviewData(${i}, 'text', this.value)">${r.text || ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

window.toggleReviewCollapse = (i) => {
    window.homeReviews[i].isCollapsed = !window.homeReviews[i].isCollapsed;
    renderReviewRows();
};

window.addReviewRow = () => {
    window.homeReviews.push({ name: '', role: '', stars: 5, avatar: '', text: '', visible: true, isCollapsed: false });
    renderReviewRows();
};

window.removeReviewRow = (i) => {
    if (window.homeReviews.length <= 3) return; // double check
    window.homeReviews.splice(i, 1);
    renderReviewRows();
};

window.updateReviewData = (i, field, val) => {
    window.homeReviews[i][field] = val;
};

window.saveAllHomeSettings = async () => {
    const btn = document.getElementById('saveGlobalSettingsBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const { doc, getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const { ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js");
    const { storage } = await import('../js/firebase-config.js');
    const { optimizeImage } = await import('../js/image-optimizer.js');

    try {
        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        const currentData = settingsDoc.exists() ? settingsDoc.data() : {};

        const newData = {
            hero: {
                sub: document.getElementById('heroSub').value,
                image: currentData.hero?.image || {}
            },
            mission: {
                founder: {
                    name: document.getElementById('founderName').value,
                    description: document.getElementById('founderBio').value,
                    image: currentData.mission?.founder?.image || {}
                },
                story: {
                    title: document.getElementById('missionTitle').value,
                    icon: document.getElementById('missionIcon').value,
                    text: document.getElementById('missionText').value
                }
            },
            socials: {
                instagram: {
                    url: document.getElementById('socialInsta')?.value || '',
                    visible: document.getElementById('socialInstaVis')?.checked ?? true
                },
                tiktok: {
                    url: document.getElementById('socialTiktok')?.value || '',
                    visible: document.getElementById('socialTiktokVis')?.checked ?? true
                },
                whatsapp: {
                    url: document.getElementById('socialWhatsapp')?.value || '',
                    visible: document.getElementById('socialWhatsappVis')?.checked ?? true
                }
            }
        };

        // Handle Images
        const heroFile = document.getElementById('heroImageFile')?.files[0];
        if (heroFile) {
            btn.textContent = 'Optimizing Hero...';
            const thumb = await optimizeImage(heroFile, 'thumbnail');
            const full = await optimizeImage(heroFile, 'full');
            const ts = Date.now();
            await uploadBytes(ref(storage, `settings/hero_thumb_${ts}.webp`), thumb.blob);
            await uploadBytes(ref(storage, `settings/hero_full_${ts}.webp`), full.blob);
            newData.hero.image = {
                thumbnail: await getDownloadURL(ref(storage, `settings/hero_thumb_${ts}.webp`)),
                full: await getDownloadURL(ref(storage, `settings/hero_full_${ts}.webp`))
            };
        }

        await updateDoc(doc(db, "app_settings", "global"), newData);
        alert('Home page settings updated successfully! ✨');
        renderSettings();
    } catch (err) {
        console.error("Save Settings Error:", err);
        alert('Failed to save settings.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save All Changes';
    }
};

async function toggleGlobalSetting(field, element) {
    const isNowActive = !element.classList.contains('active');
    element.classList.toggle('active', isNowActive);

    // Also sync the header toggle if it's the order toggle
    if (field === 'acceptingOrders' && orderToggle) {
        orderToggle.classList.toggle('active', isNowActive);
    }

    try {
        await updateDoc(doc(db, "app_settings", "global"), {
            [field]: isNowActive
        });
        console.log(`Setting updated: ${field} =`, isNowActive);
    } catch (e) {
        console.error("Error updating settings:", e);
    }
}

window.syncHardcodedToFirestore = async function () {
    const btn = document.getElementById('syncBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Syncing... ⏳";

    try {
        const { products } = await import('../js/products-data.js');
        const { collection, setDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        for (const p of products) {
            await setDoc(doc(db, "products", p.id.toString()), {
                ...p,
                active: true,
                updatedAt: new Date().toISOString()
            });
        }
        alert(`Successfully synced ${products.length} products to Firestore! ✨`);
    } catch (e) {
        console.error("Sync Error:", e);
        alert("Failed to sync products. Check console.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

// ── Global Actions ───────────────────────────────────────
document.getElementById('adminLogout').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "../auth.html");
});

async function renderContacts() {
    adminContent.innerHTML = `
        <div class="tab-header-actions" style="margin-bottom:1rem;">
            <h2>Customer Inquiries</h2>
            <p style="color:var(--text-m); font-size:0.9rem;">View and manage messages from your customers.</p>
        </div>

        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminContactList">
                        <tr><td colspan="5" class="table-loading">Loading inquiries...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    try {
        const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (activeTab !== 'contacts') return;
        const contactList = document.getElementById('adminContactList');
        if (!contactList) return;

        if (querySnapshot.empty) {
            contactList.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-m);padding:3rem;">No inquiries found. When customers send messages, they will appear here!</td></tr>`;
            return;
        }

        contactList.innerHTML = querySnapshot.docs.map(doc => {
            const contact = doc.data();
            const date = new Date(contact.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <tr>
                    <td style="font-size:0.8rem; white-space:nowrap; color:var(--text-m)">${date}</td>
                    <td>
                        <div style="font-weight:600; color:var(--text-h)">${contact.name}</div>
                        <div style="font-size:0.8rem; color:var(--text-m)">${contact.email}</div>
                    </td>
                    <td><span class="badge" style="background:var(--cream); color:var(--coffee); font-size:0.7rem;">${contact.subject}</span></td>
                    <td>
                        <div style="max-width:300px; font-size:0.9rem; line-height:1.4; color:var(--text-m); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${contact.message}
                        </div>
                    </td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="viewInquiry('${doc.id}')" title="View"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn-icon delete" onclick="deleteContact('${doc.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading contacts:", e);
        const contactList = document.getElementById('adminContactList');
        if (contactList) contactList.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--error)">Error loading data.</td></tr>`;
    }
}

window.viewInquiry = async (id) => {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const inquiryModal = document.getElementById('inquiryModal');
    const inquiryContent = document.getElementById('inquiryDetailsContent');

    if (!inquiryModal || !inquiryContent) return;

    inquiryContent.innerHTML = `<div class="table-loading">Loading details...</div>`;
    inquiryModal.classList.add('active');

    try {
        const docSnap = await getDoc(doc(db, "contacts", id));
        if (docSnap.exists()) {
            const contact = docSnap.data();
            const date = new Date(contact.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            inquiryContent.innerHTML = `
                <div class="inquiry-details" style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="detail-group">
                        <label style="color:var(--text-m); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">From</label>
                        <div style="font-weight:600; font-size:1.1rem; color:var(--text-h)">${contact.name}</div>
                        <div style="color:var(--text-secondary)">${contact.email}</div>
                    </div>
                    
                    <div class="detail-group">
                        <label style="color:var(--text-m); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Received on</label>
                        <div style="color:var(--text-h)">${date}</div>
                    </div>

                    <div class="detail-group">
                        <label style="color:var(--text-m); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Subject</label>
                        <div style="font-weight:600; color:var(--caramel)">${contact.subject}</div>
                    </div>

                    <div class="detail-group">
                        <label style="color:var(--text-m); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Message</label>
                        <div style="white-space:pre-wrap; background:var(--cream); padding:1.5rem; border-radius:12px; color:var(--text-h); line-height:1.6; border:1px solid var(--color-sand);">
                            ${contact.message}
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error viewing inquiry:", e);
        inquiryContent.innerHTML = `<div style="color:var(--error)">Failed to load inquiry details.</div>`;
    }
};

window.closeInquiryModal = () => {
    document.getElementById('inquiryModal')?.classList.remove('active');
};

window.deleteContact = async (id) => {
    if (!confirm("Remove this inquiry permanently?")) return;

    const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    try {
        await deleteDoc(doc(db, "contacts", id));
        renderContacts();
    } catch (err) {
        console.error("Error deleting contact:", err);
    }
};