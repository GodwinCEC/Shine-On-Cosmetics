

# Shine On Cosmetics Website Architecture

## 1. Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend / SaaS: Firebase
  - Firestore (Database)
  - Firebase Authentication (Email/Password)
  - Firebase Storage (Product images)
- Payment Integration: Paystack (Momo & COD)
- Hosting: Firebase Hosting

---

## 2. Frontend Structure

### 2.1 Pages
1. **index.html (Landing Page)**
   - Hero section with animated product queue (3–5 products)
   - Featured products section
   - Short About section with "Learn More" link
   - Quick links to Shop and Categories

2. **about.html (About Page)**
   - Brand story, editorial images, company mission

3. **shop.html (Shop Page)**
   - Product grid
   - Filters: Category, Price, Featured
   - Search bar

4. **product.html (Product Detail Page)**
   - Product images (OG + thumbnail)
   - Name, description, price
   - Add to wishlist/cart
   - Stock availability

5. **cart.html / checkout.html**
   - Cart overview
   - Payment method selection: COD or Paystack
   - Checkout form and confirmation

6. **dashboard.html (User Profile)**
   - Wishlist
   - Order history & tracking
   - Account settings
   - Theme toggle (light/dark)

7. **admin-dashboard.html**
   - Product CRUD (Add/Edit/Delete)
   - Category CRUD
   - Featured products management
   - Stock visibility / Show/Hide products
   - Order management
   - Accepting orders toggle

8. **auth pages**
   - signup.html / signin.html / forgot-password.html
   - Email verification enforced

---

### 2.2 Components
- **Navbar**
  - Glassy/transparent
  - Collapses into hamburger menu on small viewports
- **Footer**
  - Contact info, social links, newsletter signup
- **Product Card**
  - Thumbnail image
  - Name, price
  - Wishlist button
- **Carousel / Featured Queue**
  - Animated horizontal queue
  - Front product: large and in focus
  - Back products: smaller, blurred, 3D illusion
  - Auto-scroll with smooth transitions
  - Swipe gesture support on mobile

---

## 3. Firebase Architecture

### 3.1 Collections

#### 3.1.1 Products
```json
products: [
  {
    id: "product_id",
    name: "Lipstick Deluxe",
    description: "Detailed description of the product",
    price: 250,
    category: "Lipstick",
    images: {
      original: "https://firebasestorage.com/og_image.jpg",
      thumbnail: "https://firebasestorage.com/thumb_image.jpg"
    },
    featured: true,
    stock: 20,
    visible: true,
    createdAt: "timestamp",
    updatedAt: "timestamp"
  }
]
````

#### 3.1.2 Categories

```json
categories: [
  {
    id: "category_id",
    name: "Lipsticks",
    visible: true,
    createdAt: "timestamp",
    updatedAt: "timestamp"
  }
]
```

#### 3.1.3 Users

```json
users: [
  {
    id: "user_id",
    email: "user@example.com",
    wishlist: ["product_id1", "product_id2"],
    orders: ["order_id1", "order_id2"],
    createdAt: "timestamp",
    updatedAt: "timestamp"
  }
]
```

#### 3.1.4 Orders

```json
orders: [
  {
    id: "order_id",
    userId: "user_id",
    products: [
      { productId: "product_id1", quantity: 2 },
      { productId: "product_id2", quantity: 1 }
    ],
    total: 500,
    paymentMethod: "COD / Paystack",
    status: "Pending / Shipped / Delivered",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  }
]
```

---

## 4. Authentication & Authorization Flow

1. User signs up → email/password via Firebase Auth
2. Verification email sent
3. User must verify email to:

   * Add to wishlist
   * Place orders
4. Dashboard/Profile page only accessible if signed in
5. Admin dashboard accessible only via special `admin` role in users collection

---

## 5. Payment Flow

1. User selects products → checkout
2. Choose payment method:

   * **COD:** Confirm order → mark as pending
   * **Paystack (Momo):** Redirect/pay via Paystack SDK → upon success, mark order as paid
3. Order status updated in Firestore

---

## 6. Image Management

* Store **original** image and **optimized thumbnail** in Firebase Storage
* Reference both URLs in product documents
* Frontend:

  * Shop grid: use thumbnails
  * Product detail / carousel: use original image
* Admin dashboard: allow uploading both images, auto-generate thumbnail optional

---

## 7. Responsive Layout Rules

* Navbar collapses into hamburger menu on small viewports
* Product grids:

  * Desktop: 4–5 per row
  * Tablet: 3 per row
  * Mobile: 2 per row
* Featured queue:

  * Desktop: 5 products visible
  * Tablet: 3 products visible
  * Mobile: 2–3 products visible
* Mobile-first animations and touch/swipe support

---

## 8. Summary

* Full e-commerce website with products, categories, search, wishlist, orders
* Firebase backend: Firestore + Auth + Storage
* Payment: COD & Paystack
* Responsive, modern, minimalistic editorial design
* Admin dashboard: full product/category/order management

````
