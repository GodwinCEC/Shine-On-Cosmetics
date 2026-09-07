// ── Helpers ─────────────────────────────────────────────
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

// ── Toast ────────────────────────────────────────────────
function toast(msg, type = '') {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => el.className = 'toast', 3200);
}
// Globally expose toast for addProduct
window.showNotification = toast;

// ── Reveal / Scroll Animation ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: .1, rootMargin: '0px 0px -80px 0px' });

$$('.reveal').forEach(el => observer.observe(el));

// hero bg zoom-out on load
window.addEventListener('load', () => {
  document.getElementById('heroBg')?.classList.add('loaded');
});

// ── Ticker ───────────────────────────────────────────────
const ticks = ['Pocket Friendly', 'New arrivals weekly', 'Cruelty-free & vegan', 'Internationally Sourced', 'Glow naturally'];
const track = $('#tickerTrack');
if (track) {
  const items = [...ticks, ...ticks].map(t => `
      <span class="ticker-item">${t}<span class="ticker-dot"></span></span>
    `).join('');
  track.innerHTML = items;
}

// ── Global Setting State ─────────────────────────────────
window.acceptingOrders = true;

// ── Products ─────────────────────────────────────────────
const DEMO_PRODUCTS = [
  { id: 1, name: 'Glow Serum', category: 'Skincare', price: 89, image: 'assets/images/cat_skincare.png', stock: 10, featured: true },
  { id: 2, name: 'Radiance Moisturiser', category: 'Bestseller', price: 65, image: 'assets/images/cat_bestsellers.png', stock: 5, featured: true },
  { id: 3, name: 'Bright Eye Cream', category: 'Skincare', price: 72, image: 'assets/images/cat_all.png', stock: 0, featured: true },
];

function renderSkeletons(count) {
  const grid = $('#productsGrid');
  if (!grid) return;
  grid.innerHTML = Array(count).fill(0).map(() => `
      <article class="prod-card skel-card">
        <div class="prod-img skel-img skeleton"></div>
        <div class="prod-info skel-info">
          <div class="skel-cat skeleton" style="width: 40%; height: 12px; margin-bottom: 8px;"></div>
          <div class="skel-name skeleton" style="width: 80%; height: 18px; margin-bottom: 8px;"></div>
          <div class="skel-price skeleton" style="width: 30%; height: 15px;"></div>
        </div>
      </article>
    `).join('');
}

function renderProducts(products) {
  const grid = $('#productsGrid');
  if (!grid) return;
  grid.innerHTML = products.map((p, i) => {
    const coverImage = (p.images && p.images.length > 0) ? p.images[0].thumbnail || p.images[0].full : p.image;
    return `
      <article class="prod-card reveal" style="transition-delay:${i * .1}s" data-id="${p.id}">
        <div class="prod-img">
          <img src="${coverImage}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800'">
          <div class="prod-badge">Featured</div>
        </div>
        <div class="prod-info">
          <div class="prod-cat">${p.category}</div>
          <h3 class="prod-name">${p.name}</h3>
          <div class="prod-footer">
            <span class="prod-price">GH₵${parseFloat(p.price).toFixed(2)}</span>
            <span class="prod-stars">★★★★★</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // click to navigate
  $$('.prod-card', grid).forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${card.dataset.id}`;
    });
  });

  // observe newly injected cards
  $$('.reveal', grid).forEach(el => observer.observe(el));

  // Setup scroll snap indicators for products on mobile
  setupProductScrollIndicators(products.length);
}

// ── Product Scroll Indicators ────────────────────────────
function setupProductScrollIndicators(count) {
  const wrapper = $('.products-grid-wrapper');
  if (!wrapper) return;

  // Create indicators container if doesn't exist
  let indicatorsContainer = $('.products-scroll-indicators', wrapper.parentElement);
  if (!indicatorsContainer) {
    indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'products-scroll-indicators';
    wrapper.parentElement.appendChild(indicatorsContainer);
  }

  // Create dots
  indicatorsContainer.innerHTML = Array(count).fill(0).map((_, i) =>
    `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
  ).join('');

  const grid = $('#productsGrid');
  const dots = $$('.dot', indicatorsContainer);

  // Update active dot on scroll
  let scrollTimeout;
  grid.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft = grid.scrollLeft;
      const cardWidth = grid.querySelector('.prod-card').offsetWidth;
      const gap = 24; // 1.5rem
      const index = Math.round(scrollLeft / (cardWidth + gap));

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }, 100);
  });

  // Click dot to scroll
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const cards = $$('.prod-card', grid);
      cards[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });
}

// ── Mission Scroll Indicators ───────────────────────────
function setupMissionScrollIndicators() {
  if (window.innerWidth > 540) return; // Only on mobile

  const wrapper = $('.mission-grid-wrapper');
  if (!wrapper) return;

  const grid = $('.mission-grid', wrapper);
  const cards = $$('.mission-card', grid);

  // Create indicators container if doesn't exist
  let container = $('.mission-scroll-indicators', wrapper.parentElement);
  if (!container) {
    container = document.createElement('div');
    container.className = 'mission-scroll-indicators';
    wrapper.parentElement.appendChild(container);
  }

  // Create dots
  container.innerHTML = cards.map((_, i) =>
    `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
  ).join('');

  const dots = $$('.dot', container);

  // Update active dot on scroll
  let scrollTimeout;
  grid.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft = grid.scrollLeft;
      const cardWidth = cards[0].offsetWidth;
      const gap = 24; // 1.5rem
      const index = Math.round(scrollLeft / (cardWidth + gap));

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }, 100);
  });

  // Click dot to scroll
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      cards[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });
}

// ── Draggable Scroll Setup ─────────────────────────────
function setupDraggableScroll(element) {
  if (!element) return;
  
  let isDown = false;
  let startX;
  let scrollLeft;

  element.addEventListener('mousedown', (e) => {
    isDown = true;
    element.classList.add('active');
    startX = e.pageX - element.offsetLeft;
    scrollLeft = element.scrollLeft;
    element.style.scrollSnapType = 'none';
    element.style.scrollBehavior = 'auto';
  });

  element.addEventListener('mouseleave', () => {
    isDown = false;
    element.style.scrollSnapType = 'x mandatory';
    element.style.scrollBehavior = '';
  });

  element.addEventListener('mouseup', () => {
    isDown = false;
    element.style.scrollSnapType = 'x mandatory';
    element.style.scrollBehavior = '';
  });

  element.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - element.offsetLeft;
    const walk = (x - startX) * 2;
    element.scrollLeft = scrollLeft - walk;
  });
}

// ── Review Scroll Indicators ─────────────────────────────
function setupReviewScrollIndicators() {
  const wrapper = $('.reviews-grid-wrapper');
  if (!wrapper) return;

  const grid = $('.reviews-grid', wrapper);
  const cards = $$('.review-card', grid);

  // Indicators creation
  let indicatorsContainer = $('.reviews-scroll-indicators', wrapper);
  if (!indicatorsContainer) {
    indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'reviews-scroll-indicators';
    wrapper.appendChild(indicatorsContainer);
  }

  indicatorsContainer.innerHTML = cards.map((_, i) =>
    `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
  ).join('');

  const dots = $$('.dot', indicatorsContainer);
  let scrollTimeout;
  grid.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const scrollLeft = grid.scrollLeft;
      const cardWidth = cards[0].offsetWidth;
      const gap = 24; // 1.5rem
      const index = Math.round(scrollLeft / (cardWidth + gap));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }, 100);
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      cards[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });
}

async function bootHome() {
  renderSkeletons(3);
  try {
    const { db } = await import('./firebase-config.js');
    const { doc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

    const settingsDoc = await getDoc(doc(db, "app_settings", "global"));
    let useHardcoded = true;
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      applyHomeSettings(data);
      if (data.useHardcodedData === false) useHardcoded = false;
      if (data.acceptingOrders === false) window.acceptingOrders = false;
    }

    if (!useHardcoded) {
      const querySnapshot = await getDocs(collection(db, "products"));
      const liveProducts = [];
      querySnapshot.forEach(d => {
        const p = d.data();
        if (p.isVisible !== false) liveProducts.push({ id: d.id, ...p });
      });
      window.homeProducts = liveProducts; // Store for addProduct
      const featured = liveProducts.filter(p => p.isFeatured || p.featured).slice(0, 3);
      renderProducts(featured.length ? featured : liveProducts.slice(0, 3));
    } else {
      await loadHardcodedProducts();
    }
    
    // Setup carousels after content loads
    setupMissionScrollIndicators();
    setupReviewScrollIndicators();
    setupDraggableScroll($('.products-grid'));
    setupDraggableScroll($('.mission-grid'));
    setupDraggableScroll($('.reviews-grid'));

  } catch (e) {
    console.error("Home Boot Error:", e);
    await loadHardcodedProducts();
  }
}

async function loadHardcodedProducts() {
  try {
    const mod = await import('./products-data.js');
    const products = mod.products || [];
    window.homeProducts = products;
    const featured = products.filter(p => p.featured || p.isFeatured).slice(0, 3);
    renderProducts(featured.length ? featured : DEMO_PRODUCTS);
  } catch {
    window.homeProducts = DEMO_PRODUCTS;
    renderProducts(DEMO_PRODUCTS);
  }
}

function applyHomeSettings(data) {
  if (!data) return;

  // 1. Hero
  if (data.hero) {
    const { sub } = data.hero;
    if (sub) {
        $('.hero-sub').textContent = sub;
        console.log("[Firebase-Content] Hero subtitle updated dynamically.");
    }
  }

  // 2. Categories
  if (data.categories && data.categories.length > 0) {
    const catsContainer = $('.cats');
    if (catsContainer) {
      console.log(`[Firebase-Content] Rendering ${data.categories.length} dynamic categories...`);
      catsContainer.innerHTML = data.categories.map(cat => {
        const thumb = cat.image?.thumbnail || cat.image?.full || 'assets/images/cat-all.jpg';
        return `
          <a href="shop.html${cat.slug ? '?cat=' + cat.slug : ''}" class="cat-card">
            <img src="${thumb}" 
                 data-full="${cat.image?.full || ''}"
                 alt="${cat.name}" loading="lazy" class="dynamic-img progressive-img">
            <div class="cat-overlay"></div>
            <div class="cat-info">
              <span class="cat-name">${cat.name}</span>
              <span class="cat-cta">Explore →</span>
            </div>
          </a>
        `;
      }).join('');
      swapDynamicImages(catsContainer);
    }
  }

  // 3. Founder & Mission
  if (data.mission) {
    const { founder, story } = data.mission;
    if (founder) {
      const fCard = $('.mission-card.bg-image');
      if (fCard) {
        const fName = $('h2 em', fCard);
        const fDesc = $('p', fCard);
        if (fName) fName.textContent = founder.name;
        if (fDesc) fDesc.textContent = founder.description;
        console.log("[Firebase-Content] Founder name and bio updated.");
      }
    }
    if (story) {
      const mCard = $('.mission-card.featured');
      if (mCard) {
        if (story.icon) $('.mission-icon', mCard).textContent = story.icon;
        if (story.title) $('h2', mCard).innerHTML = story.title;
        if (story.text) $('p', mCard).textContent = story.text;
      }
    }
  }

  // 4. Ticker
  if (data.ticker && data.ticker.length > 0) {
    const track = $('#tickerTrack');
    if (track) {
      const items = [...data.ticker, ...data.ticker].map(t => `
        <span class="ticker-item">${t}<span class="ticker-dot"></span></span>
      `).join('');
      track.innerHTML = items;
    }
  }


  // 6. Socials (Footer)
  if (data.socials && window.updateFooterSocials) {
    window.updateFooterSocials(data.socials);
  }
}

function swapDynamicImages(container) {
  $$('.dynamic-img', container).forEach(img => {
    const full = img.dataset.full;
    if (full) {
      const highRes = new Image();
      highRes.onload = () => {
        img.src = full;
        img.classList.add('is-loaded');
        console.log(`[Firebase-Content] Category image ready: ${img.alt}`);
      };
      highRes.src = full;
    }
  });
}

bootHome();

// Reinitialize on resize
window.addEventListener('resize', () => {
  setupMissionScrollIndicators();
  setupReviewScrollIndicators();
});

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

// ── Add to cart ──────────────────────────────────────────
window.addProduct = async function (id) {
  if (!window.acceptingOrders) {
    toast("We aren't currently accepting orders, but you can add items to your wishlist!", 'error');
    return;
  }

  const products = window.homeProducts || [];
  const p = products.find(item => item.id == id);
  if (!p) return;

  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const ex = cart.find(i => i.id == id);
  if (ex) ex.quantity++;
  else {
    cart.push({ ...p, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  await syncUserArrayToFirestore('cart');

  if (window.updateCartDisplay) window.updateCartDisplay();

  toast('Added to cart! 🛒', 'success');
};