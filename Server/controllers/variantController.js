'use strict';
const { Op } = require('sequelize');
const { Product, ProductVariant, InventoryMovementLog } = require('../models');

// Helper to generate a unique sequential SKU if not provided
const generateSku = async (productId) => {
  const count = await ProductVariant.count({ where: { productId } });
  let nextNum = count + 1;
  let candidate = `SKU-P${productId}-V${nextNum}`;
  while (await ProductVariant.findOne({ where: { sku: candidate } })) {
    nextNum++;
    candidate = `SKU-P${productId}-V${nextNum}`;
  }
  return candidate;
};

// Helper to normalize file paths
const buildImagePath = (file) => {
  if (!file) return null;
  return '/' + file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
};

// Helper to sync variant details back to the main Product (price, stock, and attributes)
const syncProductVariants = async (productId) => {
  if (!productId) return;
  try {
    const product = await Product.findByPk(productId);
    if (!product) return;

    const variants = await ProductVariant.findAll({ where: { productId } });

    if (variants.length > 0) {
      // Find the lowest active variant price, or fallback to product price
      const validPrices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p) && p > 0);
      const price = validPrices.length > 0 ? Math.min(...validPrices) : (parseFloat(product.price) || 0);

      const validMrps = variants.map(v => parseFloat(v.mrp)).filter(p => !isNaN(p) && p > 0);
      const comparePrice = validMrps.length > 0 ? Math.max(...validMrps) : (product.comparePrice ? parseFloat(product.comparePrice) : null);

      const stock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
      const gstRate = variants[0].gstRate || product.gstRate || '0%';

      // Collect and aggregate attributes from all active variants
      const aggregatedAttrs = {};
      variants.forEach(v => {
        const vAttrs = typeof v.attributes === 'string' ? (JSON.parse(v.attributes) || {}) : (v.attributes || {});
        Object.entries(vAttrs).forEach(([k, val]) => {
          if (!k || val === undefined || val === null) return;
          const cleanK = k.trim();
          const cleanVal = String(val).trim();
          if (!cleanK || !cleanVal) return;

          if (!aggregatedAttrs[cleanK]) {
            aggregatedAttrs[cleanK] = [cleanVal];
          } else if (!aggregatedAttrs[cleanK].includes(cleanVal)) {
            aggregatedAttrs[cleanK].push(cleanVal);
          }
        });
      });

      const finalAttributes = {};
      Object.entries(aggregatedAttrs).forEach(([k, vals]) => {
        finalAttributes[k] = vals.join(', ');
      });

      await product.update({ price, comparePrice, stock, gstRate, attributes: finalAttributes });
    }
  } catch (err) {
    console.error('[syncProductVariants] Error:', err.message);
  }
};

// GET /api/variants
const getAll = async (req, res) => {
  try {
    const variants = await ProductVariant.findAll({
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/variants/product/:productId
const getByProduct = async (req, res) => {
  try {
    const variants = await ProductVariant.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/variants/add
const add = async (req, res) => {
  try {
    const { productId, sku, price, mrp, stock, attributes } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
    if (price !== undefined && Number(price) < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });

    const finalSku = (sku && sku.trim() !== '') ? sku.trim() : await generateSku(productId);

    // Check SKU conflicts
    const conflict = await ProductVariant.findOne({ where: { sku: finalSku } });
    if (conflict) {
      return res.status(400).json({ success: false, message: `SKU "${finalSku}" is already in use` });
    }

    // Process file uploads (up to 10 images per variant)
    let existingImagesParsed = [];
    if (req.body.existingImages) {
      try { existingImagesParsed = JSON.parse(req.body.existingImages); }
      catch (e) { existingImagesParsed = Array.isArray(req.body.existingImages) ? req.body.existingImages : []; }
    }

    let galleryPaths = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        const p = buildImagePath(file);
        if (p) galleryPaths.push(p);
      });
    } else if (req.file) {
      const p = buildImagePath(req.file);
      if (p) galleryPaths.push(p);
    }

    const allImages = [...existingImagesParsed, ...galleryPaths].slice(0, 10);
    const mainVarImg = allImages.length > 0 ? allImages[0] : null;

    let parsedAttributes = attributes || {};
    if (typeof attributes === 'string') {
      try { parsedAttributes = JSON.parse(attributes); } catch (e) { parsedAttributes = {}; }
    }

    // Check if variant with identical attributes already exists for this product
    const existingVariants = await ProductVariant.findAll({ where: { productId: parseInt(productId, 10) } });
    const isDuplicate = existingVariants.some(v => {
      const vAttrs = v.attributes || {};
      const keysA = Object.keys(vAttrs).sort();
      const keysB = Object.keys(parsedAttributes).sort();
      if (keysA.length !== keysB.length) return false;
      return keysA.every(k => String(vAttrs[k]).trim().toLowerCase() === String(parsedAttributes[k]).trim().toLowerCase());
    });

    if (isDuplicate) {
      return res.status(400).json({ success: false, message: 'A variant with this combination of option attributes already exists for this product.' });
    }

    const { lowStockThreshold } = req.body;

    // Auto-inherit GST from parent product
    const parentProduct = await Product.findByPk(parseInt(productId, 10));
    const inheritedGstRate = parentProduct?.gstRate || '0%';

    const variant = await ProductVariant.create({
      productId: parseInt(productId, 10),
      sku: finalSku,
      price: price === '' || price === undefined ? null : parseFloat(price),
      mrp: mrp === '' || mrp === undefined ? null : parseFloat(mrp),
      stock: stock === '' || stock === undefined ? 0 : parseInt(stock, 10),
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : 10,
      gstRate: inheritedGstRate,
      attributes: parsedAttributes,
      colorHex: req.body.colorHex || null,
      image: mainVarImg,
      images: allImages.slice(0, 5),
    });

    // Sync product price and stock
    await syncProductVariants(variant.productId);

    res.status(201).json({ success: true, variant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/variants/update/:id
const update = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const { sku, price, mrp, stock, attributes, lowStockThreshold } = req.body;

    const parentProduct = await Product.findByPk(variant.productId);
    const inheritedGstRate = parentProduct?.gstRate || variant.gstRate || '0%';

    if (price !== undefined && Number(price) < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });

    if (sku && sku.trim() !== variant.sku) {
      const conflict = await ProductVariant.findOne({ where: { sku: sku.trim(), id: { [Op.ne]: variant.id } } });
      if (conflict) {
        return res.status(400).json({ success: false, message: `SKU "${sku}" is already in use` });
      }
    }

    const updates = {
      ...(req.body.colorHex !== undefined && { colorHex: req.body.colorHex || null }),
      ...(sku !== undefined && { sku: sku.trim() }),
      ...(price !== undefined && { price: price === '' ? null : parseFloat(price) }),
      ...(mrp !== undefined && { mrp: mrp === '' ? null : parseFloat(mrp) }),
      ...(stock !== undefined && { stock: stock === '' ? 0 : parseInt(stock, 10) }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold, 10) }),
      gstRate: inheritedGstRate,
    };

    if (attributes !== undefined) {
      let parsedAttributes = attributes;
      if (typeof attributes === 'string') {
        try { parsedAttributes = JSON.parse(attributes); } catch (e) { parsedAttributes = {}; }
      }
      updates.attributes = parsedAttributes;
    }

    // Process file uploads (up to 10 images per variant)
    let existingImagesParsed = [];
    if (req.body.existingImages) {
      try { existingImagesParsed = JSON.parse(req.body.existingImages); }
      catch (e) { existingImagesParsed = Array.isArray(req.body.existingImages) ? req.body.existingImages : []; }
    } else if (variant.images) {
      existingImagesParsed = variant.images;
    }

    let galleryPaths = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(file => {
        const p = buildImagePath(file);
        if (p) galleryPaths.push(p);
      });
    } else if (req.file) {
      const p = buildImagePath(req.file);
      if (p) galleryPaths.push(p);
    }

    if (req.body.existingImages || galleryPaths.length > 0) {
      const allImages = [...existingImagesParsed, ...galleryPaths].slice(0, 10);
      updates.images = allImages;
      updates.image = allImages.length > 0 ? allImages[0] : null;
    }

    await variant.update(updates);

    // Sync product price and stock
    await syncProductVariants(variant.productId);

    const fresh = await ProductVariant.findByPk(variant.id);
    res.json({ success: true, variant: fresh });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/variants/:id
const remove = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const productId = variant.productId;

    const productVariants = await ProductVariant.findAll({
      where: { productId },
      order: [['id', 'ASC']]
    });

    if (productVariants.length <= 1) {
      await variant.destroy();

      const { Product } = require('../models');
      const product = await Product.findByPk(productId);
      if (product) {
        await product.destroy();
      }

      return res.json({
        success: true,
        cascadeDeletedProduct: true,
        productId,
        message: 'Last variant removed — parent product has also been deleted from the catalog.'
      });
    }

    await variant.destroy();

    // Re-sync parent product (price, stock, attributes) from remaining variants
    await syncProductVariants(productId);

    res.json({
      success: true,
      cascadeDeletedProduct: false,
      message: 'Variant deleted successfully. Product default has been updated to the next available variant.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getByProduct, add, update, remove, syncProductVariants };
