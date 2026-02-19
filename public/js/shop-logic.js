import { products, searchProducts } from './products-data.js';

let filteredProducts = [...products];
let currentCategory = 'all';
let currentSort = 'featured';
let minPrice = 0;
let maxPrice = Infinity;
let inStockOnly = false;

// Initialize shop page
function initShop() {
    setupEventListeners();
    updateCategoryCounts();
    checkURLParams();
    renderProducts();
}

// Setup all event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterProducts();
            }, 300);
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // Category filters
    const categoryFilters = document.querySelectorAll('.filter-item');
    categoryFilters.forEach(item => {
        item.addEventListener('click', () => {
            categoryFilters.forEach(f => f.classList.remove('active'));
            item.classList.add('active');
            currentCategory = item.dataset.category;
            filterProducts();
        });
    });

    // Price range
    const applyPriceBtn = document.getElementById('applyPriceFilter');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', applyPriceFilter);
    }

    // In stock checkbox
    const inStockCheckbox = document.getElementById('inStockOnly');
    if (inStockCheckbox) {
        inStockCheckbox.addEventListener('change', (e) => {
            inStockOnly = e.target.checked;
            filterProducts();
        });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// Check URL parameters for category
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat');

    if (category) {
        const categoryItem = document.querySelector(`[data-category="${category}"]`);
        if (categoryItem) {
            document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active'));
            categoryItem.classList.add('active');
            currentCategory = category;
        }
    }
}

// Update category counts
function updateCategoryCounts() {
    const categories = ['all', 'Skin', 'Glow', 'Scents', 'Essentials'];

    categories.forEach(cat => {
        const count = cat === 'all'
            ? products.length
            : products.filter(p => p.category === cat).length;

        const filterItem = document.querySelector(`[data-category="${cat}"] .filter-count`);
        if (filterItem) {
            filterItem.textContent = `(${count})`;
        }
    });
}

// Apply price filter
function applyPriceFilter() {
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');

    minPrice = minInput.value ? parseFloat(minInput.value) : 0;
    maxPrice = maxInput.value ? parseFloat(maxInput.value) : Infinity;

    if (minPrice > maxPrice && maxPrice !== Infinity) {
        if (window.showNotification) {
            window.showNotification('Min price cannot be greater than max price', 'error');
        } else {
            alert('Min price cannot be greater than max price');
        }
        return;
    }

    filterProducts();
}

// Clear all filters
function clearAllFilters() {
    // Reset category
    document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active'));
    document.querySelector('[data-category="all"]').classList.add('active');
    currentCategory = 'all';

    // Reset search
    const searchInput = document.getElementById('productSearch');
    if (searchInput) searchInput.value = '';

    // Reset price
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    minPrice = 0;
    maxPrice = Infinity;

    // Reset stock
    const inStockCheckbox = document.getElementById('inStockOnly');
    if (inStockCheckbox) inStockCheckbox.checked = false;
    inStockOnly = false;

    // Reset sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';
    currentSort = 'featured';

    filterProducts();
}

// Filter products based on all criteria
function filterProducts() {
    const searchInput = document.getElementById('productSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    filteredProducts = products.filter(product => {
        // Category filter
        if (currentCategory !== 'all' && product.category !== currentCategory) {
            return false;
        }

        // Search filter
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) &&
            !product.description.toLowerCase().includes(searchTerm) &&
            !product.category.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Price filter
        if (product.price < minPrice || product.price > maxPrice) {
            return false;
        }

        // Stock filter
        if (inStockOnly && product.stock === 0) {
            return false;
        }

        return true;
    });

    renderProducts();
}

// Sort products
function sortProducts(products) {
    const sorted = [...products];

    switch (currentSort) {
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'featured':
        default:
            return sorted.sort((a, b) => {
                if (a.isFeatured && !b.isFeatured) return -1;
                if (!a.isFeatured && b.isFeatured) return 1;
                return 0;
            });
    }
}

// Render products to grid
function renderProducts() {
    const grid = document.getElementById('shopGrid');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');

    if (!grid) return;

    const sortedProducts = sortProducts(filteredProducts);

    // Update results count
    if (resultsCount) {
        const count = sortedProducts.length;
        resultsCount.textContent = count === 0
            ? 'No products found'
            : count === 1
                ? 'Showing 1 product'
                : `Showing ${count} products`;
    }

    // Show/hide no results message
    if (sortedProducts.length === 0) {
        grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    } else {
        grid.style.display = 'grid';
        if (noResults) noResults.style.display = 'none';
    }

    // Render product cards
    grid.innerHTML = sortedProducts.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.05}s" data-product-id="${product.id}">
            <div class="card-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.stock === 0 ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                ${product.isFeatured ? '<div class="featured-badge">✨ Featured</div>' : ''}
            </div>
            <div class="product-info-minimal">
                <span class="category-tag">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
            </div>
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const productId = card.dataset.productId;
            window.location.href = `/product?id=${productId}`;
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initShop);

// Add CSS for badges
const style = document.createElement('style');
style.textContent = `
    .card-img {
        position: relative;
    }
    
    .out-of-stock-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(193, 122, 92, 0.95);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        z-index: 2;
    }
    
    .featured-badge {
        position: absolute;
        top: 1rem;
        left: 1rem;
        background: rgba(168, 191, 150, 0.95);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 100px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        z-index: 2;
    }
`;
document.head.appendChild(style);