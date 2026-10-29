'use strict';
const { Op } = require('sequelize');
const { Product, Category, SubCategory, ProductVariant } = require('../models');
const { syncProductVariants } = require('./variantController');
const fs = require('fs');
const path = require('path');
const { deleteLocalFile } = require('../utils/fileHelper');
const { deleteProductsCascade } = require('../services/productCascadeService');

// Helper to process FormData body & files
const processProductData = (req) => {
  const data = { ...req.body };

  if (data.productName && !data.name) {
    data.name = data.productName.trim();
  }

  if (data.sku !== undefined) {
    data.sku = (typeof data.sku === 'string' && data.sku.trim() !== '') ? data.sku.trim() : null;
  }

  // Helper to safely parse JSON strings
  const parseJsonField = (field) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return field;
      }
    }
    return field;
  };

  if (data.tags) data.tags = parseJsonField(data.tags);
  if (data.attributes) data.attributes = parseJsonField(data.attributes);

  // Parse dynamic variant options [{ optionName, optionValue }] -> attributes object
  if (data.variantOptions) {
    const parsedOptions = parseJsonField(data.variantOptions);
    if (Array.isArray(parsedOptions)) {
      const attrsObj = {};
      parsedOptions.forEach(opt => {
        if (opt.optionName && opt.optionValue) {
          attrsObj[opt.optionName.trim()] = opt.optionValue.trim();
        }
      });
      data.attributes = attrsObj;
    }
  }

  // Cast values from FormData strings
  if (data.price !== undefined) data.price = data.price === '' ? null : parseFloat(data.price);
  if (data.comparePrice !== undefined) data.comparePrice = data.comparePrice === '' || data.comparePrice === 'null' ? null : parseFloat(data.comparePrice);
  if (data.stock !== undefined) data.stock = data.stock === '' ? 0 : parseInt(data.stock, 10);
  if (data.categoryId !== undefined) data.categoryId = data.categoryId === '' || data.categoryId === 'null' ? null : parseInt(data.categoryId, 10);
  if (data.subCategoryId !== undefined) data.subCategoryId = data.subCategoryId === '' || data.subCategoryId === 'null' ? null : parseInt(data.subCategoryId, 10);

  if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
  if (data.isNewArrival !== undefined) data.isNewArrival = data.isNewArrival === 'true' || data.isNewArrival === true;
  if (data.isBestSeller !== undefined) data.isBestSeller = data.isBestSeller === 'true' || data.isBestSeller === true;
  if (data.isActive !== undefined) data.isActive = data.isActive === 'true' || data.isActive === true;

  // Handle uploaded images
  let existingImages = [];
  if (data.existingImages) {
    existingImages = parseJsonField(data.existingImages);
    if (!Array.isArray(existingImages)) {
      existingImages = typeof existingImages === 'string' ? [existingImages] : [];
    }
  }
  existingImages = existingImages.map(img => toRelativeUrl(img));

  const newImages = [];

  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      const normalizedPath = file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      const pathString = '/' + normalizedPath.substring(uploadsIndex);

      if (file.fieldname === 'images' || file.fieldname === 'variantImages') {
        newImages.push(pathString);
      } else if (file.fieldname === 'defaultProductImage') {
        data.defaultProductImage = pathString;
      }
    });
  }

  if (data.defaultProductImage) {
    data.defaultProductImage = toRelativeUrl(data.defaultProductImage);
  }

  data.images = [...existingImages, ...newImages];
  delete data.existingImages;

  // Sync defaultProductImage and images array
  if (data.defaultProductImage) {
    if (!data.images.includes(data.defaultProductImage)) {
      data.images = [data.defaultProductImage, ...data.images];
    }
  } else if (data.images && data.images.length > 0) {
    data.defaultProductImage = data.images[0];
  }

  return { data, existingImages };
};

const { toAbsoluteUrl, toRelativeUrl } = require('../utils/imageUrl');

const formatProduct = (product, req) => {
  if (!product) return product;
  const json = typeof product.toJSON === 'function' ? product.toJSON() : { ...product };

  if (json.defaultProductImage) {
    json.defaultProductImage = toAbsoluteUrl(json.defaultProductImage, req);
  }

  if (Array.isArray(json.images)) {
    json.images = json.images.map(img => toAbsoluteUrl(img, req));
  }

  if (Array.isArray(json.variants)) {
    json.variants = json.variants.map(v => {
      const vJson = typeof v.toJSON === 'function' ? v.toJSON() : { ...v };
      if (vJson.image) {
        vJson.image = toAbsoluteUrl(vJson.image, req);
      }
      if (Array.isArray(vJson.images)) {
        vJson.images = vJson.images.map(img => toAbsoluteUrl(img, req));
      }
      return vJson;
    });
  }

  return json;
};

const getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 12,
      category, minPrice, maxPrice,
      sort = 'createdAt', order = 'DESC',
      search, featured, newArrival, bestSeller,
      minDiscount, maxDiscount
    } = req.query;

    const where = {};
    if (category) {
      if (isNaN(category)) {
        let found = await Category.findOne({ where: { slug: category, isActive: true } });
        if (found) {
          where.categoryId = found.id;
        } else {
          found = await SubCategory.findOne({ where: { slug: category, isActive: true } });
          if (found) {
            where.subCategoryId = found.id;
          } else {
            where.categoryId = -1;
          }
        }
      } else {
        where.categoryId = parseInt(category);
      }
    }
    if (minPrice || maxPrice) where.price = {};
    if (minPrice) where.price[Op.gte] = minPrice;
    if (maxPrice) where.price[Op.lte] = maxPrice;
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (featured === 'true') where.isFeatured = true;
    if (newArrival === 'true') where.isNewArrival = true;
    if (bestSeller === 'true') where.isBestSeller = true;

    if (minDiscount || maxDiscount) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        comparePrice: { [Op.gt]: Product.sequelize.col('Product.price') }
      });

      const discountFormula = Product.sequelize.literal('ROUND(((`Product`.`comparePrice` - `Product`.`price`) / `Product`.`comparePrice`) * 100)');

      if (minDiscount) {
        where[Op.and].push(
          Product.sequelize.where(discountFormula, { [Op.gte]: parseInt(minDiscount, 10) })
        );
      }
      if (maxDiscount) {
        where[Op.and].push(
          Product.sequelize.where(discountFormula, { [Op.lte]: parseInt(maxDiscount, 10) })
        );
      }
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      distinct: true,
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, order]],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: SubCategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'colorHex', 'image', 'images', 'lowStockThreshold', 'gstRate'] }
      ],
    });

    const formattedProducts = rows.map(p => formatProduct(p, req));
    res.json({ success: true, products: formattedProducts, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug, isActive: true },
      include: [
        { model: Category, as: 'category' },
        { model: SubCategory, as: 'subcategory' },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'colorHex', 'image', 'images', 'lowStockThreshold', 'gstRate'] }
      ],
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: formatProduct(product, req) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { data } = processProductData(req);
    const product = await Product.create(data);

    // Handle single default variant sync if req.body.variants is not supplied
    if (!req.body.variants || (Array.isArray(req.body.variants) && req.body.variants.length === 0)) {
      const [defaultVar, created] = await ProductVariant.findOrCreate({
        where: { productId: product.id },
        defaults: {
          sku: product.sku ? `${product.sku}-V1` : `SKU-P${product.id}-V1`,
          price: product.price,
          mrp: product.comparePrice,
          stock: product.stock,
          attributes: product.attributes || {},
          image: product.defaultProductImage || product.images?.[0] || null,
          images: product.images || [],
          gstRate: product.gstRate || '0%'
        }
      });
      if (!created) {
        await defaultVar.update({
          sku: product.sku || defaultVar.sku,
          price: product.price,
          mrp: product.comparePrice,
          stock: product.stock,
          attributes: product.attributes || {},
          image: product.defaultProductImage || product.images?.[0] || defaultVar.image,
          images: product.images || [],
          gstRate: product.gstRate || defaultVar.gstRate || '0%'
        });
      }
    } else {
      let parsedVariants = [];
      try {
        parsedVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) {
        parsedVariants = [];
      }

      if (Array.isArray(parsedVariants)) {
        for (let i = 0; i < parsedVariants.length; i++) {
          const v = parsedVariants[i];

          const vMainFile = req.files ? req.files.find(f => f.fieldname === `variantMain_${i}`) : null;
          let vMainPath = null;
          if (vMainFile) {
            const normalizedPath = vMainFile.path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads');
            vMainPath = '/' + normalizedPath.substring(uploadsIndex);
          }

          const vGalleryFiles = req.files ? req.files.filter(f => f.fieldname === `variantGallery_${i}` || f.fieldname === `variantFiles_${i}`) : [];
          const newGalleryPaths = vGalleryFiles.map(file => {
            const normalizedPath = file.path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads');
            return '/' + normalizedPath.substring(uploadsIndex);
          });

          const mainVarImg = vMainPath || v.image || newGalleryPaths[0] || product.defaultProductImage || product.images?.[0] || null;
          const fallbackSku = `SKU-P${product.id}-V${i + 1}`;

          await ProductVariant.create({
            productId: product.id,
            sku: (v.sku && v.sku.trim() !== '') ? v.sku.trim() : fallbackSku,
            price: (v.price !== undefined && v.price !== '') ? parseFloat(v.price) : parseFloat(product.price || 0),
            mrp: (v.mrp !== undefined && v.mrp !== '') ? parseFloat(v.mrp) : (product.comparePrice ? parseFloat(product.comparePrice) : null),
            stock: (v.stock !== undefined && v.stock !== '') ? parseInt(v.stock, 10) : parseInt(product.stock || 0, 10),
            lowStockThreshold: v.lowStockThreshold ? parseInt(v.lowStockThreshold, 10) : (product.lowStockThreshold || 10),
            gstRate: (v.gstRate !== undefined && v.gstRate !== null && v.gstRate !== '') ? v.gstRate : (product.gstRate || '0%'),
            attributes: v.attributes || {},
            ...(v.colorHex !== undefined && { colorHex: v.colorHex || null }),
            image: mainVarImg,
            images: (newGalleryPaths.length > 0 ? newGalleryPaths : (v.images || [])).filter(img => img && img !== mainVarImg).slice(0, 5),
          });
        }
        await syncProductVariants(product.id);
      }
    }

    const freshProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: SubCategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'colorHex', 'image', 'images', 'lowStockThreshold', 'gstRate'] }
      ]
    });

    res.status(201).json({ success: true, product: formatProduct(freshProduct, req) });
  } catch (err) {
    console.error('[Create Product Error]:', err);
    const detailMsg = err.errors && Array.isArray(err.errors) ? err.errors.map(e => e.message).join(', ') : err.message;
    res.status(500).json({ success: false, message: detailMsg || err.message });
  }
};

const update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { data } = processProductData(req);

    // Identify and delete removed files safely
    const oldImages = product.images || [];
    const activeImages = new Set([
      ...(data.images || []),
      ...(data.defaultProductImage ? [data.defaultProductImage] : []),
      ...(product.defaultProductImage ? [product.defaultProductImage] : [])
    ]);
    const removedImages = oldImages.filter(img => img && !activeImages.has(img));
    removedImages.forEach(img => deleteLocalFile(img));

    await product.update(data);

    // Update variants if supplied
    if (req.body.variants) {
      let parsedVariants = [];
      try {
        parsedVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) {
        parsedVariants = [];
      }

      if (Array.isArray(parsedVariants)) {
        const oldVariants = await ProductVariant.findAll({ where: { productId: product.id } });
        const oldVariantMap = new Map(oldVariants.map(v => [v.id, v]));
        const activeVariantIds = new Set();

        for (let i = 0; i < parsedVariants.length; i++) {
          const v = parsedVariants[i];
          
          const vMainFile = req.files ? req.files.find(f => f.fieldname === `variantMain_${i}`) : null;
          let vMainPath = null;
          if (vMainFile) {
            const normalizedPath = vMainFile.path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads');
            vMainPath = '/' + normalizedPath.substring(uploadsIndex);
          }

          const vGalleryFiles = req.files ? req.files.filter(f => f.fieldname === `variantGallery_${i}` || f.fieldname === `variantFiles_${i}`) : [];
          const newGalleryPaths = vGalleryFiles.map(file => {
            const normalizedPath = file.path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads');
            return '/' + normalizedPath.substring(uploadsIndex);
          });

          const existingGallery = v.images ? (typeof v.images === 'string' ? JSON.parse(v.images) : v.images) : (v.existingImages || []);
          const mainVarImg = vMainPath || v.image || product.defaultProductImage || null;
          const galleryFiltered = existingGallery.filter(img => img && img !== mainVarImg);
          const vImages = [...galleryFiltered, ...newGalleryPaths].slice(0, 5);

          let existingVariant = null;
          if (v.id && oldVariantMap.has(parseInt(v.id, 10))) {
            existingVariant = oldVariantMap.get(parseInt(v.id, 10));
          } else if ((req.body.isSingleVariantEdit === 'true' || req.body.isSingleVariantEdit === true) && oldVariants.length > 0) {
            existingVariant = oldVariants[0];
          }

          const varPrice = (v.price !== undefined && v.price !== '') ? parseFloat(v.price) : parseFloat(product.price || 0);
          const varMrp = (v.mrp !== undefined && v.mrp !== '') ? parseFloat(v.mrp) : (product.comparePrice ? parseFloat(product.comparePrice) : null);
          const varStock = (v.stock !== undefined && v.stock !== '') ? parseInt(v.stock, 10) : parseInt(product.stock || 0, 10);
          const varLowStock = v.lowStockThreshold ? parseInt(v.lowStockThreshold, 10) : (product.lowStockThreshold || 10);
          const varGst = (v.gstRate !== undefined && v.gstRate !== null && v.gstRate !== '') ? v.gstRate : (product.gstRate || '0%');
          const fallbackSku = `SKU-P${product.id}-V${i + 1}`;

          if (existingVariant) {
            await existingVariant.update({
              sku: (v.sku && v.sku.trim() !== '') ? v.sku.trim() : (existingVariant.sku || fallbackSku),
              price: varPrice,
              mrp: varMrp,
              stock: varStock,
              lowStockThreshold: varLowStock,
              gstRate: varGst,
              attributes: v.attributes || {},
              ...(v.colorHex !== undefined && { colorHex: v.colorHex || null }),
              image: mainVarImg,
              images: vImages,
            });
            activeVariantIds.add(existingVariant.id);
          } else {
            const newVar = await ProductVariant.create({
              productId: product.id,
              sku: (v.sku && v.sku.trim() !== '') ? v.sku.trim() : fallbackSku,
              price: varPrice,
              mrp: varMrp,
              stock: varStock,
              lowStockThreshold: varLowStock,
              gstRate: varGst,
              attributes: v.attributes || {},
              ...(v.colorHex !== undefined && { colorHex: v.colorHex || null }),
              image: mainVarImg,
              images: vImages,
            });
            activeVariantIds.add(newVar.id);
          }
        }

        if (req.body.isSingleVariantEdit !== 'true' && req.body.isSingleVariantEdit !== true) {
          const deletedVariants = oldVariants.filter(ov => !activeVariantIds.has(ov.id));
          for (const dv of deletedVariants) {
            await dv.destroy();
          }
        }

        await syncProductVariants(product.id);
      }
    } else {
      const existingVariants = await ProductVariant.findAll({ where: { productId: product.id } });
      if (existingVariants.length === 1) {
        await existingVariants[0].update({
          stock: product.stock,
          price: product.price,
          mrp: product.comparePrice,
          gstRate: product.gstRate || existingVariants[0].gstRate || '0%'
        });
      }
    }

    const freshProduct = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: SubCategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'colorHex', 'image', 'images', 'lowStockThreshold', 'gstRate'] }
      ]
    });

    res.json({ success: true, product: formatProduct(freshProduct, req) });
  } catch (err) {
    console.error('[Update Product Error]:', err);
    const detailMsg = err.errors && Array.isArray(err.errors) ? err.errors.map(e => e.message).join(', ') : err.message;
    res.status(500).json({ success: false, message: detailMsg || err.message });
  }
};

const remove = async (req, res) => {
  const transaction = await Product.sequelize.transaction();
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await deleteProductsCascade(id, transaction);

    await transaction.commit();
    res.json({ success: true, message: 'Product and all its variants deleted successfully' });
  } catch (err) {
    await transaction.rollback();
    console.error(`[Delete Product Error]:`, err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFeatured = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isFeatured: true, isActive: true },
      limit: 12,
      include: [
        { model: Category, as: 'category', attributes: ['name', 'slug'] },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'colorHex', 'image', 'images', 'lowStockThreshold', 'gstRate'] },
      ],
    });
    res.json({ success: true, products: products.map(product => formatProduct(product, req)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, products: [] });
    const products = await Product.findAll({
      where: {
        isActive: true,
        name: { [Op.like]: `%${q.trim()}%` },
      },
      limit: 8,
      attributes: ['id', 'name', 'slug', 'price', 'images', 'discountPercent'],
    });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPriceRange = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const [[result]] = await sequelize.query(
      'SELECT COALESCE(MIN(price), 0) AS minPrice, COALESCE(MAX(price), 50000) AS maxPrice FROM Products WHERE isActive = 1'
    );
    res.json({
      success: true,
      minPrice: Number(result.minPrice),
      maxPrice: Number(result.maxPrice),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { formatProduct, getAll, getOne, create, update, remove, getFeatured, search, getPriceRange };
