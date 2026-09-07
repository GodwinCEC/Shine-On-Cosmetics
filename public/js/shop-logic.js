// <!-- ════════ SCRIPT ════════ -->
import { products as hardcodedProducts } from "./products-data.js";
import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Helpers ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (s) => [...document.querySelectorAll(s)];

// ── State ────────────────────────────────────────────────
window.acceptingOrders = true;
let products = [...hardcodedProducts];
let filtered = [];
let categories = []; // Multiple categories supported
let gender = "all";
let sortMode = "featured";
let minPrice = 0;
let maxPrice = Infinity;
let stockOnly = false;
let searchTerm = "";
let selectedTags = [];
let globalTags = [];
let page = 1;
const PER_PAGE = 12;
let isFirstLoad = true;
let isLoading = false;

// ── Initialization ───────────────────────────────────────
async function bootShop() {
    setLoading(true);
    try {
        const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.acceptingOrders === false) window.acceptingOrders = false;

            if (data.useHardcodedData === false) {
                console.log("☁️ Loading live data from Firestore...");
                const querySnapshot = await getDocs(collection(db, "products"));
                const liveProducts = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.isVisible !== false) liveProducts.push({ id: doc.id, ...data });
                });
                if (liveProducts.length > 0) {
                    products = liveProducts;
                }
            } else {
                console.log("📦 Using hardcoded local data.");
            }
            
            globalTags = data.tags || [];
        }
    } catch (e) {
        console.error("Shop Boot Error:", e);
    }

    // Update category counts after data is loaded
    updateCategoryCounts();

    // Initial Filter & Render
    setLoading(false);
    runFilter();
}

function setLoading(state) {
    isLoading = state;
    const body = document.body;
    if (state) {
        body.classList.add("is-loading");
        renderSkeletons(8);
    } else {
        body.classList.remove("is-loading");
    }
}

function renderSkeletons(count) {
    const grid = $("shopGrid");
    if (!grid) return;

    grid.innerHTML = Array(count).fill(0).map(() => `
        <div class="skel-card">
            <div class="skel-img skeleton"></div>
            <div class="skel-info">
                <div class="skel-cat skeleton"></div>
                <div class="skel-name skeleton"></div>
                <div class="skel-price skeleton"></div>
            </div>
        </div>
    `).join("");
}

function updateCategoryCounts() {
    ["all", "Face", "Skin", "Hair"].forEach((c) => {
        const n =
            c === "all"
                ? products.length
                : products.filter((p) => 
                    p.categories && Array.isArray(p.categories) ? p.categories.includes(c) : p.category === c
                  ).length;
        const el = $(`count-${c}`);
        if (el) el.textContent = `(${n})`;
    });
}


// ── Cart ─────────────────────────────────────────────────
const getCart = () => JSON.parse(localStorage.getItem("cart") || "[]");
const saveCart = (c) => localStorage.setItem("cart", JSON.stringify(c));

// Array updates for Firebase
async function syncUserArrayToFirestore(type, itemOrList) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return; // Only sync if logged in

    try {
        const user = JSON.parse(userStr);
        const { db } = await import('./firebase-config.js');
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        const userRef = doc(db, 'users', user.uid);

        // Optimistically sync whatever is in local storage directly to the array
        const listStr = localStorage.getItem(type) || '[]';
        const listItems = JSON.parse(listStr);

        const updateObj = {};
        if (type === 'wishlist') {
            updateObj.favorites = listItems.map(p => p.id);
        } else {
            updateObj.cart = listItems;
        }

        await setDoc(userRef, updateObj, { merge: true });
    } catch (err) {
        console.error("Error syncing to Firestore:", err);
    }
}

window.shopAddToCart = async function (id) {
    if (!window.acceptingOrders) {
        showToast("We aren't currently accepting orders, but you can add items to your wishlist!", "error");
        return;
    }
    const p = products.find((p) => p.id === id || p.id === parseInt(id));
    if (!p) return; // Removed stock check
    const cart = getCart();
    const ex = cart.find((i) => i.id === p.id);
    if (ex) ex.quantity++;
    else cart.push({ ...p, quantity: 1 });
    saveCart(cart);
    syncUserArrayToFirestore("cart");

    // Use the component's update function
    if (window.updateCartDisplay) window.updateCartDisplay();

    showToast(`${p.name} added to cart 🛍️`, "success");
};

// ── Toast ────────────────────────────────────────────────
function showToast(msg, type = "") {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast show" + (type ? " " + type : "");
    setTimeout(() => (el.className = "toast"), 3400);
}
// Globally expose for components
window.showNotification = showToast;

// ── Sidebar ──────────────────────────────────────────────
const sidebar = $("shopSidebar");
const sidebarScrim = $("sidebarScrim");
function openSidebar() {
    sidebar.classList.add("open");
    sidebarScrim.classList.add("open");
    document.body.style.overflow = "hidden";
}
function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarScrim.classList.remove("open");
    document.body.style.overflow = "";
}
$("filterToggleBtn")?.addEventListener("click", openSidebar);
$("closeSidebar")?.addEventListener("click", closeSidebar);
sidebarScrim?.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeSidebar();
    }
});

// ── FABs ─────────────────────────────────────────────────
$("fabCart")?.addEventListener(
    "click",
    () => (window.location.href = "cart.html"),
);
$("fabTop")?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
);
$("filterFab")?.addEventListener("click", openSidebar);

// ── Scroll ───────────────────────────────────────────────
const fabGroup = $("fabGroup");
const filterFab = $("filterFab");
window.addEventListener(
    "scroll",
    () => {
        const threshold = 500;
        const visible = window.scrollY > threshold;
        fabGroup?.classList.toggle("visible", visible);
        filterFab?.classList.toggle("visible", visible);
    },
    { passive: true },
);

// ── URL params ───────────────────────────────────────────
const urlCat = new URLSearchParams(window.location.search).get("cat");
if (urlCat) {
    const item = document.querySelector(`[data-category="${urlCat}"]`);
    if (item) {
        if (urlCat === "all") {
            categories = [];
        } else {
            categories = [urlCat];
            $$(".filter-item").forEach((f) => f.classList.remove("active"));
            item.classList.add("active");
        }
    }
}
const urlGen = new URLSearchParams(window.location.search).get("gender");
if (urlGen) {
    const item = document.querySelector(`[data-gender="${urlGen}"]`);
    if (item) {
        $$(".filter-item-gender").forEach((f) => f.classList.remove("active"));
        item.classList.add("active");
        gender = urlGen;
    }
}

// ── Filter events ────────────────────────────────────────
$$(".filter-item").forEach((item) => {
    item.addEventListener("click", () => {
        const cat = item.dataset.category;

        if (cat === "all") {
            categories = [];
            $$(".filter-item").forEach((f) => f.classList.remove("active"));
            item.classList.add("active");
        } else {
            // Remove "all" active state
            document.querySelector('[data-category="all"]')?.classList.remove("active");

            if (categories.includes(cat)) {
                // Deselect
                categories = categories.filter(c => c !== cat);
                item.classList.remove("active");
                // If nothing left, set "all" back
                if (categories.length === 0) {
                    document.querySelector('[data-category="all"]')?.classList.add("active");
                }
            } else {
                // Select
                categories.push(cat);
                item.classList.add("active");
            }
        }

        page = 1;
        renderTagFilters();
        runFilter();
    });
});

function renderTagFilters() {
    const group = $("tagFilterGroup");
    const list = $("tagFilterList");
    if (!group || !list) return;

    // Only show if exactly one category is selected (or if the user wants it differently, but usually tags are category-scoped)
    // Actually, let's show tags that belong to ANY of the selected categories.
    if (categories.length === 0) {
        group.style.display = "none";
        selectedTags = []; // Clear tags if no category
        return;
    }

    const relevantTags = globalTags.filter(t => 
        t.categories && t.categories.some(c => categories.includes(c))
    );

    if (relevantTags.length === 0) {
        group.style.display = "none";
        selectedTags = []; 
        return;
    }

    group.style.display = "block";
    list.innerHTML = relevantTags.map(t => {
        const isActive = selectedTags.includes(t.id);
        return `
            <li class="filter-item ${isActive ? 'active' : ''}" data-tag="${t.id}">
                <span>${t.name}</span>
                ${isActive ? '<i class="fas fa-times filter-x"></i>' : ''}
            </li>
        `;
    }).join('');

    // Add click listeners to tags
    list.querySelectorAll('.filter-item').forEach(item => {
        item.onclick = () => {
            const tagId = item.dataset.tag;
            if (selectedTags.includes(tagId)) {
                selectedTags = selectedTags.filter(id => id !== tagId);
            } else {
                selectedTags.push(tagId);
            }
            renderTagFilters();
            page = 1;
            runFilter();
        };
    });
}

$$(".filter-item-gender").forEach((item) => {
    item.addEventListener("click", () => {
        $$(".filter-item-gender").forEach((f) => f.classList.remove("active"));
        item.classList.add("active");
        gender = item.dataset.gender;
        page = 1;
        runFilter();
        scrollToResults();
    });
});

$("productSearch")?.addEventListener("input", (e) => {
    searchTerm = e.target.value.trim().toLowerCase();
    $("searchClear")?.classList.toggle("visible", searchTerm.length > 0);
    page = 1;
    runFilter();
});
$("searchClear")?.addEventListener("click", () => {
    $("productSearch").value = "";
    searchTerm = "";
    $("searchClear").classList.remove("visible");
    page = 1;
    runFilter();
    $("productSearch").focus();
});
$("sortSelect")?.addEventListener("change", (e) => {
    sortMode = e.target.value;
    page = 1;
    runFilter();
});
$("applyPriceFilter")?.addEventListener("click", () => {
    const mn = parseFloat($("minPrice")?.value) || 0;
    const mx = parseFloat($("maxPrice")?.value) || Infinity;
    if (mn > mx && mx !== Infinity) {
        showToast("Min must be less than max", "error");
        return;
    }
    minPrice = mn;
    maxPrice = mx;
    page = 1;
    runFilter();
    scrollToResults();
});
$("inStockOnly")?.addEventListener("change", (e) => {
    stockOnly = e.target.checked;
    page = 1;
    runFilter();
    scrollToResults();
});
$("clearFilters")?.addEventListener("click", clearAll);
$("noResultsReset")?.addEventListener("click", clearAll);

// ── Filter pipeline ──────────────────────────────────────
function runFilter() {
    filtered = products.filter((p) => {
        if (categories.length > 0) {
            const prodCats = p.categories && Array.isArray(p.categories) ? p.categories : [p.category];
            if (!prodCats.some(c => categories.includes(c))) return false;
        }

        if (selectedTags.length > 0) {
            // Must have at least one of the selected tags (OR logic for tags)
            if (!p.tags || !p.tags.some(t => selectedTags.includes(t))) return false;
        }

        if (gender !== "all" && p.gender !== gender && p.gender !== "Unisex") return false;

        if (searchTerm) {
            const words = searchTerm.split(/\s+/).filter(w => w.length > 0);
            const matchesAllWords = words.every(word => {
                const inName = p.name.toLowerCase().includes(word);
                const inDesc = (p.description || "").toLowerCase().includes(word);
                const inCat = (p.categories && Array.isArray(p.categories) ? p.categories : [p.category || '']).some(c => c.toLowerCase().includes(word));
                const inTags = p.tags ? p.tags.some(tid => {
                    const tObj = globalTags.find(gt => gt.id === tid);
                    return (tObj ? tObj.name : tid).toLowerCase().includes(word);
                }) : false;
                
                return inName || inDesc || inCat || inTags;
            });
            
            if (!matchesAllWords) return false;
        }
        
        if (p.price < minPrice || p.price > maxPrice) return false;
        if (stockOnly && p.stock === 0) return false;
        return true;
    });
    renderCards();
    updateChips();
    isFirstLoad = false;
}

function scrollToResults() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function sortList(list) {
    const s = [...list];
    switch (sortMode) {
        case "price-low":
            return s.sort((a, b) => a.price - b.price);
        case "price-high":
            return s.sort((a, b) => b.price - a.price);
        case "name":
            return s.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return s.sort(
                (a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0),
            );
    }
}

// ── Render cards ─────────────────────────────────────────
function renderCards() {
    const grid = $("shopGrid");
    const noResults = $("noResults");
    const rc = $("resultsCount");
    if (!grid) return;

    const sorted = sortList(filtered);
    const total = sorted.length;
    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    const pageItems = sorted.slice(start, end);

    if (total === 0) {
        grid.style.display = "none";
        if (noResults) noResults.style.display = "block";
        const pi = $("pageIndicator");
        if (pi) pi.style.display = "none";
        renderPagination(0);
        return;
    }
    grid.style.display = "grid";
    if (noResults) noResults.style.display = "none";

    // Update Page Indicator
    const totalPages = Math.ceil(total / PER_PAGE);
    const pi = $("pageIndicator");
    if (pi) {
        if (total > 0) {
            pi.textContent = `Page ${page} of ${totalPages}`;
            pi.style.display = "block";
        } else {
            pi.style.display = "none";
        }
    }

    grid.innerHTML = pageItems
        .map((p) => {
            const coverImage = (p.images && p.images.length > 0) ? p.images[0].thumbnail || p.images[0].full : p.image;
            return `
<article class="prod-card" data-id="${p.id}">
<div class="prod-img">
    <img src="${coverImage}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
    ${p.isFeatured ? '<div class="prod-badge">Featured</div>' : ""}
    <div class="prod-quick">
    <button onclick="event.stopPropagation();shopAddToCart('${p.id}')" style="${!window.acceptingOrders ? 'opacity:0.6; cursor:not-allowed;' : ''}">
        Add to Cart
    </button>
    </div>
</div>
<div class="prod-info">
    <div class="prod-cat">${(p.categories && Array.isArray(p.categories) ? p.categories : [p.category || '']).filter(Boolean).join(' • ')}</div>
    <h3 class="prod-name">${p.name}</h3>
    <div class="prod-footer">
    <span class="prod-price">GH₵ ${Math.round(parseFloat(p.price))}</span>
    </div>
</div>
</article>
`;
        })
        .join("");

    grid.querySelectorAll(".prod-card").forEach((card) => {
        card.addEventListener(
            "click",
            () => (window.location.href = `product.html?id=${card.dataset.id}`),
        );
    });

    // staggered entrance
    const obs = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("visible");
                    obs.unobserve(e.target);
                }
            });
        },
        { threshold: 0.08 },
    );
    grid.querySelectorAll(".prod-card").forEach((c) => obs.observe(c));

    renderPagination(total);
}

// ── Pagination ───────────────────────────────────────────
function renderPagination(total) {
    const pg = $("pagination");
    if (!pg) return;
    pg.innerHTML = "";
    const totalPages = Math.ceil(total / PER_PAGE);
    if (totalPages <= 1) return;
    const scrollUp = () => scrollToResults();
    const mkBtn = (nav) => {
        const b = document.createElement("button");
        b.className = "pg-btn" + (nav ? " nav" : "");
        return b;
    };

    const prev = mkBtn(true);
    prev.innerHTML =
        '<i class="fas fa-chevron-left"></i><span> Prev</span>';
    prev.disabled = page === 1;
    prev.addEventListener("click", () => {
        page--;
        renderCards();
        setTimeout(scrollToResults, 10);
    });
    pg.appendChild(prev);

    // Always show page 1
    addPg(1);

    // Show current page if it's not page 1
    if (page > 1) {
        if (page > 2) {
            const dots = document.createElement("span");
            dots.className = "pg-ellipsis";
            dots.textContent = "...";
            pg.appendChild(dots);
        }
        addPg(page);
    }

    function addPg(n) {
        const b = mkBtn(false);
        b.className = (n === page) ? "pg-btn active" : "pg-btn";
        b.textContent = n;
        b.addEventListener("click", () => {
            if (n === page) {
                setTimeout(scrollToResults, 10);
                return;
            }
            page = n;
            renderCards();
            setTimeout(scrollToResults, 10);
        });
        pg.appendChild(b);
    }

    const next = mkBtn(true);
    next.innerHTML =
        '<span>Next </span><i class="fas fa-chevron-right"></i>';
    next.disabled = page === totalPages;
    next.addEventListener("click", () => {
        page++;
        renderCards();
        setTimeout(scrollToResults, 10);
    });
    pg.appendChild(next);
}

// ── Active chips ─────────────────────────────────────────
function updateChips() {
    const el = $("activeChips");
    const badge = $("filterBadge");
    if (!el) return;
    let count = 0;
    const chips = [];
    if (categories.length > 0) {
        categories.forEach(cat => {
            count++;
            chips.push({
                label: cat,
                clear: () => {
                    const item = document.querySelector(`[data-category="${cat}"]`);
                    if (item) item.classList.remove("active");
                    categories = categories.filter(c => c !== cat);
                    if (categories.length === 0) {
                        document.querySelector('[data-category="all"]')?.classList.add("active");
                    }
                    page = 1;
                    runFilter();
                },
            });
        });
    }
    if (gender !== "all") {
        count++;
        chips.push({
            label: `Gender: ${gender}`,
            clear: () => {
                $$(".filter-item-gender").forEach((f) => f.classList.remove("active"));
                document
                    .querySelector('[data-gender="all"]')
                    .classList.add("active");
                gender = "all";
                page = 1;
                runFilter();
            },
        });
    }
    if (searchTerm) {
        count++;
        chips.push({
            label: `"${searchTerm}"`,
            clear: () => {
                $("productSearch").value = "";
                searchTerm = "";
                $("searchClear").classList.remove("visible");
                page = 1;
                runFilter();
            },
        });
    }
    if (minPrice > 0 || maxPrice < Infinity) {
        count++;
        chips.push({
            label:
                maxPrice < Infinity
                    ? `GH₵ ${minPrice}–${maxPrice}`
                    : `GH₵ ${minPrice}+`,
            clear: () => {
                minPrice = 0;
                maxPrice = Infinity;
                if ($("minPrice")) $("minPrice").value = "";
                if ($("maxPrice")) $("maxPrice").value = "";
                page = 1;
                runFilter();
            },
        });
    }
    if (stockOnly) {
        count++;
        chips.push({
            label: "In Stock",
            clear: () => {
                stockOnly = false;
                if ($("inStockOnly")) $("inStockOnly").checked = false;
                page = 1;
                runFilter();
            },
        });
    }
    if (selectedTags.length > 0) {
        selectedTags.forEach(tid => {
            count++;
            const tObj = globalTags.find(gt => gt.id === tid);
            chips.push({
                label: tObj ? tObj.name : tid,
                clear: () => {
                    selectedTags = selectedTags.filter(id => id !== tid);
                    renderTagFilters();
                    page = 1;
                    runFilter();
                }
            });
        });
    }
    el.innerHTML = chips
        .map(
            (c, i) =>
                `<button class="chip" data-i="${i}">${c.label} <i class="fas fa-times"></i></button>`,
        )
        .join("");
    el.querySelectorAll(".chip").forEach((btn, i) =>
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            chips[i].clear();
        }),
    );
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-flex" : "none";
    }
    const badgeFab = $("filterBadgeFab");
    if (badgeFab) {
        badgeFab.textContent = count;
        badgeFab.style.display = count > 0 ? "inline-flex" : "none";
    }
}

// ── Clear all ────────────────────────────────────────────
function clearAll() {
    categories = [];
    selectedTags = [];
    gender = "all";
    searchTerm = "";
    minPrice = 0;
    maxPrice = Infinity;
    stockOnly = false;
    sortMode = "featured";
    page = 1;
    if ($("tagFilterGroup")) $("tagFilterGroup").style.display = "none";
    if ($("productSearch")) $("productSearch").value = "";
    if ($("searchClear")) $("searchClear").classList.remove("visible");
    if ($("minPrice")) $("minPrice").value = "";
    if ($("maxPrice")) $("maxPrice").value = "";
    if ($("inStockOnly")) $("inStockOnly").checked = false;
    if ($("sortSelect")) $("sortSelect").value = "featured";

    $$(".filter-item").forEach((f) => f.classList.remove("active"));
    document
        .querySelector('[data-category="all"]')
        ?.classList.add("active");

    $$(".filter-item-gender").forEach((f) => f.classList.remove("active"));
    document
        .querySelector('[data-gender="all"]')
        ?.classList.add("active");

    runFilter();
}

// ── Boot ─────────────────────────────────────────────────
window.addEventListener('load', () => {
    bootShop();
});
