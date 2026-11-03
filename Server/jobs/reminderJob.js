'use strict';
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Product, ProductVariant } = require('../models');
const emailService = require('../services/emailService');

/**
 * Reminder Jobs — scheduled tasks for Twin A Apparels
 */

// ── Daily: low stock alert to admin ──────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running low stock check...');
  try {
    const lowStockThreshold = 10;
    const lowStockItems = [];

    // Check products with low master stock
    const products = await Product.findAll({
      where: {
        isActive: true,
        stock: { [Op.lte]: lowStockThreshold }
      },
      attributes: ['id', 'name', 'sku', 'stock']
    });

    products.forEach(p => {
      lowStockItems.push({
        name: p.name,
        sku: p.sku || 'N/A',
        variant: 'Standard / Master',
        stock: parseInt(p.stock, 10) || 0
      });
    });

    // Check variants with low stock
    const variants = await ProductVariant.findAll({
      where: {
        stock: { [Op.lte]: lowStockThreshold }
      },
      include: [
        { model: Product, as: 'product', where: { isActive: true }, attributes: ['id', 'name'] }
      ],
      attributes: ['id', 'sku', 'stock', 'attributes']
    });

    variants.forEach(v => {
      let varText = '';
      if (v.attributes) {
        let attrs = v.attributes;
        if (typeof attrs === 'string') {
          try { attrs = JSON.parse(attrs); } catch (e) { attrs = {}; }
        }
        if (typeof attrs === 'object') {
          varText = Object.entries(attrs).map(([k, val]) => `${k}: ${val}`).join(' · ');
        }
      }
      lowStockItems.push({
        name: v.product?.name || 'Product Variant',
        sku: v.sku || 'N/A',
        variant: varText || `Variant #${v.id}`,
        stock: parseInt(v.stock, 10) || 0
      });
    });

    if (lowStockItems.length > 0) {
      console.log(`[Cron] Found ${lowStockItems.length} products with stock <= ${lowStockThreshold}. Sending alert to admin...`);
      await emailService.sendLowStockAdminAlert(lowStockItems);
    } else {
      console.log('[Cron] All inventory levels healthy (> 10 units).');
    }
  } catch (err) {
    console.error('[Cron] Error running low stock check:', err.message);
  }
});

console.log('[Cron] Scheduled jobs registered');
