'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const {
  Role, AdminUser, Category, Product, ProductVariant,
  Banner, Customer, Order, OrderItem,
  Cart, CartItem, Coupon, Wishlist, MarketingMessage, SiteSetting, ReturnRequest
} = require('../models');

const isTableEmpty = async (Model) => {
  try {
    const count = await Model.count();
    return count === 0;
  } catch (err) {
    return true;
  }
};

const seedAll = async () => {
  console.log('🌱 Checking seed requirements for Twin A Apparels...');

  // ─── Roles ────────────────────────────────────────────────────────────────
  if (await isTableEmpty(Role)) {
    await Role.bulkCreate([
      { name: 'ADMIN', permissions: { all: true } },
      { name: 'STAFF', permissions: { orders: true, products: true, customers: true } },
    ]);
    console.log('✅ Roles seeded');
  }

  // ─── Admin Users ──────────────────────────────────────────────────────────
  if (await isTableEmpty(AdminUser)) {
    const adminRole = await Role.findOne({ where: { name: 'ADMIN' } });
    const staffRole = await Role.findOne({ where: { name: 'STAFF' } });
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const staffHash = await bcrypt.hash('Staff@123', 10);

    await AdminUser.bulkCreate([
      { name: 'Sai Arjun Kumar', email: 'admin@twinapparels.com', password: adminHash, roleId: adminRole?.id },
      { name: 'Priya Sharma', email: 'staff@twinapparels.com', password: staffHash, roleId: staffRole?.id },
    ]);
    console.log('✅ Admin users seeded (admin@twinapparels.com / Admin@123)');
  }

  // ─── Categories ───────────────────────────────────────────────────────────
  if (await isTableEmpty(Category)) {
    const parents = await Category.bulkCreate([
      { name: 'New Arrivals', slug: 'new-arrivals', description: 'Explore the latest arrivals', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400', sortOrder: 0, showHeader: true, attributes: [] },
      { name: 'Party Wear', slug: 'party-wear', description: 'Glamorous ensembles for every celebration', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', sortOrder: 1, showHeader: true, attributes: [{ key: 'occasion', values: ['Wedding', 'Cocktail', 'Gala'] }] },
      { name: 'Fashion', slug: 'fashion', description: 'Contemporary fashion for the modern woman', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', sortOrder: 2, showHeader: false, attributes: [{ key: 'fit', values: ['Regular', 'Slim', 'Relaxed'] }] },
      { name: 'Accessories', slug: 'accessories', description: 'Curated accessories to complete your look', image: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', sortOrder: 3, showHeader: true, attributes: [] },
      { name: 'Perfumes', slug: 'perfumes', description: 'Signature fragrances from world-class perfumers', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400', sortOrder: 4, showHeader: true, attributes: [{ key: 'family', values: ['Floral', 'Oriental', 'Woody', 'Fresh'] }] },
      { name: 'Jewelry', slug: 'jewelry', description: 'Exquisite jewelry crafted with precision', image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400', sortOrder: 5, showHeader: true, attributes: [{ key: 'material', values: ['Gold', 'Silver', 'Diamond', 'Platinum'] }] },
      { name: 'Sale', slug: 'sale', description: 'Exclusive discounts on premium designs', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=400', sortOrder: 6, showHeader: true, attributes: [] },
      { name: 'Footwear', slug: 'footwear', description: 'Luxury footwear for every step', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', sortOrder: 7, showHeader: false, attributes: [{ key: 'size', values: ['35', '36', '37', '38', '39', '40', '41'] }] },
    ]);

    // Sub-categories
    await Category.bulkCreate([
      { name: 'Lehengas', slug: 'lehengas', parentId: parents[1].id, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400', sortOrder: 1 },
      { name: 'Evening Gowns', slug: 'evening-gowns', parentId: parents[1].id, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400', sortOrder: 2 },
      { name: 'Kaftans', slug: 'kaftans', parentId: parents[1].id, image: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400', sortOrder: 3 },
      { name: 'Kurtas & Sets', slug: 'kurtas-sets', parentId: parents[2].id, image: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400', sortOrder: 1 },
      { name: 'Dresses', slug: 'dresses', parentId: parents[2].id, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', sortOrder: 2 },
    ]);
    console.log('✅ Categories seeded (13 total)');
  }

  // ─── Products ─────────────────────────────────────────────────────────────
  if (await isTableEmpty(Product)) {
    const allCategories = await Category.findAll();
    const catMap = {};
    allCategories.forEach(c => { catMap[c.slug] = c.id; });

    const products = [
      {
        name: 'Emerald Silk Kaftan',
        slug: 'emerald-silk-kaftan',
        categoryId: catMap['kaftans'] || catMap['party-wear'],
        price: 4999,
        comparePrice: 10500,
        sku: 'KFT-001',
        stock: 45,
        isFeatured: true,
        isNewArrival: true,
        rating: 4.8,
        reviewCount: 124,
        description: 'Draped in pure Kanjivaram silk with hand-embroidered gold motifs, this emerald kaftan is an ode to timeless Indian elegance. The flowing silhouette flatters every body type while the zari borders add festive opulence.',
        shortDescription: 'Hand-embroidered pure silk kaftan with gold zari borders.',
        images: ['https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600'],
        tags: ['festive', 'silk', 'kaftan', 'party-wear'],
        attributes: { fabric: 'Pure Silk', occasion: 'Festive', sizes: ['S', 'M', 'L', 'XL', 'XXL'] }
      },
      {
        name: 'Rose Gold Lehenga Set',
        slug: 'rose-gold-lehenga-set',
        categoryId: catMap['lehengas'] || catMap['party-wear'],
        price: 18999,
        comparePrice: 28000,
        sku: 'LHG-001',
        stock: 18,
        isFeatured: true,
        isBestSeller: true,
        rating: 4.9,
        reviewCount: 87,
        description: 'A breathtaking rose gold lehenga crafted with micro-sequin embroidery on georgette fabric. The flared skirt is paired with a heavily embellished blouse and tissue dupatta that catches every light. Perfect for sangeet and reception ceremonies.',
        shortDescription: 'Micro-sequin rose gold lehenga for weddings and receptions.',
        images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600', 'https://images.unsplash.com/photo-1594552072238-b8a33785b6cd?w=600', 'https://images.unsplash.com/photo-1619679640967-4a1b13498acf?w=600'],
        tags: ['lehenga', 'wedding', 'bridal', 'rose-gold'],
        attributes: { fabric: 'Georgette + Tissue', occasion: 'Wedding', sizes: ['S', 'M', 'L', 'XL'] }
      },
      {
        name: 'Midnight Navy Anarkali',
        slug: 'midnight-navy-anarkali',
        categoryId: catMap['party-wear'],
        price: 7499,
        comparePrice: 12000,
        sku: 'ANK-001',
        stock: 32,
        isNewArrival: true,
        rating: 4.7,
        reviewCount: 56,
        description: 'A regal midnight navy Anarkali in chanderi silk with delicate silver threadwork along the hemline. The floor-length silhouette paired with a churidar bottom creates an effortlessly graceful ensemble for festive evenings.',
        shortDescription: 'Chanderi silk Anarkali with silver threadwork. Floor-length grace.',
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600', 'https://images.unsplash.com/photo-1594552072238-b8a33785b6cd?w=600'],
        tags: ['anarkali', 'festive', 'navy', 'chanderi'],
        attributes: { fabric: 'Chanderi Silk', occasion: 'Festive', sizes: ['S', 'M', 'L', 'XL', 'XXL'] }
      },
      {
        name: 'Scarlet Velvet Gown',
        slug: 'scarlet-velvet-gown',
        categoryId: catMap['evening-gowns'] || catMap['party-wear'],
        price: 12500,
        comparePrice: 20000,
        sku: 'GWN-001',
        stock: 22,
        isFeatured: true,
        rating: 4.8,
        reviewCount: 43,
        description: 'This floor-length scarlet velvet gown commands every room it enters. The structured bodice with a sweetheart neckline transitions into a dramatic A-line skirt. Fully lined with invisible side zipper for a flawless silhouette.',
        shortDescription: 'Floor-length scarlet velvet gown with sweetheart neckline.',
        images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'],
        tags: ['gown', 'velvet', 'evening', 'party-wear'],
        attributes: { fabric: 'Italian Velvet', occasion: 'Gala', sizes: ['XS', 'S', 'M', 'L', 'XL'] }
      },
      {
        name: 'Saffron Banarasi Silk Saree',
        slug: 'saffron-banarasi-silk-saree',
        categoryId: catMap['party-wear'],
        price: 15999,
        comparePrice: 25000,
        sku: 'SAR-002',
        stock: 14,
        isFeatured: true,
        isBestSeller: true,
        rating: 4.9,
        reviewCount: 108,
        description: 'A resplendent Banarasi pure silk saree in saffron gold with intricate zari brocade throughout the body and a heavy pallu featuring the signature Banarasi kalga and jaal motifs. Woven on a traditional handloom by master weavers of Varanasi.',
        shortDescription: 'Handloom Banarasi pure silk saree in saffron, zari brocade.',
        images: ['https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=600', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600', 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600'],
        tags: ['banarasi', 'saree', 'silk', 'zari', 'bridal', 'handloom'],
        attributes: { fabric: 'Pure Banarasi Silk', technique: 'Handloom', blouse: 'Included (unstitched)' }
      }
    ];

    await Product.bulkCreate(products);
    console.log(`✅ Products seeded (${products.length} total)`);
  }

  // ─── Customers ────────────────────────────────────────────────────────────
  if (await isTableEmpty(Customer)) {
    const hash = (pw) => bcrypt.hash(pw, 10);
    const customers = await Customer.bulkCreate([
      { name: 'Priya Nair', email: 'priya.nair@gmail.com', password: await hash('Pass@123'), phone: '9876543200', referralCode: 'PRIYA001', whatsappOptIn: true, address: { line1: '14 Palm Beach Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
      { name: 'Aisha Sharma', email: 'aisha.sharma@outlook.com', password: await hash('Pass@123'), phone: '9765432100', referralCode: 'AISHA002', whatsappOptIn: false, address: { line1: '22 Rajpur Road', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      { name: 'Kavya Reddy', email: 'kavya.reddy@yahoo.com', password: await hash('Pass@123'), phone: '9654321000', referralCode: 'KAVYA003', whatsappOptIn: true, address: { line1: '5 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' } },
      { name: 'Sunita Patel', email: 'sunita.patel@gmail.com', password: await hash('Pass@123'), phone: '9543210900', referralCode: 'SUNIT004', whatsappOptIn: true, address: { line1: '9 Paldi', city: 'Ahmedabad', state: 'Gujarat', pincode: '380007' } },
      { name: 'Nisha Menon', email: 'nisha.menon@gmail.com', password: await hash('Pass@123'), phone: '9432109800', referralCode: 'NISHA005', whatsappOptIn: false, address: { line1: '3 Marine Drive', city: 'Kochi', state: 'Kerala', pincode: '682001' } },
    ]);

    // Create carts for customers
    await Cart.bulkCreate(customers.map(c => ({ customerId: c.id })));
    console.log('✅ Customers seeded + carts created');
  }

  // ─── Abandoned Carts (Cart Items) ─────────────────────────────────────────
  if (await isTableEmpty(CartItem)) {
    const carts = await Cart.findAll();
    const products = await Product.findAll();
    if (carts.length > 0 && products.length > 0) {
      await CartItem.bulkCreate([
        {
          cartId: carts[0].id,
          productId: products[0].id,
          quantity: 1,
          priceAtAdd: products[0].price,
        },
        {
          cartId: carts[1].id,
          productId: products[1] ? products[1].id : products[0].id,
          quantity: 2,
          priceAtAdd: products[1] ? products[1].price : products[0].price,
        }
      ]);
      console.log('✅ Cart items seeded (Abandoned carts populated)');
    }
  }

  // ─── Orders & Order Items (including Cancelled Orders) ────────────────────
  if (await isTableEmpty(Order)) {
    const customers = await Customer.findAll();
    const products = await Product.findAll();
    if (customers.length > 0 && products.length > 0) {
      // 1. Confirmed Order
      const order1 = await Order.create({
        orderNumber: `TA${uuidv4().slice(0, 8).toUpperCase()}`,
        customerId: customers[0].id,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'Razorpay Secure Online',
        subtotal: products[0].price,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: Math.round(products[0].price * 0.18),
        totalAmount: products[0].price,
        currency: 'INR',
        shippingAddress: customers[0].address || { line1: '14 Palm Beach Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        statusTimeline: { CONFIRMED: new Date().toISOString() }
      });
      await OrderItem.create({
        orderId: order1.id,
        productId: products[0].id,
        productName: products[0].name,
        productImage: Array.isArray(products[0].images) ? products[0].images[0] : '',
        quantity: 1,
        unitPrice: products[0].price,
        totalPrice: products[0].price
      });

      // 2. Delivered Order
      const order2 = await Order.create({
        orderNumber: `TA${uuidv4().slice(0, 8).toUpperCase()}`,
        customerId: customers[1].id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'Cash on Delivery (COD)',
        subtotal: products[1] ? products[1].price : products[0].price,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: Math.round((products[1] ? products[1].price : products[0].price) * 0.18),
        totalAmount: products[1] ? products[1].price : products[0].price,
        currency: 'INR',
        shippingAddress: customers[1].address || { line1: '22 Rajpur Road', city: 'Delhi', state: 'Delhi', pincode: '110001' },
        statusTimeline: { CONFIRMED: new Date().toISOString(), DELIVERED: new Date().toISOString() }
      });
      const orderItem2 = await OrderItem.create({
        orderId: order2.id,
        productId: products[1] ? products[1].id : products[0].id,
        productName: products[1] ? products[1].name : products[0].name,
        productImage: Array.isArray(products[1]?.images) ? products[1].images[0] : '',
        quantity: 1,
        unitPrice: products[1] ? products[1].price : products[0].price,
        totalPrice: products[1] ? products[1].price : products[0].price
      });

      // 3. Cancelled Order
      const order3 = await Order.create({
        orderNumber: `TA${uuidv4().slice(0, 8).toUpperCase()}`,
        customerId: customers[2].id,
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        paymentMethod: 'Razorpay Secure Online',
        subtotal: products[2] ? products[2].price : products[0].price,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: Math.round((products[2] ? products[2].price : products[0].price) * 0.18),
        totalAmount: products[2] ? products[2].price : products[0].price,
        currency: 'INR',
        shippingAddress: customers[2].address || { line1: '5 Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
        statusTimeline: {
          CONFIRMED: new Date(Date.now() - 3600000).toISOString(),
          CANCELLED: new Date().toISOString(),
          cancelReason: 'Customer requested cancellation (ordered wrong size)',
          cancelledBy: 'CUSTOMER',
          refundStatus: 'COMPLETED'
        }
      });
      await OrderItem.create({
        orderId: order3.id,
        productId: products[2] ? products[2].id : products[0].id,
        productName: products[2] ? products[2].name : products[0].name,
        productImage: Array.isArray(products[2]?.images) ? products[2].images[0] : '',
        quantity: 1,
        unitPrice: products[2] ? products[2].price : products[0].price,
        totalPrice: products[2] ? products[2].price : products[0].price
      });

      // 4. Return Request on delivered order
      if (await isTableEmpty(ReturnRequest)) {
        await ReturnRequest.create({
          returnNumber: `RET${uuidv4().slice(0, 6).toUpperCase()}`,
          orderId: order2.id,
          orderItemId: orderItem2.id,
          customerId: customers[1].id,
          productId: products[1] ? products[1].id : products[0].id,
          productName: products[1] ? products[1].name : products[0].name,
          productImage: Array.isArray(products[1]?.images) ? products[1].images[0] : '',
          quantity: 1,
          refundAmount: products[1] ? products[1].price : products[0].price,
          currency: 'INR',
          reason: 'Size fitting issue',
          reasonDetails: 'Item is slightly larger than expected size chart.',
          unboxingVideoUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2',
          status: 'REQUESTED',
          statusTimeline: { REQUESTED: new Date().toISOString() }
        });
        console.log('✅ Sample return request seeded');
      }

      console.log('✅ Orders (Confirmed, Delivered, Cancelled) & OrderItems seeded');
    }
  }

  // ─── Marketing Messages ───────────────────────────────────────────────────
  if (await isTableEmpty(MarketingMessage)) {
    await MarketingMessage.bulkCreate([
      { message: 'Free shipping on orders above ₹1499 · Use code WELCOME20 for 20% off', position: 0, isActive: true },
      { message: 'New Arrivals: Handcrafted Ethnic Wear & Festive Couture are now in stock!', position: 1, isActive: true },
      { message: 'Join the Twin A Apparels Circle for exclusive offers and updates.', position: 2, isActive: true }
    ]);
    console.log('✅ Marketing messages seeded');
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────
  if (await isTableEmpty(Coupon)) {
    await Coupon.bulkCreate([
      {
        code: 'WELCOME20',
        description: '20% off on your first order with Twin A Apparels',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 999,
        maxDiscountAmount: 500,
        usageLimit: 1000,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'TWINA100',
        description: 'Flat ₹100 off on all orders above ₹1499',
        discountType: 'FLAT',
        discountValue: 100,
        minOrderAmount: 1499,
        usageLimit: 5000,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('✅ Default coupons seeded');
  }

  console.log('🎉 All seed data ready — Twin A Apparels is fully stocked!');
};

module.exports = seedAll;
