'use strict';
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // 1. Authenticate DB connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Run safe pre-sync alters for Wishlists table
    try {
      const queryInterface = sequelize.getQueryInterface();
      const wishlistTableDesc = await queryInterface.describeTable('Wishlists').catch(() => null);
      if (wishlistTableDesc) {
        if (!wishlistTableDesc.selectedVariant) {
          await sequelize.query("ALTER TABLE Wishlists ADD COLUMN selectedVariant JSON NULL AFTER productId");
          console.log('✅ Wishlists table selectedVariant column added');
        }
        try { await sequelize.query("ALTER TABLE Wishlists DROP INDEX customerId_productId"); } catch (e) {}
        try { await sequelize.query("ALTER TABLE Wishlists DROP INDEX customer_id_product_id"); } catch (e) {}
      }
    } catch (alterErr) {
      console.log('⚠️ Pre-sync Wishlists alter note:', alterErr.message);
    }

    // Run safe pre-sync alters for StockAlerts table
    try {
      const queryInterface = sequelize.getQueryInterface();
      const stockAlertTableDesc = await queryInterface.describeTable('StockAlerts').catch(() => null);
      if (stockAlertTableDesc) {
        if (!stockAlertTableDesc.variantId) {
          await sequelize.query("ALTER TABLE StockAlerts ADD COLUMN variantId INT NULL AFTER productId");
          console.log('✅ StockAlerts table variantId column added');
        }
        if (!stockAlertTableDesc.selectedVariant) {
          await sequelize.query("ALTER TABLE StockAlerts ADD COLUMN selectedVariant JSON NULL AFTER variantId");
          console.log('✅ StockAlerts table selectedVariant column added');
        }
      }
    } catch (alterErr) {
      console.log('⚠️ Pre-sync StockAlerts alter note:', alterErr.message);
    }

    // Drop deprecated tables if they still exist in the database (safely handling foreign keys)
    const tablesToDrop = [
      'StockAlerts',
      'stockalerts',
      'WarehouseStocks',
      'WarehouseStock',
      'warehousestocks',
      'warehousestock',
      'Warehouses',
      'warehouses',
      'PersonalShopperRequests',
      'personalshopperrequests',
      'LoyaltyLedgers',
      'loyaltyledgers',
      'DeliveryZones',
      'deliveryzones',
      'Affiliates',
      'affiliates',
      'Vendors',
      'vendors'
    ];
    for (const tbl of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS ${tbl}`);
      } catch (e) {}
    }

    // 2. Sync all active models
    await sequelize.sync();
    console.log('✅ Models synced');

    // Clean up deprecated columns from remaining tables
    const columnsToDrop = [
      { table: 'Products', column: 'priceAED' },
      { table: 'Products', column: 'comparePriceAED' },
      { table: 'Products', column: 'vendorId' },
      { table: 'Products', column: 'warehouseId' },
      { table: 'Products', column: 'has360View' },
      { table: 'Products', column: 'hasVideo' },
      { table: 'Products', column: 'videoUrl' },
      { table: 'Products', column: 'spinImagePath' },
      { table: 'Products', column: 'spinImageCount' },
      { table: 'Products', column: 'spinImageExt' },
      { table: 'Products', column: 'showAuthenticity' },
      { table: 'Products', column: 'spin_images' },
      { table: 'Products', column: 'model_3d_url' },
      { table: 'ProductVariants', column: 'priceAED' },
      { table: 'ProductVariants', column: 'mrpAED' },
      { table: 'ProductVariants', column: 'warehouseId' },
      { table: 'Orders', column: 'affiliateId' },
      { table: 'Orders', column: 'loyaltyDiscount' },
      { table: 'Orders', column: 'redeemedPoints' },
      { table: 'Orders', column: 'isGiftWrap' },
      { table: 'Orders', column: 'giftWrapFee' },
      { table: 'Customers', column: 'loyaltyPoints' },
      { table: 'InventoryMovementLogs', column: 'warehouseId' },
      { table: 'InventoryMovementLogs', column: 'toWarehouseId' }
    ];
    for (const item of columnsToDrop) {
      try {
        await sequelize.query(`ALTER TABLE ${item.table} DROP COLUMN ${item.column}`);
      } catch (e) {
        // Ignored: column does not exist or already dropped
      }
    }

    // Run manual database alters for Banners table
    try {
      await sequelize.query("ALTER TABLE Banners MODIFY COLUMN type ENUM('HERO', 'PROMO', 'DEAL', 'EXCLUSIVE_DEAL', 'BRAND', 'COUNTDOWN') DEFAULT 'PROMO'");
      await sequelize.query("ALTER TABLE Banners MODIFY COLUMN title VARCHAR(200) NULL");
    } catch (alterErr) {}

    // Run manual database alters for Orders table status definitions
    try {
      await sequelize.query("UPDATE Orders SET status = 'CANCELLED' WHERE status = 'RTO'");
      await sequelize.query("ALTER TABLE Orders MODIFY COLUMN status ENUM('PENDING_PAYMENT', 'PAID', 'PAYMENT_RECEIVED_STOCK_FAILED', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'EXPIRED') DEFAULT 'PENDING_PAYMENT'");
    } catch (alterErr) {}

    // Safe column adder helper
    const safeAddColumn = async (query) => {
      try {
        await sequelize.query(query);
      } catch (alterErr) {}
    };

    await safeAddColumn("ALTER TABLE Orders ADD COLUMN sessionId VARCHAR(100) NULL");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN razorpay_payment_id VARCHAR(100) NULL UNIQUE");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN razorpay_order_id VARCHAR(100) NULL UNIQUE");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN razorpay_signature VARCHAR(255) NULL");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN inventoryProcessed BOOLEAN NOT NULL DEFAULT FALSE");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN taxRate DECIMAL(5, 2) NULL DEFAULT 0");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN statusTimeline JSON NULL");
    await safeAddColumn("ALTER TABLE Orders ADD COLUMN couponDiscount DECIMAL(12, 2) NULL DEFAULT 0");

    await safeAddColumn("ALTER TABLE CartItems ADD COLUMN variantId INT NULL");
    await safeAddColumn("ALTER TABLE OrderItems MODIFY COLUMN productId INT NULL");
    await safeAddColumn("ALTER TABLE OrderItems MODIFY COLUMN variantId INT NULL");
    await safeAddColumn("ALTER TABLE OrderItems ADD COLUMN gstRate VARCHAR(20) NULL DEFAULT '0%'");

    await safeAddColumn("ALTER TABLE Carts ADD COLUMN sessionId VARCHAR(100) NULL");
    await safeAddColumn("ALTER TABLE Carts MODIFY COLUMN customerId INT NULL DEFAULT NULL");
    await safeAddColumn("ALTER TABLE Carts ADD COLUMN lastEmailSentAt DATETIME NULL");

    await safeAddColumn("ALTER TABLE Products ADD COLUMN defaultProductImage VARCHAR(500) NULL");
    await safeAddColumn("ALTER TABLE Products ADD COLUMN subCategoryId INT NULL");
    await safeAddColumn("ALTER TABLE Products ADD COLUMN lowStockThreshold INT NULL DEFAULT 10");
    await safeAddColumn("ALTER TABLE Products ADD COLUMN gstRate VARCHAR(20) NULL DEFAULT '18%'");

    await safeAddColumn("ALTER TABLE ProductVariants ADD COLUMN lowStockThreshold INT NULL DEFAULT 10");
    await safeAddColumn("ALTER TABLE ProductVariants ADD COLUMN gstRate VARCHAR(20) NULL DEFAULT '18%'");
    await safeAddColumn("ALTER TABLE ProductVariants ADD COLUMN mrp DECIMAL(10, 2) NULL");
    await safeAddColumn("ALTER TABLE ProductVariants ADD COLUMN image VARCHAR(255) NULL");
    await safeAddColumn("ALTER TABLE ProductVariants ADD COLUMN images JSON NULL");
    await safeAddColumn("ALTER TABLE ProductVariants ADD COLUMN colorHex VARCHAR(7) NULL");

    await safeAddColumn('ALTER TABLE Customers ADD COLUMN passwordResetToken VARCHAR(128) NULL DEFAULT NULL');
    await safeAddColumn('ALTER TABLE Customers ADD COLUMN passwordResetExpiry DATETIME NULL DEFAULT NULL');

    await safeAddColumn("ALTER TABLE Banners ADD COLUMN badgeText VARCHAR(50) NULL");
    await safeAddColumn("ALTER TABLE Banners ADD COLUMN countdown DATETIME NULL");
    await safeAddColumn("ALTER TABLE Banners ADD COLUMN position INT DEFAULT 0");

    // 2.5 Run search keywords sync
    try {
      const { syncAllExisting } = require('./services/searchSyncService');
      await syncAllExisting();
    } catch (e) {}

    // 2.6 Sync empty product slugs
    try {
      const { Op } = require('sequelize');
      const { Product } = require('./models');
      const productsWithEmptySlugs = await Product.findAll({
        where: {
          [Op.or]: [
            { slug: '' },
            { slug: { [Op.is]: null } }
          ]
        }
      });
      for (const p of productsWithEmptySlugs) {
        const generatedSlug = p.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        let finalSlug = generatedSlug;
        let count = 1;
        while (await Product.findOne({ where: { slug: finalSlug } })) {
          finalSlug = `${generatedSlug}-${count}`;
          count++;
        }
        await p.update({ slug: finalSlug });
      }
    } catch (slugErr) {}

    // 3. Sync product ratings
    try {
      const { syncAllProductRatings } = require('./controllers/reviewController');
      await syncAllProductRatings();
    } catch (e) {}

    // 3.5 Auto-seed database when tables are empty
    try {
      const seedAll = require('./seeders');
      await seedAll();
    } catch (seedErr) {
      console.warn('⚠️ Seeding note:', seedErr.message);
    }

    // 4. Start server
    app.listen(PORT, () => {
      console.log(`🚀 Twin A Apparels API running at http://localhost:${PORT}`);
      console.log(`   Client: ${process.env.CLIENT_URL}`);
      console.log(`   Admin:  ${process.env.ADMIN_URL}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
};

start();
