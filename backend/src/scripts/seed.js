const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('../models/User')
const Vendor = require('../models/Vendor')
const Category = require('../models/Category')
const Brand = require('../models/Brand')
const Product = require('../models/Product')
const Review = require('../models/Review')
const Order = require('../models/Order')

async function recalculateProductRating(productId) {
  const prodId = new mongoose.Types.ObjectId(productId)
  const stats = await Review.aggregate([
    { $match: { product: prodId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ])

  if (stats.length > 0) {
    const avg = Math.round(stats[0].avgRating * 10) / 10
    await Product.findByIdAndUpdate(prodId, { rating: avg, numReviews: stats[0].numReviews })
  } else {
    await Product.findByIdAndUpdate(prodId, { rating: 0, numReviews: 0 })
  }
}

async function runSeed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multi_vendor_marketplace'
  console.log(`Connecting to MongoDB at: ${mongoUri}`)
  await mongoose.connect(mongoUri)

  console.log('Clearing existing collections...')
  await Promise.all([
    User.deleteMany({}),
    Vendor.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
  ])

  console.log('Creating users...')
  const sharedPasswordHash = await bcrypt.hash('Password@123', 12)

  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@marketplace.com',
    phone: '+91 98765 00001',
    password: sharedPasswordHash,
    role: 'admin',
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  })

  const techOwner = await User.create({
    name: 'Marcus Vance',
    email: 'tech@marketplace.com',
    phone: '+91 98765 00002',
    password: sharedPasswordHash,
    role: 'vendor',
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  })

  const fashionOwner = await User.create({
    name: 'Elena Rostova',
    email: 'fashion@marketplace.com',
    phone: '+91 98765 00003',
    password: sharedPasswordHash,
    role: 'vendor',
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  })

  const homeOwner = await User.create({
    name: 'Kenji Sato',
    email: 'home@marketplace.com',
    phone: '+91 98765 00004',
    password: sharedPasswordHash,
    role: 'vendor',
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  })

  const customer1 = await User.create({
    name: 'Alex Shopper',
    email: 'customer@marketplace.com',
    phone: '+91 98765 00005',
    password: sharedPasswordHash,
    role: 'customer',
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  })

  const customer2 = await User.create({
    name: 'Sarah Jenkins',
    email: 'sarah@marketplace.com',
    phone: '+91 98765 00006',
    password: sharedPasswordHash,
    role: 'customer',
    isEmailVerified: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  })

  console.log('Creating vendors...')
  const techVendor = await Vendor.create({
    owner: techOwner._id,
    storeName: 'Apex Tech Studio',
    description: 'Premier curator of audiophile sound gear, silicon computing, and precision workspace technology.',
    status: 'approved',
    isPublic: true,
    reviewedAt: new Date(),
    reviewedBy: admin._id,
  })

  const fashionVendor = await Vendor.create({
    owner: fashionOwner._id,
    storeName: 'Nordic Thread Co.',
    description: 'Independent atelier dedicated to premium organic fabrics, minimalist cuts, and sustainable everyday apparel.',
    status: 'approved',
    isPublic: true,
    reviewedAt: new Date(),
    reviewedBy: admin._id,
  })

  const homeVendor = await Vendor.create({
    owner: homeOwner._id,
    storeName: 'Artisan Living Kyoto',
    description: 'Bespoke home furnishings, certified ergonomic office architectural pieces, and timeless Japanese pottery.',
    status: 'approved',
    isPublic: true,
    reviewedAt: new Date(),
    reviewedBy: admin._id,
  })

  console.log('Creating categories...')
  const electronicsCat = await Category.create({
    name: 'Electronics',
    slug: 'mobiles-electronics',
    description: 'Smartphones, audio gear, computing accessories, and smart devices.',
    imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&auto=format&fit=crop&q=80',
    sortOrder: 1,
    isActive: true,
  })

  const audioCat = await Category.create({
    name: 'Audio & Wearables',
    slug: 'audio-wearables',
    description: 'Wireless headphones, high-fidelity monitors, and spatial audio earbuds.',
    parent: electronicsCat._id,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
    sortOrder: 1,
    isActive: true,
  })

  const computersCat = await Category.create({
    name: 'Computers & Accessories',
    slug: 'computers-accessories',
    description: 'High-performance laptops, mechanical keyboards, and precision peripherals.',
    parent: electronicsCat._id,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
    sortOrder: 2,
    isActive: true,
  })

  const fashionCat = await Category.create({
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    description: 'Curated urban fashion, streetwear, shoes, and luxury timepieces.',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80',
    sortOrder: 2,
    isActive: true,
  })

  const mensFashionCat = await Category.create({
    name: "Men's Fashion",
    slug: 'mens-fashion',
    description: 'Tailored essentials, outerwear, and streetwear.',
    parent: fashionCat._id,
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&auto=format&fit=crop&q=80',
    sortOrder: 1,
    isActive: true,
  })

  const homeCat = await Category.create({
    name: 'Home & Living',
    slug: 'home-kitchen',
    description: 'Ergonomic workspaces, artisan tableware, and ambient decor.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
    sortOrder: 3,
    isActive: true,
  })

  const beautyCat = await Category.create({
    name: 'Beauty & Wellness',
    slug: 'beauty-wellness',
    description: 'Clean skincare, organic aromatherapy, and grooming essentials.',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80',
    sortOrder: 4,
    isActive: true,
  })

  const sportsCat = await Category.create({
    name: 'Sports & Fitness',
    slug: 'fitness-sports',
    description: 'Activewear, yoga gear, weights, and high-performance accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
    sortOrder: 5,
    isActive: true,
  })

  const toysCat = await Category.create({
    name: 'Toys & Hobbies',
    slug: 'toys-games-hobbies',
    description: 'Mechanical puzzles, collectible building sets, and gaming gear.',
    imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&auto=format&fit=crop&q=80',
    sortOrder: 6,
    isActive: true,
  })

  console.log('Creating brands...')
  const sonyBrand = await Brand.create({
    name: 'Sony',
    slug: 'sony',
    description: 'Pioneers in high-resolution audio, mirrorless photography, and gaming hardware.',
    logoUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  const appleBrand = await Brand.create({
    name: 'Apple',
    slug: 'apple',
    description: 'Elegantly designed silicon computers, portable displays, and connected audio devices.',
    logoUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  const nikeBrand = await Brand.create({
    name: 'Nike',
    slug: 'nike',
    description: 'Groundbreaking athletic gear, engineered streetwear, and responsive footwear.',
    logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  const logitechBrand = await Brand.create({
    name: 'Logitech',
    slug: 'logitech',
    description: 'Ergonomic peripherals, mechanical keyboards, and precision optical mice.',
    logoUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  const dysonBrand = await Brand.create({
    name: 'Dyson',
    slug: 'dyson',
    description: 'High-velocity air purification, precision styling tools, and acoustic engineering.',
    logoUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  const ankerBrand = await Brand.create({
    name: 'Anker',
    slug: 'anker',
    description: 'High-wattage GaN chargers, braided power delivery cables, and portable batteries.',
    logoUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  const hermanMillerBrand = await Brand.create({
    name: 'Herman Miller',
    slug: 'herman-miller',
    description: 'Ergonomic seating and workspace architecture designed for long-term health and focus.',
    logoUrl: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=200&auto=format&fit=crop&q=80',
    isActive: true,
  })

  console.log('Creating products...')
  const pSonyHeadphones = await Product.create({
    vendor: techVendor._id,
    category: audioCat._id,
    brand: sonyBrand._id,
    name: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    slug: 'sony-wh-1000xm5-wireless-noise-canceling-headphones',
    description:
      'Industry-leading noise cancellation optimized with two processors and 8 microphones. Magnificent sound quality engineered with 30mm carbon fiber drivers. Up to 30-hour battery life with quick charging (3 min for 3 hours playback). Ultra-comfortable lightweight design with soft fit leather and crystal-clear hands-free calling.',
    price: 29990,
    salePrice: 26990,
    stock: 35,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        alt: 'Sony WH-1000XM5 Headset Studio View',
      },
      {
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        alt: 'Sony Headphones Lifestyle',
      },
    ],
    status: 'active',
  })

  const pMacbookAir = await Product.create({
    vendor: techVendor._id,
    category: computersCat._id,
    brand: appleBrand._id,
    name: 'Apple MacBook Air 15" M3 Chip (16GB, 512GB SSD)',
    slug: 'apple-macbook-air-15-m3-chip',
    description:
      'Strikingly thin design with expansive 15.3-inch Liquid Retina display. Powered by the next-generation M3 chip with 8-core CPU and 10-core GPU. Up to 18 hours of all-day battery life. MagSafe 3 charging, 1080p FaceTime HD camera, three-mic array, and six-speaker sound system with Spatial Audio.',
    price: 134900,
    salePrice: 124900,
    stock: 18,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        alt: 'MacBook Air on desk',
      },
      {
        url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
        alt: 'MacBook detail view',
      },
    ],
    status: 'active',
  })

  const pLogitechMouse = await Product.create({
    vendor: techVendor._id,
    category: computersCat._id,
    brand: logitechBrand._id,
    name: 'Logitech MX Master 3S Wireless Performance Mouse',
    slug: 'logitech-mx-master-3s-wireless-performance-mouse',
    description:
      'Quiet Clicks technology delivers satisfying tactile feedback with 90% less click noise. 8000 DPI track-on-glass optical sensor. MagSpeed electromagnetic scrolling scrolls 1,000 lines per second. Ergonomic silhouette crafted for all-day palm support with custom thumb wheel and gesture buttons.',
    price: 9995,
    salePrice: 8495,
    stock: 45,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
        alt: 'Logitech MX Master Mouse',
      },
    ],
    status: 'active',
  })

  const pAnkerCharger = await Product.create({
    vendor: techVendor._id,
    category: electronicsCat._id,
    brand: ankerBrand._id,
    name: 'Anker Prime 200W GaN Desktop Fast Charging Station',
    slug: 'anker-prime-200w-gan-desktop-charger',
    description:
      '6-in-1 power delivery charging hub delivering 200W total output across 4 USB-C and 2 USB-A ports. Powered by GaNPrime architecture for a 20% smaller footprint and active thermal monitoring over 3 million times per day. Fast-charges two 16" MacBook Pros simultaneously at full speed.',
    price: 7999,
    salePrice: 6499,
    stock: 40,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
        alt: 'Anker Desktop GaN Charger',
      },
    ],
    status: 'active',
  })

  const pNikeShoes = await Product.create({
    vendor: fashionVendor._id,
    category: fashionCat._id,
    brand: nikeBrand._id,
    name: 'Nike Air Zoom Pegasus 41 Road Running Shoes',
    slug: 'nike-air-zoom-pegasus-41-running-shoes',
    description:
      'Responsive cushioning for daily road runs with dual Air Zoom units and all-new ReactX foam midsole providing 13% more energy return. Engineered mesh upper enhances breathability while maintaining structured midfoot containment for miles of support.',
    price: 11895,
    salePrice: 9495,
    stock: 28,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
        alt: 'Nike Red Athletic Sneakers',
      },
      {
        url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
        alt: 'Nike Shoes side angle',
      },
    ],
    status: 'active',
  })

  const pHoodie = await Product.create({
    vendor: fashionVendor._id,
    category: mensFashionCat._id,
    brand: null,
    name: 'Heavyweight Oversized French Terry Cotton Hoodie',
    slug: 'heavyweight-oversized-french-terry-cotton-hoodie',
    description:
      'Crafted from 480 GSM 100% French Terry combed organic cotton. Features double-layered structured hood, drop shoulders, ribbed cuffs, and concealed side seam pockets with minimal branding. Pre-shrunk for an enduring boxy silhouette.',
    price: 3999,
    salePrice: 3299,
    stock: 65,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        alt: 'Urban Minimalist Cotton Hoodie',
      },
    ],
    status: 'active',
  })

  const pDenimJacket = await Product.create({
    vendor: fashionVendor._id,
    category: fashionCat._id,
    brand: null,
    name: 'Minimalist Japanese Raw Selvedge Denim Overshirt',
    slug: 'minimalist-japanese-raw-selvedge-denim-overshirt',
    description:
      '14.5 oz unwashed Japanese red-line selvedge denim woven on vintage shuttle looms. Antique brass hardware, internal flask pockets, and reinforced flat-felled seam construction designed to develop high-contrast natural honeycombs and fades with wear.',
    price: 5499,
    salePrice: 4699,
    stock: 22,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        alt: 'Raw Denim Jacket Hanging',
      },
    ],
    status: 'active',
  })

  const pHermanMillerChair = await Product.create({
    vendor: homeVendor._id,
    category: homeCat._id,
    brand: hermanMillerBrand._id,
    name: 'Herman Miller Aeron Ergonomic Chair - Graphite Edition',
    slug: 'herman-miller-aeron-ergonomic-chair-graphite',
    description:
      'The definitive benchmark for ergonomic work seating. Pellicle 8Z suspension membrane supports your spine with 8 zones of variable tension. Harmonic 2 tilt mechanism moves naturally with your posture. Fully adjustable PostureFit SL sacral support pads.',
    price: 115000,
    salePrice: 98000,
    stock: 12,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80',
        alt: 'Herman Miller Aeron Ergonomic Chair',
      },
      {
        url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80',
        alt: 'Aeron Chair Office Context',
      },
    ],
    status: 'active',
  })

  const pCeramicCoffee = await Product.create({
    vendor: homeVendor._id,
    category: homeCat._id,
    brand: null,
    name: 'Handcrafted Mino-Yaki Ceramic Pour-Over Dripper Set',
    slug: 'handcrafted-mino-yaki-ceramic-pour-over-dripper-set',
    description:
      'Hand-thrown by artisanal ceramists in Gifu Prefecture using historic Mino ware clay. Featuring 16 spiral extraction ribs and heat-retaining matte glaze. Includes matching 600ml borosilicate glass decanter and walnut collar ring.',
    price: 3490,
    salePrice: 2990,
    stock: 35,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
        alt: 'Artisan Ceramic Coffee Maker',
      },
    ],
    status: 'active',
  })

  const pDysonPurifier = await Product.create({
    vendor: homeVendor._id,
    category: homeCat._id,
    brand: dysonBrand._id,
    name: 'Dyson Purifier Hot+Cool Formaldehyde HP09 Air Purifier',
    slug: 'dyson-purifier-hot-cool-formaldehyde-hp09',
    description:
      'HEPA H13 filtration system captures 99.95% of ultrafine particles down to 0.1 microns. Cryptocatalytic filter continuously destroys formaldehyde. Air Multiplier technology projects purified warm or cool air across the entire room with 350-degree oscillation.',
    price: 62900,
    salePrice: 54900,
    stock: 14,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
        alt: 'Dyson Room Purifier',
      },
    ],
    status: 'active',
  })

  const pFaceSerum = await Product.create({
    vendor: fashionVendor._id,
    category: beautyCat._id,
    brand: null,
    name: 'Botanical Cold-Pressed Organic Face Serum & Glow Elixir',
    slug: 'botanical-cold-pressed-organic-face-serum-glow-elixir',
    description:
      'Formulated with cold-pressed rosehip seed oil, squalane, marula extract, and stabilized vitamin C. Delivers deep cellular hydration, boosts barrier resilience, and promotes natural radiance without greasy residue. 100% vegan and cruelty-free.',
    price: 2490,
    salePrice: 1990,
    stock: 75,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        alt: 'Luxury Face Serum Dropper Glass Bottle',
      },
    ],
    status: 'active',
  })

  const pYogaMat = await Product.create({
    vendor: fashionVendor._id,
    category: sportsCat._id,
    brand: null,
    name: 'High-Density Natural Cork Yoga Mat with Alignment Marks',
    slug: 'high-density-natural-cork-yoga-mat',
    description:
      'Sustainably harvested Portuguese organic cork top layer with non-slip natural tree rubber base. Grippier as you sweat, antimicrobial, and naturally odor-resistant. Laser-etched central symmetry guidelines ensure precise pose alignment.',
    price: 3890,
    salePrice: 3190,
    stock: 30,
    currency: 'INR',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
        alt: 'Eco Cork Yoga Mat with Floor Setup',
      },
    ],
    status: 'active',
  })

  console.log('Creating sample orders for Alex Shopper (customer@marketplace.com)...')
  const order1 = await Order.create({
    orderNumber: `ORD-${Date.now()}-101`,
    customer: customer1._id,
    items: [
      {
        product: pSonyHeadphones._id,
        vendor: techVendor._id,
        name: pSonyHeadphones.name,
        price: 26990,
        quantity: 1,
        image: pSonyHeadphones.images[0].url,
        subtotal: 26990,
        vendorStatus: 'delivered',
      },
      {
        product: pAnkerCharger._id,
        vendor: techVendor._id,
        name: pAnkerCharger.name,
        price: 6499,
        quantity: 1,
        image: pAnkerCharger.images[0].url,
        subtotal: 6499,
        vendorStatus: 'delivered',
      },
    ],
    shippingAddress: {
      fullName: 'Alex Shopper',
      phone: '+91 98765 00005',
      street: '42 Innovators Boulevard, 5th Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'IN',
    },
    paymentMethod: 'card',
    paymentStatus: 'paid',
    itemsPrice: 33489,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 33489,
    status: 'delivered',
    paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    timeline: [
      {
        status: 'Order Placed',
        note: 'Order successfully created with card payment.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedBy: 'customer',
      },
      {
        status: 'Processing',
        note: 'Vendor confirmed inventory and prepared parcel.',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        updatedBy: 'vendor',
      },
      {
        status: 'Shipped',
        note: 'Handed over to express courier. Tracking: EXP-928172IN',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedBy: 'vendor',
      },
      {
        status: 'Delivered',
        note: 'Delivered to resident.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedBy: 'system',
      },
    ],
  })

  const order2 = await Order.create({
    orderNumber: `ORD-${Date.now()}-102`,
    customer: customer1._id,
    items: [
      {
        product: pHoodie._id,
        vendor: fashionVendor._id,
        name: pHoodie.name,
        price: 3299,
        quantity: 1,
        image: pHoodie.images[0].url,
        subtotal: 3299,
        vendorStatus: 'processing',
      },
    ],
    shippingAddress: {
      fullName: 'Alex Shopper',
      phone: '+91 98765 00005',
      street: '42 Innovators Boulevard, 5th Floor',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'IN',
    },
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: 'order_seed_rzp_mock_1',
    razorpayPaymentId: 'pay_seed_rzp_mock_1',
    itemsPrice: 3299,
    shippingPrice: 0,
    taxPrice: 0,
    totalPrice: 3299,
    status: 'processing',
    paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    timeline: [
      {
        status: 'Order Placed',
        note: 'Order confirmed with Razorpay payment.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedBy: 'customer',
      },
      {
        status: 'Processing',
        note: 'Nordic Thread Co. is printing the dispatch label.',
        timestamp: new Date(),
        updatedBy: 'vendor',
      },
    ],
  })

  console.log('Creating product reviews...')
  await Review.create({
    product: pSonyHeadphones._id,
    user: customer1._id,
    rating: 5,
    title: 'The soundstage and ANC are unreal!',
    comment:
      'I commute daily on the metro and these completely eliminate subway roar. The carbon fiber drivers deliver crystal highs and tight, punchy sub-bass. Battery lasts the entire week on a single charge. Absolute five stars!',
    isVerifiedPurchase: true,
    helpfulCount: 14,
    helpfulUsers: [customer2._id],
  })

  await Review.create({
    product: pSonyHeadphones._id,
    user: customer2._id,
    rating: 5,
    title: 'Perfect build quality and comfort',
    comment:
      'Noticeably lighter than the XM4s and the ear cushions are supple and breathable. Microphone clarity on Zoom calls is crisp. Highly recommend!',
    isVerifiedPurchase: false,
    helpfulCount: 7,
  })

  await Review.create({
    product: pMacbookAir._id,
    user: customer2._id,
    rating: 5,
    title: 'The best portable workstation Apple has ever made',
    comment:
      'The 15-inch display gives you pro-grade real estate without the Pro weight. M3 handles Xcode, Docker, and 4K Final Cut timelines with zero fan noise. Silent perfection.',
    isVerifiedPurchase: false,
    helpfulCount: 22,
  })

  await Review.create({
    product: pLogitechMouse._id,
    user: customer1._id,
    rating: 5,
    title: 'Indispensable tool for productivity',
    comment:
      'The quiet clicks make a huge difference in shared rooms, and the electromagnetic wheel lets you fly through giant spreadsheets in seconds.',
    isVerifiedPurchase: false,
    helpfulCount: 9,
  })

  await Review.create({
    product: pHoodie._id,
    user: customer1._id,
    rating: 5,
    title: 'Incredible heavyweight drape',
    comment:
      '480 GSM French Terry makes this feel like high-end luxury streetwear for a fraction of designer prices. Fits slightly oversized right out of the bag.',
    isVerifiedPurchase: true,
    helpfulCount: 6,
  })

  await Review.create({
    product: pHermanMillerChair._id,
    user: customer2._id,
    rating: 5,
    title: 'Worth every single penny for back ergonomics',
    comment:
      'Lower back ache from 10-hour desk marathons is completely gone after just 3 weeks with the Aeron. The breathable mesh eliminates heat buildup.',
    isVerifiedPurchase: false,
    helpfulCount: 31,
  })

  await Review.create({
    product: pCeramicCoffee._id,
    user: customer2._id,
    rating: 4,
    title: 'Beautiful aesthetics and balanced cup clarity',
    comment:
      'The spiral ribs guide a very even bed extraction. The matte ceramic finish looks stunning on any coffee bar counter.',
    isVerifiedPurchase: false,
    helpfulCount: 4,
  })

  console.log('Recalculating ratings for all products...')
  const allProducts = await Product.find({})
  for (const prod of allProducts) {
    await recalculateProductRating(prod._id)
  }

  console.log('\n======================================================')
  console.log('✅ SEEDING COMPLETE! Seed summary:')
  console.log(`- Users: ${(await User.countDocuments())}`)
  console.log(`- Vendors: ${(await Vendor.countDocuments())}`)
  console.log(`- Categories: ${(await Category.countDocuments())}`)
  console.log(`- Brands: ${(await Brand.countDocuments())}`)
  console.log(`- Products: ${(await Product.countDocuments())}`)
  console.log(`- Reviews: ${(await Review.countDocuments())}`)
  console.log(`- Orders: ${(await Order.countDocuments())}`)
  console.log('======================================================\n')

  console.log('🔑 Credentials for quick login:')
  console.log('• Admin:    admin@marketplace.com    / Password@123')
  console.log('• Vendor 1: tech@marketplace.com     / Password@123  (Apex Tech Studio)')
  console.log('• Vendor 2: fashion@marketplace.com  / Password@123  (Nordic Thread Co.)')
  console.log('• Vendor 3: home@marketplace.com     / Password@123  (Artisan Living Kyoto)')
  console.log('• Customer: customer@marketplace.com / Password@123  (Alex Shopper)')
  console.log('======================================================\n')

  await mongoose.disconnect()
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
