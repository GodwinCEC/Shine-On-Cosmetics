// Premium Beauty Products Database
export const products = [
    {
        id: 1,
        name: "Luminous Dew Serum",
        category: "Skin",
        price: 78,
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
        description: "A lightweight, hydrating serum infused with botanical extracts and hyaluronic acid. Delivers instant radiance and long-lasting moisture for a dewy, editorial glow.",
        isFeatured: true,
        stock: 45,
        ingredients: "Aqua, Hyaluronic Acid, Niacinamide, Rose Extract, Vitamin E",
        benefits: ["Deep Hydration", "Brightening", "Anti-aging", "Smooth Texture"]
    },
    {
        id: 2,
        name: "Cloud Cream Moisturizer",
        category: "Skin",
        price: 92,
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
        description: "Ultra-luxe whipped cream that melts into skin. Infused with ceramides and peptides for plump, bouncy skin that feels like silk.",
        isFeatured: true,
        stock: 32,
        ingredients: "Shea Butter, Ceramides, Peptides, Squalane, Vitamin C",
        benefits: ["24hr Moisture", "Plumping", "Barrier Repair", "Silky Finish"]
    },
    {
        id: 3,
        name: "Golden Hour Oil",
        category: "Glow",
        price: 64,
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
        description: "Luxurious face oil with golden shimmer particles. Creates that coveted sun-kissed glow while nourishing skin with precious botanical oils.",
        isFeatured: true,
        stock: 28,
        ingredients: "Jojoba Oil, Argan Oil, Vitamin E, Gold Mica, Rose Hip Oil",
        benefits: ["Radiant Glow", "Nourishing", "Makeup Primer", "Natural Shimmer"]
    },
    {
        id: 4,
        name: "Velvet Matte Foundation",
        category: "Glow",
        price: 58,
        image: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=800&q=80",
        description: "Second-skin foundation with a soft-focus matte finish. Buildable coverage that looks airbrushed yet natural, perfect for editorial beauty.",
        isFeatured: true,
        stock: 67,
        ingredients: "Silica, Titanium Dioxide, Vitamin E, Hyaluronic Acid",
        benefits: ["Medium Coverage", "Long-lasting", "Non-comedogenic", "Natural Finish"]
    },
    {
        id: 5,
        name: "Essence Eau de Parfum",
        category: "Scents",
        price: 145,
        image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
        description: "A sophisticated fragrance inspired by morning dew on rose petals. Notes of bergamot, white tea, and sandalwood create an unforgettable signature scent.",
        isFeatured: true,
        stock: 19,
        ingredients: "Alcohol Denat, Parfum, Aqua, Essential Oils",
        benefits: ["Long-lasting", "Unisex Appeal", "Natural Notes", "Elegant Bottle"]
    },
    {
        id: 6,
        name: "Petal Soft Cleanser",
        category: "Skin",
        price: 42,
        image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80",
        description: "Gentle gel-to-milk cleanser that removes makeup and impurities without stripping. Leaves skin soft, balanced, and ready for your ritual.",
        isFeatured: false,
        stock: 58,
        ingredients: "Glycerin, Chamomile Extract, Aloe Vera, Coconut Oil",
        benefits: ["Deep Cleansing", "Gentle Formula", "pH Balanced", "Hydrating"]
    },
    {
        id: 7,
        name: "Silk Veil Setting Spray",
        category: "Glow",
        price: 38,
        image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
        description: "Weightless mist that sets makeup while adding a subtle luminosity. Your makeup stays fresh and radiant from day to night.",
        isFeatured: false,
        stock: 71,
        ingredients: "Rosewater, Glycerin, Hyaluronic Acid, Aloe Extract",
        benefits: ["All-day Hold", "Refreshing", "Dewy Finish", "Hydrating"]
    },
    {
        id: 8,
        name: "Ritual Body Oil",
        category: "Essentials",
        price: 54,
        image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80",
        description: "Sumptuous body oil that absorbs instantly. Leaves skin gleaming with health and scented with our signature botanical blend.",
        isFeatured: true,
        stock: 34,
        ingredients: "Sweet Almond Oil, Vitamin E, Lavender Oil, Jojoba Oil",
        benefits: ["Fast Absorbing", "Silky Skin", "Subtle Scent", "Non-greasy"]
    },
    {
        id: 9,
        name: "Moon Glow Night Cream",
        category: "Skin",
        price: 108,
        image: "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=800&q=80",
        description: "Rich overnight treatment with retinol and peptides. Wake up to transformed skin that's smooth, firm, and luminous.",
        isFeatured: false,
        stock: 23,
        ingredients: "Retinol, Peptides, Hyaluronic Acid, Shea Butter, Niacinamide",
        benefits: ["Anti-aging", "Overnight Repair", "Firming", "Deep Hydration"]
    },
    {
        id: 10,
        name: "Bloom Lip Serum",
        category: "Glow",
        price: 32,
        image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80",
        description: "Plumping lip treatment with a sheer rose tint. Hydrates, volumizes, and gives lips that perfect pout with a glossy finish.",
        isFeatured: false,
        stock: 89,
        ingredients: "Hyaluronic Acid, Peptides, Vitamin E, Natural Rose Pigments",
        benefits: ["Plumping Effect", "Glossy Finish", "Hydrating", "Natural Tint"]
    },
    {
        id: 11,
        name: "Crystal Face Roller",
        category: "Essentials",
        price: 48,
        image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80",
        description: "Rose quartz facial roller for a spa-quality massage at home. Reduces puffiness, improves circulation, and enhances product absorption.",
        isFeatured: false,
        stock: 42,
        ingredients: "100% Natural Rose Quartz",
        benefits: ["De-puffing", "Lymphatic Drainage", "Cooling Effect", "Relaxing"]
    },
    {
        id: 12,
        name: "Bloom Eau de Cologne",
        category: "Scents",
        price: 68,
        image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
        description: "Light, refreshing cologne with citrus and floral notes. Perfect for everyday wear with an airy, clean finish.",
        isFeatured: false,
        stock: 31,
        ingredients: "Alcohol Denat, Citrus Oils, Jasmine Extract, Aqua",
        benefits: ["Fresh Scent", "Layerable", "Daytime Perfect", "Clean Notes"]
    },
    {
        id: 13,
        name: "Radiance Exfoliating Mask",
        category: "Skin",
        price: 56,
        image: "https://images.unsplash.com/photo-1556229174-5e42a09e9de1?w=800&q=80",
        description: "Gentle enzyme mask that reveals brighter, smoother skin. Use weekly for that editorial-ready glow.",
        isFeatured: false,
        stock: 47,
        ingredients: "Papaya Enzyme, Lactic Acid, Kaolin Clay, Vitamin C",
        benefits: ["Gentle Exfoliation", "Brightening", "Smoothing", "Refining"]
    },
    {
        id: 14,
        name: "Lush Lash Serum",
        category: "Glow",
        price: 72,
        image: "https://images.unsplash.com/photo-1631730486572-226d1f595e8d?w=800&q=80",
        description: "Conditioning lash treatment enriched with peptides and biotin. Promotes longer, fuller, healthier lashes in 6-8 weeks.",
        isFeatured: false,
        stock: 36,
        ingredients: "Peptides, Biotin, Panthenol, Castor Oil, Hyaluronic Acid",
        benefits: ["Lengthening", "Strengthening", "Conditioning", "Volumizing"]
    },
    {
        id: 15,
        name: "Sanctuary Bath Salts",
        category: "Essentials",
        price: 36,
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
        description: "Mineral-rich bath salts infused with lavender and eucalyptus. Transform your bath into a luxurious spa ritual.",
        isFeatured: false,
        stock: 54,
        ingredients: "Dead Sea Salt, Epsom Salt, Lavender Oil, Eucalyptus Oil",
        benefits: ["Muscle Relaxation", "Detoxifying", "Aromatherapy", "Skin Softening"]
    },
    {
        id: 16,
        name: "Pure Glow Highlighter",
        category: "Glow",
        price: 44,
        image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
        description: "Champagne-pearl highlighter for a lit-from-within glow. Buildable formula works on all skin tones for that perfect editorial finish.",
        isFeatured: true,
        stock: 63,
        ingredients: "Mica, Titanium Dioxide, Vitamin E, Jojoba Oil",
        benefits: ["Natural Glow", "Buildable", "Long-wearing", "Universal Shade"]
    }
];

// Helper Functions
export function getProductById(id) {
    return products.find(p => p.id === parseInt(id));
}

export function getProductsByCategory(category) {
    if (category === 'all') return products;
    return products.filter(p => p.category === category);
}

export function getFeaturedProducts() {
    return products.filter(p => p.isFeatured);
}

export function searchProducts(query) {
    const searchTerm = query.toLowerCase();
    return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm)
    );
}