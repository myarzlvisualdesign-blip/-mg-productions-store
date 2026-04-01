import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Clean existing data
  await db.order.deleteMany()
  await db.product.deleteMany()

  const products = [
    {
      name: "Wireless Noise-Cancelling Headphones",
      description: "Premium over-ear headphones with active noise cancellation, 30-hour battery life, and immersive spatial audio. Perfect for audiophiles and professionals.",
      price: 2999000,
      image: "/api/images/products/headphones.jpg",
      category: "Electronics",
      stock: 45,
      featured: true,
      rating: 4.8,
    },
    {
      name: "Smart Watch Pro",
      description: "Advanced fitness tracking with ECG monitoring, GPS, and a stunning AMOLED display. Water-resistant to 50 meters.",
      price: 4499000,
      image: "/api/images/products/smartwatch.jpg",
      category: "Electronics",
      stock: 32,
      featured: true,
      rating: 4.6,
    },
    {
      name: "Minimalist Leather Backpack",
      description: "Handcrafted Italian leather backpack with padded laptop compartment, RFID-blocking pocket, and water-resistant coating.",
      price: 1899000,
      image: "/api/images/products/backpack.jpg",
      category: "Bags",
      stock: 28,
      featured: true,
      rating: 4.9,
    },
    {
      name: "Ultra-Slim Laptop Stand",
      description: "Ergonomic aluminum laptop stand with adjustable height, cable management, and non-slip silicone pads. Compatible with all laptops up to 17 inches.",
      price: 799000,
      image: "/api/images/products/laptop-stand.jpg",
      category: "Accessories",
      stock: 120,
      featured: false,
      rating: 4.5,
    },
    {
      name: "Premium Mechanical Keyboard",
      description: "Hot-swappable mechanical keyboard with RGB lighting, gasket-mount design, and premium PBT keycaps. Features a compact 75% layout.",
      price: 1599000,
      image: "/api/images/products/keyboard.jpg",
      category: "Electronics",
      stock: 67,
      featured: true,
      rating: 4.7,
    },
    {
      name: "Artisan Ceramic Pour-Over Set",
      description: "Handmade ceramic coffee dripper with double-wall thermal carafe and reusable stainless steel filter. Brews 4 cups of perfect coffee.",
      price: 649000,
      image: "/api/images/products/pour-over.jpg",
      category: "Home",
      stock: 85,
      featured: false,
      rating: 4.4,
    },
    {
      name: "Wireless Charging Dock",
      description: "3-in-1 wireless charging station for phone, watch, and earbuds. Features 15W fast charging and elegant marble finish.",
      price: 899000,
      image: "/api/images/products/charger.jpg",
      category: "Accessories",
      stock: 54,
      featured: false,
      rating: 4.3,
    },
    {
      name: "Designer Sunglasses",
      description: "Polarized titanium-frame sunglasses with anti-reflective coating. UV400 protection with a timeless aviator design.",
      price: 2199000,
      image: "/api/images/products/sunglasses.jpg",
      category: "Fashion",
      stock: 40,
      featured: true,
      rating: 4.6,
    },
    {
      name: "Portable Bluetooth Speaker",
      description: "Waterproof 360-degree sound speaker with 20-hour battery, deep bass, and multi-speaker pairing capability.",
      price: 1299000,
      image: "/api/images/products/speaker.jpg",
      category: "Electronics",
      stock: 73,
      featured: false,
      rating: 4.5,
    },
    {
      name: "Premium Yoga Mat",
      description: "Extra-thick natural rubber yoga mat with alignment lines, non-slip texture, and carrying strap. Eco-friendly and sustainable.",
      price: 989000,
      image: "/api/images/products/yoga-mat.jpg",
      category: "Health",
      stock: 95,
      featured: false,
      rating: 4.7,
    },
    {
      name: "Vintage Film Camera",
      description: "Restored classic 35mm film camera with built-in light meter, leather body wrap, and carrying case. A timeless photography tool.",
      price: 3499000,
      image: "/api/images/products/camera.jpg",
      category: "Photography",
      stock: 15,
      featured: true,
      rating: 4.9,
    },
    {
      name: "Aromatherapy Diffuser Set",
      description: "Ultrasonic essential oil diffuser with 7 LED mood lights, auto shut-off, and a curated set of 6 organic essential oils.",
      price: 549000,
      image: "/api/images/products/diffuser.jpg",
      category: "Home",
      stock: 110,
      featured: false,
      rating: 4.2,
    },
  ]

  for (const product of products) {
    await db.product.create({ data: product })
  }

  // Create sample orders
  const sampleOrders = [
    {
      items: JSON.stringify([
        { productId: "1", name: "Wireless Noise-Cancelling Headphones", price: 2999000, quantity: 1 },
      ]),
      total: 2999000,
      status: "delivered",
      customerName: "Alice Johnson",
      customerEmail: "alice@example.com",
      customerPhone: "+62-812-3456-7890",
      address: "Jl. Sudirman No. 123, Jakarta Selatan",
    },
    {
      items: JSON.stringify([
        { productId: "2", name: "Smart Watch Pro", price: 4499000, quantity: 1 },
        { productId: "7", name: "Wireless Charging Dock", price: 899000, quantity: 1 },
      ]),
      total: 5398000,
      status: "shipped",
      customerName: "Bob Smith",
      customerEmail: "bob@example.com",
      customerPhone: "+62-813-4567-8901",
      address: "Jl. Gatot Subroto No. 456, Jakarta Pusat",
    },
    {
      items: JSON.stringify([
        { productId: "5", name: "Premium Mechanical Keyboard", price: 1599000, quantity: 2 },
      ]),
      total: 3198000,
      status: "processing",
      customerName: "Carol Davis",
      customerEmail: "carol@example.com",
      address: "Jl. Thamrin No. 789, Jakarta Pusat",
    },
    {
      items: JSON.stringify([
        { productId: "3", name: "Minimalist Leather Backpack", price: 1899000, quantity: 1 },
        { productId: "8", name: "Designer Sunglasses", price: 2199000, quantity: 1 },
        { productId: "10", name: "Premium Yoga Mat", price: 989000, quantity: 1 },
      ]),
      total: 5087000,
      status: "pending",
      customerName: "David Wilson",
      customerEmail: "david@example.com",
      customerPhone: "+62-814-5678-9012",
      address: "Jl. Kemang Raya No. 321, Jakarta Selatan",
    },
    {
      items: JSON.stringify([
        { productId: "11", name: "Vintage Film Camera", price: 3499000, quantity: 1 },
      ]),
      total: 3499000,
      status: "delivered",
      customerName: "Emma Brown",
      customerEmail: "emma@example.com",
      address: "Jl. Senopati No. 654, Jakarta Selatan",
    },
    {
      items: JSON.stringify([
        { productId: "9", name: "Portable Bluetooth Speaker", price: 1299000, quantity: 3 },
        { productId: "12", name: "Aromatherapy Diffuser Set", price: 549000, quantity: 2 },
      ]),
      total: 4995000,
      status: "shipped",
      customerName: "Frank Garcia",
      customerEmail: "frank@example.com",
      customerPhone: "+62-815-6789-0123",
      address: "Jl. Rasuna Said No. 987, Jakarta Selatan",
    },
    {
      items: JSON.stringify([
        { productId: "6", name: "Artisan Ceramic Pour-Over Set", price: 649000, quantity: 1 },
      ]),
      total: 649000,
      status: "cancelled",
      customerName: "Grace Lee",
      customerEmail: "grace@example.com",
      address: "Jl. Casablanca No. 147, Jakarta Selatan",
    },
    {
      items: JSON.stringify([
        { productId: "4", name: "Ultra-Slim Laptop Stand", price: 799000, quantity: 1 },
        { productId: "5", name: "Premium Mechanical Keyboard", price: 1599000, quantity: 1 },
        { productId: "7", name: "Wireless Charging Dock", price: 899000, quantity: 1 },
      ]),
      total: 3297000,
      status: "delivered",
      customerName: "Henry Martinez",
      customerEmail: "henry@example.com",
      customerPhone: "+62-816-7890-1234",
      address: "Jl. MT Haryono No. 258, Jakarta Timur",
    },
  ]

  for (const order of sampleOrders) {
    await db.order.create({ data: order })
  }

  console.log("✅ Database seeded successfully!")
  console.log(`   - ${products.length} products created`)
  console.log(`   - ${sampleOrders.length} orders created`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
