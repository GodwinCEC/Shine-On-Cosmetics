

# Shine On Cosmetics Website Design Specification

---

## 1. Branding & Vibe
- **Vibe:** Natural, high-end, editorial, minimalist
- **Color Palette:**
  - Cream: `#E6E2D7` → backgrounds, sections
  - Caramel: `#A2663C` → buttons, accents
  - Deep Coffee: `#3F1D0E` → text
- **Typography:** Clean sans-serif, professional editorial feel
- **Animations:** Subtle, smooth, premium
  - Scroll-based fade-ins
  - Carousel queue movement
  - Hover lifts / scaling on product cards
  - Wishlist/cart interactions

---

## 2. Layouts

### 2.1 Navbar
- Transparent/glassy
- Collapses into hamburger menu on mobile
- Sticky on scroll
- Menu items: Home, About, Shop, Dashboard/Profile, Cart

### 2.2 Footer
- Contact info
- Social links
- Newsletter signup
- Cream background, subtle shadows

### 2.3 Landing Page
- Hero section:
  - Animated product queue (coverflow-style)
  - Front product: large, focused
  - Back products: smaller, blurred, slightly rotated
  - Auto-scroll every 5 seconds, swipe gesture support
- Featured products: horizontal scrollable section
- About snippet: small editorial paragraph + link
- Call-to-action buttons: Caramel background, deep coffee text

### 2.4 Shop Page
- Product grid:
  - Desktop: 4–5 per row
  - Tablet: 3 per row
  - Mobile: 2 per row
- Product card:
  - Thumbnail image
  - Name, price
  - Wishlist button
  - Hover effect: lift, show secondary image

- Filters:
  - Category, Price, Featured
  - Desktop sidebar, mobile dropdowns

- Search bar:
  - Sticky top on desktop
  - Mobile: collapsible / top section

### 2.5 Product Detail Page
- Large original image
- Product name, price, description
- Stock status
- Add to wishlist/cart buttons
- Smooth image zoom or transition animation

### 2.6 Dashboard / Profile
- Tabs: Wishlist, Orders, Account settings
- Theme toggle (light/dark)
- Responsive layout (mobile first)

### 2.7 Admin Dashboard
- Desktop-first
- Tables for products/orders
- Modals for add/edit actions
- Featured toggles, stock visibility
- Clean, minimal, efficient design

---

## 3. Responsiveness
- Mobile-first approach
- Breakpoints:
  - Desktop: 1200px+
  - Tablet: 768px – 1199px
  - Mobile: <768px
- Featured product queue adapts visible items
- Product grid adjusts number per row

---

## 4. Images
- Store original and thumbnail versions
- Carousel / hero: original
- Shop grid: thumbnails
- Admin dashboard: allow upload both
- Optional thumbnail auto-generation

---

## 5. Animations & Transitions
- Hero product queue: slide front → back
- Section fade-in on scroll
- Buttons hover: lift & subtle shadow
- Wishlist: small bounce/pop on click
- Smooth scroll for horizontal carousels

---

## 6. Interactivity
- Wishlist / Favorites requires login
- Cart & checkout flows with visual feedback
- Theme toggle remembered per user (localStorage or Firebase)
- Mobile swipe gestures supported for carousel

---

## 7. Color & Typography Usage
- Backgrounds: Cream (`#E6E2D7`)
- Buttons & Accents: Caramel (`#A2663C`)
- Text & Titles: Deep Coffee (`#3F1D0E`)
- Headings: Bold, 24–36px depending on section
- Body text: 16–18px, clean sans-serif

---

## 8. Notes
- Minimal, editorial, premium aesthetic
- Mobile-first but fully responsive
- Smooth animations without jank
- Focus on performance (image optimization, lazy-loading thumbnails)
