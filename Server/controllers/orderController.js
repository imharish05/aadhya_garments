const { couponReason, couponDiscount } = require('../services/couponRules');
'use strict';
const { sequelize, Order, OrderItem, Product, ProductVariant, Customer, Coupon, Cart, CartItem, InventoryMovementLog, SiteSetting, Category, ReturnRequest } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sendOrderStatusNotification } = require('../services/emailService');
const currencyRateService = require('../services/currencyRateService');
const { toAbsoluteUrl } = require('../utils/imageUrl');
const { validatePhoneNumber } = require('../utils/phoneValidation');

const orderItemInclude = {
  model: OrderItem,
  as: 'items',
  required: false,
  include: [
    {
      model: ProductVariant,
      as: 'variant',
      attributes: ['id', 'sku', 'image', 'attributes', 'gstRate'],
      required: false
    },
    {
      model: Product,
      as: 'product',
      attributes: ['id', 'name', 'sku', 'images', 'defaultProductImage', 'slug', 'categoryId', 'gstRate'],
      required: false,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'image', 'attributes', 'gstRate'], required: false }
      ]
    },
    {
      model: ReturnRequest,
      as: 'returnRequests',
      required: false
    }
  ]
};

const formatOrder = (order, req) => {
  if (!order) return order;
  const json = typeof order.toJSON === 'function' ? order.toJSON() : { ...order };
  if (Array.isArray(json.items)) {
    json.items = json.items.map(item => {
      // Resolve proper GST rate for item
      item.gstRate = item.gstRate || item.variant?.gstRate || item.product?.gstRate || (json.taxRate !== undefined && json.taxRate !== null ? `${json.taxRate}%` : '0%');

      // Prioritize variant-specific image
      let variantImg = item.variant?.image || item.variantImage || null;

      // Fallback: If variant not directly attached but product has variants, match by variantId or selectedVariant
      if (!variantImg && item.product?.variants && Array.isArray(item.product.variants)) {
        const found = item.product.variants.find(v => {
          if (item.variantId && v.id === item.variantId) return true;
          if (v.image && item.selectedVariant && typeof item.selectedVariant === 'object') {
            try {
              const sv = typeof v.attributes === 'string' ? JSON.parse(v.attributes) : v.attributes;
              return JSON.stringify(sv) === JSON.stringify(item.selectedVariant);
            } catch (e) {
              return false;
            }
          }
          return false;
        });
        if (found?.image) variantImg = found.image;
        if (!item.gstRate && found?.gstRate) item.gstRate = found.gstRate;
      }

      // Default product fallback image
      const productImg = item.productImage || item.image || item.product?.defaultProductImage || (Array.isArray(item.product?.images) ? item.product.images[0] : null);

      const resolvedDisplayImg = variantImg || productImg || '';

      if (item.variant?.image) item.variant.image = toAbsoluteUrl(item.variant.image, req);
      if (item.variantImage) item.variantImage = toAbsoluteUrl(item.variantImage, req);
      if (item.productImage) item.productImage = toAbsoluteUrl(item.productImage, req);
      if (item.image) item.image = toAbsoluteUrl(item.image, req);

      item.displayImage = toAbsoluteUrl(resolvedDisplayImg, req);

      if (variantImg) {
        item.variantImage = toAbsoluteUrl(variantImg, req);
        item.image = toAbsoluteUrl(variantImg, req);
        item.productImage = toAbsoluteUrl(variantImg, req);
      }

      if (Array.isArray(item.returnRequests)) {
        item.returnRequests = item.returnRequests.map(ret => {
          const r = typeof ret.toJSON === 'function' ? ret.toJSON() : { ...ret };
          if (r.productImage) r.productImage = toAbsoluteUrl(r.productImage, req);
          if (r.unboxingVideoUrl && !r.unboxingVideoUrl.startsWith('http')) {
            r.unboxingVideoUrl = toAbsoluteUrl(r.unboxingVideoUrl, req);
          }
          if (Array.isArray(r.images)) {
            r.images = r.images.map(img => (img.startsWith('http') ? img : toAbsoluteUrl(img, req)));
          }
          return r;
        });
      }

      return item;
    });
  }

  if (Array.isArray(json.returnRequests)) {
    json.returnRequests = json.returnRequests.map(ret => {
      const r = typeof ret.toJSON === 'function' ? ret.toJSON() : { ...ret };
      if (r.productImage) r.productImage = toAbsoluteUrl(r.productImage, req);
      if (r.unboxingVideoUrl && !r.unboxingVideoUrl.startsWith('http')) {
        r.unboxingVideoUrl = toAbsoluteUrl(r.unboxingVideoUrl, req);
      }
      if (Array.isArray(r.images)) {
        r.images = r.images.map(img => (img.startsWith('http') ? img : toAbsoluteUrl(img, req)));
      }
      return r;
    });
  }

  return json;
};

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customerId, search } = req.query;
    const { Op } = require('sequelize');

    const where = {};

    const validOrderList = [
      { paymentStatus: { [Op.in]: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] } },
      { paymentMethod: { [Op.in]: ['COD', 'Cash on Delivery', 'Cash on Delivery (COD)'] } },
      { paymentMethod: { [Op.like]: '%COD%' } },
      { status: { [Op.in]: ['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED', 'RETURNED', 'REFUNDED'] } }
    ];

    if (status) {
      if (status === 'PENDING' || status === 'New Orders') {
        where[Op.and] = [
          { [Op.or]: validOrderList },
          { status: { [Op.in]: ['PENDING', 'PENDING_PAYMENT', 'PAID', 'PAYMENT_RECEIVED_STOCK_FAILED'] } }
        ];
      } else {
        where.status = status;
      }
    } else {
      where[Op.or] = validOrderList;
    }

    if (customerId) where.customerId = customerId;
    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { id: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      distinct: true,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'], required: false },
        orderItemInclude,
        { model: ReturnRequest, as: 'returnRequests', required: false },
      ],
    });
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.max(1, parseInt(limit, 10));
    const formattedOrders = rows.map(o => formatOrder(o, req));
    res.json({ success: true, orders: formattedOrders, total: count, page: p, limit: l, totalPages: Math.ceil(count / l) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { Op } = require('sequelize');

    const orders = await Order.findAll({
      where: {
        customerId: req.customer.id,
        [Op.or]: [
          { paymentStatus: 'PAID' },
          { paymentMethod: 'Cash on Delivery (COD)' },
          { paymentMethod: 'COD' },
          { status: { [Op.in]: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'] } }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        orderItemInclude,
        { model: ReturnRequest, as: 'returnRequests', required: false },
      ],
    });
    const formattedOrders = orders.map(o => formatOrder(o, req));
    res.json({ success: true, orders: formattedOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customerId: req.customer.id },
      include: [
        orderItemInclude,
        { model: ReturnRequest, as: 'returnRequests', required: false },
        { model: Coupon, as: 'coupon' },
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: formatOrder(order, req) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelMyOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, customerId: req.customer.id },
      include: [{ model: OrderItem, as: 'items' }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const cancellableStatuses = ['PENDING', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.status === 'PROCESSING' ? 'packed/processing' : order.status === 'SHIPPED' ? 'dispatched' : order.status}. Cancellation is strictly not permitted once packed or dispatched.`,
      });
    }

    // 24-hour / Same-day cancellation window check
    const orderCreatedAt = new Date(order.createdAt).getTime();
    const hoursSincePlaced = (Date.now() - orderCreatedAt) / (1000 * 60 * 60);
    if (hoursSincePlaced > 24) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Orders can only be cancelled within 24 hours of placement (same day). Please contact customer support.',
      });
    }

    const rawReason = req.body?.reason || req.body?.cancellationReason;
    const reason = typeof rawReason === 'string' ? rawReason.trim() : '';
    if (!reason || reason.length < 3) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A valid cancellation reason is required to process order cancellation.',
      });
    }

    if (order.inventoryProcessed) {
      const sortedItems = [...order.items].sort((a, b) => {
        if (a.productId !== b.productId) return a.productId - b.productId;
        return (a.variantId || 0) - (b.variantId || 0);
      });

      for (const item of sortedItems) {
        if (item.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item.variantId },
            lock: transaction.LOCK.UPDATE,
            transaction
          });
          if (variant) {
            await variant.increment('stock', { by: item.quantity, transaction });
          }
        }

        const product = await Product.findOne({
          where: { id: item.productId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (product) {
          await product.increment('stock', { by: item.quantity, transaction });
        }

        // Log movement
        await InventoryMovementLog.create({
          productId: item.productId,
          variantId: item.variantId || null,
          orderId: order.id,
          quantity: item.quantity,
          type: 'ORDER_CANCEL_RESTOCK',
          reason: `Customer cancelled order: ${order.orderNumber}. Reason: ${reason}`
        }, { transaction });
      }

      order.inventoryProcessed = false;
    }

    let timeline = order.statusTimeline || {};
    if (typeof timeline === 'string') {
      try { timeline = JSON.parse(timeline); } catch (e) { timeline = {}; }
    }
    timeline.CANCELLED = new Date().toISOString();
    timeline.cancelReason = reason;
    timeline.cancelledBy = 'CUSTOMER';

    const isPaidOnline = order.paymentStatus === 'PAID';
    const paymentId = order.razorpay_payment_id || order.razorpay_order_id || order.paymentGatewayRef;
    const refundAmount = parseFloat(order.totalAmount || 0);

    if (isPaidOnline && paymentId && refundAmount > 0) {
      try {
        const gatewayResolver = require('../services/paymentGatewayResolver');
        const gateway = gatewayResolver.getGateway(order.currency || 'INR');
        const refundResult = await gateway.refund(paymentId, refundAmount);

        if (refundResult.success) {
          order.paymentStatus = 'REFUNDED';
          if (refundResult.gatewayPaymentId && !order.razorpay_payment_id) {
            order.razorpay_payment_id = refundResult.gatewayPaymentId;
          }
          timeline.refundStatus = 'COMPLETED';
          timeline.refundGatewayRef = refundResult.gatewayRef || paymentId;
          timeline.refundAmount = refundResult.amount || refundAmount;
          timeline.refundNote = `100% full refund of ₹${refundAmount} processed successfully via Razorpay (Ref: ${refundResult.gatewayRef || paymentId}).`;

          await InventoryMovementLog.create({
            productId: 0,
            orderId: order.id,
            quantity: 0,
            type: 'REFUND_OOS',
            reason: `Automated 100% full refund of ${order.currency || 'INR'} ${refundAmount} upon customer order cancellation (Gateway Ref: ${refundResult.gatewayRef || paymentId}).`
          }, { transaction });
        } else {
          console.warn(`[cancelMyOrder] Gateway refund: ${refundResult.status}`);
          timeline.refundStatus = 'PENDING_MANUAL';
          timeline.refundNote = `Automated gateway refund note: ${refundResult.status}. Full refund will be processed to the original payment method.`;
        }
      } catch (refundErr) {
        console.error('[cancelMyOrder] Error executing payment refund:', refundErr.message);
        timeline.refundStatus = 'PENDING_MANUAL';
        timeline.refundNote = `Full refund of ${order.currency || 'INR'} ${refundAmount} will be processed to the original payment method within 5-7 business days.`;
      }
    }

// Loyalty points removed

    order.status = 'CANCELLED';
    order.statusTimeline = timeline;
    await order.save({ transaction });

    await transaction.commit();

    const { syncStorefrontStock } = require('./warehouseController');
    if (order.items && typeof syncStorefrontStock === 'function') {
      for (const item of order.items) {
        syncStorefrontStock(item.productId, item.variantId || null).catch(console.error);
      }
    }

    sendOrderStatusNotification(order, 'CANCELLED').catch(err => console.error('[orderController] Error sending cancel email:', err.message));

    res.json({ success: true, message: 'Order cancelled successfully', order: formatOrder(order, req) });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        orderItemInclude,
        { model: ReturnRequest, as: 'returnRequests', required: false },
        { model: Coupon, as: 'coupon' },
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: formatOrder(order, req) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const trackOrder = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isNum = !isNaN(identifier) && !isNaN(parseInt(identifier, 10)) && String(parseInt(identifier, 10)) === String(identifier).trim();

    const whereClause = isNum
      ? { [Op.or]: [{ id: parseInt(identifier, 10) }, { orderNumber: identifier }] }
      : { orderNumber: identifier };

    const order = await Order.findOne({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        orderItemInclude,
        { model: ReturnRequest, as: 'returnRequests', required: false },
        { model: Coupon, as: 'coupon' },
      ],
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // IDOR Protection: Verify ownership or access credentials
    const reqSessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    const isCustomerOwner = req.customer && order.customerId && req.customer.id === order.customerId;
    const isGuestSessionOwner = order.sessionId && reqSessionId && order.sessionId === reqSessionId;
    const isAdmin = Boolean(req.admin);

    if (isNum) {
      if (!isCustomerOwner && !isGuestSessionOwner && !isAdmin) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
    } else {
      if (order.customerId && !isCustomerOwner && !isGuestSessionOwner && !isAdmin) {
        const qEmail = (req.query.email || '').trim().toLowerCase();
        const qPhone = (req.query.phone || '').trim().replace(/[^0-9]/g, '');
        const orderPhone = (order.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
        const orderEmail = (order.customer?.email || order.billingAddress?.email || '').trim().toLowerCase();

        const matchesContact = (qEmail && qEmail === orderEmail) || (qPhone && orderPhone && orderPhone.endsWith(qPhone.slice(-10)));
        if (!matchesContact) {
          return res.status(404).json({ success: false, message: 'Order not found' });
        }
      }
    }

    res.json({ success: true, order: formatOrder(order, req) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const placeOrder = async (req, res) => {
  console.log('[placeOrder] --- Place Order Triggered ---');
  console.log('[placeOrder] Customer authenticated:', req.customer ? `Yes (ID: ${req.customer.id})` : 'No (Guest)');
  console.log('[placeOrder] Header x-session-id:', req.headers['x-session-id']);
  const transaction = await sequelize.transaction();
  try {
    // 1. Force session lock wait timeout to protect against locking bottlenecks
    await sequelize.query('SET SESSION innodb_lock_wait_timeout = 5', { transaction });

    const { shippingAddress, billingAddress, paymentMethod, couponCode, isBuyNow, buyNowItem } = req.body;
    const isCod = paymentMethod === 'COD' || paymentMethod === 'Cash on Delivery (COD)' || (typeof paymentMethod === 'string' && paymentMethod.includes('Cash on Delivery'));

    // 2. Fetch server-side cart or process isolated Buy Now item
    let cart = null;
    let itemsToLock = [];

    if (isBuyNow && buyNowItem && buyNowItem.productId) {
      const p = await Product.findOne({ where: { id: buyNowItem.productId, isActive: true }, transaction });
      if (!p) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Selected product is no longer available' });
      }
      let v = null;
      if (buyNowItem.variantId) {
        v = await ProductVariant.findOne({ where: { id: buyNowItem.variantId, productId: p.id }, transaction });
        if (!v) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: 'Selected product variant is no longer available' });
        }
      }
      const itemPrice = v && v.price ? parseFloat(v.price) : parseFloat(p.price);
      itemsToLock = [{
        productId: p.id,
        variantId: v ? v.id : null,
        quantity: Math.max(1, parseInt(buyNowItem.quantity, 10) || 1),
        price: itemPrice,
        name: p.name,
        image: v?.image || p.defaultProductImage || (Array.isArray(p.images) ? p.images[0] : '') || '',
        selectedVariant: v?.attributes || buyNowItem.selectedVariant || {}
      }];
    } else {
      let cartWhere = {};
      if (req.customer && req.customer.id) {
        cartWhere = { customerId: req.customer.id };
      } else {
        const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
        if (!sessionId) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Cart session is missing' });
        }
        cartWhere = { sessionId };
      }

      cart = await Cart.findOne({
        where: cartWhere,
        include: [{
          model: CartItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }],
        transaction
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      itemsToLock = cart.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: parseFloat(item.priceAtAdd),
        name: item.product?.name || 'Product',
        image: item.variant?.image || item.variantImage || item.image || item.product?.defaultProductImage || item.product?.images?.[0] || '',
        selectedVariant: item.selectedVariant || {}
      }));
    }

    itemsToLock.sort((a, b) => {
      if (a.productId !== b.productId) return a.productId - b.productId;
      return (a.variantId || 0) - (b.variantId || 0);
    });

    // 4. Lock products/variants inside transaction
    const outOfStockItems = [];
    const lockedStock = {};

    for (const item of itemsToLock) {
      let currentStock = 0;
      if (item.variantId) {
        const variant = await ProductVariant.findOne({
          where: { id: item.variantId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (!variant) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: `Product variant ${item.variantId} not found` });
        }
        currentStock = variant.stock;
        lockedStock[`v_${item.variantId}`] = variant;
        if (variant.image) {
          item.image = variant.image;
        }
        // If cart item didn't carry variant attributes, fill from the locked variant record
        if (!item.selectedVariant || Object.keys(item.selectedVariant).length === 0) {
          item.selectedVariant = variant.attributes || {};
        }
      } else {
        const product = await Product.findOne({
          where: { id: item.productId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        }
        currentStock = product.stock;
        lockedStock[`p_${item.productId}`] = product;
      }

      if (currentStock < item.quantity) {
        outOfStockItems.push({
          productId: item.productId,
          productName: item.name,
          availableStock: currentStock,
          requestedQty: item.quantity
        });
      }
    }

    // 5. If stock validation fails, rollback and return CHECKOUT_STOCK_CHANGED
    if (outOfStockItems.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'CHECKOUT_STOCK_CHANGED',
        items: outOfStockItems
      });
    }

    // 6. Calculate amounts
    let subtotal = itemsToLock.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    let couponId = null;
    let couponFreeShipping = false;

    if (couponCode) {
      const coupon = await Coupon.findOne({ where: { code: String(couponCode).trim().toUpperCase(), isActive: true }, transaction });
      if (coupon && !couponReason(coupon, subtotal)) {
        // Check per-person redemption limit
        const customerId = req.customer?.id || req.user?.id || req.user?.customerId || null;
        let limitExceeded = false;
        if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && Number(coupon.usageLimit) > 0 && customerId) {
          const priorUsageCount = await Order.count({
            where: { customerId, couponId: coupon.id, status: { [Op.ne]: 'CANCELLED' } },
            transaction
          });
          if (priorUsageCount >= Number(coupon.usageLimit)) limitExceeded = true;
        }

        if (!limitExceeded) {
          couponId = coupon.id;
          discountAmount = couponDiscount(coupon, subtotal);
          couponFreeShipping = coupon.type === 'FREE_SHIPPING';
          await coupon.increment('usageCount', { transaction });
        }
      }
    }

    // Standard Shipping Calculation
    let shippingAmount = subtotal >= 1499 ? 0 : 99;
    if (couponId && couponFreeShipping) shippingAmount = 0;
    const totalDiscount = discountAmount;
    const taxableSubtotal = Math.max(0, subtotal - totalDiscount);

    // Calculate tax per item using configured product / variant gstRate
    let taxAmount = 0;
    let weightedTaxSum = 0;
    for (const item of itemsToLock) {
      const itemLineTotal = item.price * item.quantity;
      const itemDiscount = subtotal > 0 ? (totalDiscount * itemLineTotal) / subtotal : 0;
      const itemTaxable = Math.max(0, itemLineTotal - itemDiscount);

      const variantRec = item.variantId ? lockedStock[`v_${item.variantId}`] : null;
      const productRec = lockedStock[`p_${item.productId}`];
      const rawGst = variantRec?.gstRate ?? productRec?.gstRate ?? '0%';
      const parsedRate = parseFloat(String(rawGst).replace(/[^0-9.]/g, ''));
      const itemGstRate = !isNaN(parsedRate) ? parsedRate : 0;

      const itemTax = Math.round((itemTaxable * itemGstRate) / (100 + itemGstRate));
      taxAmount += itemTax;
      weightedTaxSum += itemGstRate * itemLineTotal;
    }

    const taxRate = subtotal > 0 ? Math.round((weightedTaxSum / subtotal) * 10) / 10 : 0;
    const totalAmount = Math.round(taxableSubtotal + shippingAmount);
    const resolvedPaymentMethod = isCod ? 'Cash on Delivery (COD)' : 'Razorpay Secure Online';

    // 7. Create Order record (INR only)
    const order = await Order.create({
      orderNumber: `TA${uuidv4().slice(0, 8).toUpperCase()}`,
      customerId: req.customer ? req.customer.id : null,
      sessionId: req.customer ? null : (cart ? cart.sessionId : (req.cookies?.sessionId || req.headers['x-session-id'])),
      couponId,
      status: isCod ? 'CONFIRMED' : 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      paymentMethod: resolvedPaymentMethod,
      subtotal,
      discountAmount,
      couponDiscount: discountAmount,
      shippingAmount,
      taxAmount,
      taxRate,
      totalAmount,
      currency: 'INR',
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes: (isBuyNow ? '[BUY_NOW] ' : '') + (req.body.notes || ''),
      inventoryProcessed: isCod,
      statusTimeline: isCod
        ? { PENDING: new Date().toISOString(), CONFIRMED: new Date().toISOString() }
        : { PENDING_PAYMENT: new Date().toISOString(), PENDING: new Date().toISOString() }
    }, { transaction });

    // 8. Snap order items
    const orderItemsPayload = itemsToLock.map(item => {
      const variantRec = item.variantId ? lockedStock[`v_${item.variantId}`] : null;
      const productRec = lockedStock[`p_${item.productId}`];
      const unitPrice = item.price;
      const totalPrice = Math.round((unitPrice * item.quantity) * 100) / 100;
      const itemGst = item.gstRate || variantRec?.gstRate || productRec?.gstRate || '0%';
      return {
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        productImage: item.image,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        gstRate: itemGst,
        selectedVariant: (() => {
          let sv = item.selectedVariant;
          if (typeof sv === 'string') {
            try { sv = JSON.parse(sv); } catch (e) { sv = null; }
          }
          return (sv && typeof sv === 'object' && Object.keys(sv).length > 0) ? sv : null;
        })()
      };
    });

    for (const snapItem of orderItemsPayload) {
      await OrderItem.create(snapItem, { transaction });
    }

    // 9. Process stock deduction immediately upon order placement ONLY for COD orders.
    // Online orders (Razorpay) process stock deduction upon payment confirmation in paymentController.
    if (isCod) {
      for (const item of itemsToLock) {
        if (item.variantId) {
          const varObj = lockedStock[`v_${item.variantId}`];
          if (varObj) {
            await varObj.decrement('stock', { by: item.quantity, transaction });
          }
          const parentProduct = await Product.findOne({
            where: { id: item.productId },
            lock: transaction.LOCK.UPDATE,
            transaction
          });
          if (parentProduct) {
            await parentProduct.decrement('stock', { by: item.quantity, transaction });
          }
        } else {
          const prodObj = lockedStock[`p_${item.productId}`];
          if (prodObj) {
            await prodObj.decrement('stock', { by: item.quantity, transaction });
          }
        }

        // Log movement
        await InventoryMovementLog.create({
          productId: item.productId,
          variantId: item.variantId || null,
          orderId: order.id,
          quantity: -item.quantity,
          type: 'ORDER_DEDUCTION',
          reason: `COD Order placement: ${order.orderNumber}`
        }, { transaction });
      }

      await order.update({ inventoryProcessed: true }, { transaction });

      // Clear server-side cart items for COD orders (unless Buy Now)
      if (!isBuyNow && cart) {
        await CartItem.destroy({ where: { cartId: cart.id }, transaction });
      }
    }

    await transaction.commit();



    // Send email notification for new order (only for COD orders; online payment orders receive confirmation email after payment completes)
    if (isCod) {
      Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: 'items' },
          { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }
        ]
      }).then(fullOrder => {
        if (fullOrder) {
          sendOrderStatusNotification(fullOrder, 'CONFIRMED').catch(err => console.error('[orderController] Error sending placeOrder notification email:', err.message));
        }
      }).catch(err => console.error('[orderController] Error fetching full order for email notification:', err.message));
    }

    res.status(201).json({
      success: true,
      order: {
        ...order.toJSON(),
        items: orderItemsPayload
      }
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin status update: handles restocking when order is cancelled or refunded
const updateStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.query('SET SESSION innodb_lock_wait_timeout = 5', { transaction });
    const { status, paymentStatus } = req.body;

    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [{ model: OrderItem, as: 'items' }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    const previousProcessed = order.inventoryProcessed;

    // Handle restocking if transition goes to CANCELLED or REFUNDED and stock was previously deducted
    const isRestockRequired = (status === 'CANCELLED' || status === 'REFUNDED') &&
      previousStatus !== 'CANCELLED' &&
      previousStatus !== 'REFUNDED' &&
      previousProcessed === true;

    if (isRestockRequired) {
      const sortedItems = [...order.items].sort((a, b) => {
        if (a.productId !== b.productId) return a.productId - b.productId;
        return (a.variantId || 0) - (b.variantId || 0);
      });

      for (const item of sortedItems) {
        if (item.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item.variantId },
            lock: transaction.LOCK.UPDATE,
            transaction
          });
          if (variant) {
            await variant.increment('stock', { by: item.quantity, transaction });
          }
        }
        
        const product = await Product.findOne({
          where: { id: item.productId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (product) {
          await product.increment('stock', { by: item.quantity, transaction });
        }

        // Log movement
        await InventoryMovementLog.create({
          productId: item.productId,
          variantId: item.variantId || null,
          orderId: order.id,
          quantity: item.quantity,
          type: 'ORDER_CANCEL_RESTOCK',
          reason: `Order cancelled/refunded. Status: ${status}. Previous: ${previousStatus}`
        }, { transaction });
      }

      order.inventoryProcessed = false;
    }

    let currentTimeline = order.statusTimeline || {};
    if (typeof currentTimeline === 'string') {
      try { currentTimeline = JSON.parse(currentTimeline); } catch (e) { currentTimeline = {}; }
    }
    const updatedTimeline = {
      ...currentTimeline,
      [status]: new Date().toISOString()
    };
    if (!updatedTimeline.PENDING) {
      updatedTimeline.PENDING = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();
    }

    const isCancelOrRefund = status === 'CANCELLED' || status === 'REFUNDED';
    const isPaidOnline = order.paymentStatus === 'PAID';
    const paymentId = order.razorpay_payment_id || order.razorpay_order_id || order.paymentGatewayRef;
    const refundAmount = parseFloat(order.totalAmount || 0);

    let resolvedPaymentStatus = paymentStatus || order.paymentStatus;

    if (isCancelOrRefund && isPaidOnline && paymentId && refundAmount > 0 && order.paymentStatus !== 'REFUNDED') {
      try {
        const gatewayResolver = require('../services/paymentGatewayResolver');
        const gateway = gatewayResolver.getGateway(order.currency || 'INR');
        const refundResult = await gateway.refund(paymentId, refundAmount);

        if (refundResult.success) {
          resolvedPaymentStatus = 'REFUNDED';
          if (refundResult.gatewayPaymentId && !order.razorpay_payment_id) {
            order.razorpay_payment_id = refundResult.gatewayPaymentId;
          }
          updatedTimeline.refundStatus = 'COMPLETED';
          updatedTimeline.refundGatewayRef = refundResult.gatewayRef || paymentId;
          updatedTimeline.refundAmount = refundResult.amount || refundAmount;
          updatedTimeline.refundNote = `100% full refund of ₹${refundAmount} processed successfully via Razorpay (Ref: ${refundResult.gatewayRef || paymentId}).`;

          await InventoryMovementLog.create({
            productId: 0,
            orderId: order.id,
            quantity: 0,
            type: 'REFUND_OOS',
            reason: `Automated 100% full refund of ${order.currency || 'INR'} ${refundAmount} on status transition to ${status} (Gateway Ref: ${refundResult.gatewayRef || paymentId}).`
          }, { transaction });
        } else {
          console.warn(`[updateStatus] Gateway refund note: ${refundResult.status}`);
          updatedTimeline.refundStatus = 'PENDING_MANUAL';
          updatedTimeline.refundNote = `Automated gateway refund note: ${refundResult.status}. Full refund will be processed manually.`;
        }
      } catch (refundErr) {
        console.error('[updateStatus] Error executing payment refund:', refundErr.message);
        updatedTimeline.refundStatus = 'PENDING_MANUAL';
        updatedTimeline.refundNote = `Full refund of ${order.currency || 'INR'} ${refundAmount} will be processed manually.`;
      }
    }

// Loyalty points removed

    const orderUpdatePayload = {
      status,
      paymentStatus: resolvedPaymentStatus,
      inventoryProcessed: order.inventoryProcessed,
      statusTimeline: updatedTimeline
    };
    if (status === 'DELIVERED' && !order.deliveredAt) {
      orderUpdatePayload.deliveredAt = new Date();
    }

    await order.update(orderUpdatePayload, { transaction });

    await transaction.commit();

    // Post-commit storefront stock sync
    if (isRestockRequired) {
      const { syncStorefrontStock } = require('./warehouseController');
      for (const item of order.items) {
        syncStorefrontStock(item.productId, item.variantId || null).catch(console.error);
      }
    }

    // Fetch full order with items and customer details for email notification
    Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }
      ]
    }).then(fullOrder => {
      if (fullOrder) {
        sendOrderStatusNotification(fullOrder, status).catch(err => console.error('[orderController] Error sending status email:', err.message));
      }
    }).catch(console.error);

    res.json({ success: true, order });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const validOrderWhere = {
      [Op.or]: [
        { paymentStatus: 'PAID' },
        { paymentMethod: 'COD' }
      ]
    };

    const [totalOrders, todayOrders, monthOrders, totalCustomers, pendingOrders, deliveredOrders] = await Promise.all([
      Order.count({ where: validOrderWhere }),
      Order.count({ where: { ...validOrderWhere, createdAt: { [Op.gte]: today } } }),
      Order.count({ where: { ...validOrderWhere, createdAt: { [Op.gte]: thisMonth } } }),
      Customer.count(),
      Order.count({ where: { status: 'PENDING' } }),
      Order.count({ where: { status: 'DELIVERED' } }),
    ]);

    const revenueData = await Order.findAll({
      where: { paymentStatus: 'PAID' },
      attributes: ['totalAmount'],
    });
    
    let totalRevenueINR = 0;
    revenueData.forEach(o => {
      totalRevenueINR += (parseFloat(o.totalAmount) || 0);
    });

    res.json({
      success: true,
      stats: { 
        totalOrders, 
        todayOrders, 
        monthOrders, 
        totalCustomers, 
        pendingOrders, 
        deliveredOrders, 
        totalRevenue: Math.round(totalRevenueINR)
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStatusCounts = async (req, res) => {
  try {
    const validOrderCondition = {
      [Op.or]: [
        { paymentStatus: { [Op.in]: ['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'] } },
        { paymentMethod: { [Op.in]: ['COD', 'Cash on Delivery', 'Cash on Delivery (COD)'] } },
        { paymentMethod: { [Op.like]: '%COD%' } },
        { status: { [Op.in]: ['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'OUT_FOR_DELIVERY', 'CANCELLED', 'RETURNED', 'REFUNDED'] } }
      ]
    };

    const orderCounts = await Order.findAll({
      where: validOrderCondition,
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true
    });

    const counts = {
      ALL: 0,
      ABANDONED: 0,
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      OUT_FOR_DELIVERY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      RETURNED: 0,
      REFUNDED: 0
    };

    let totalValidOrders = 0;

    orderCounts.forEach(row => {
      const c = parseInt(row.count, 10) || 0;
      totalValidOrders += c;
      const st = row.status;
      if (st === 'PENDING' || st === 'PENDING_PAYMENT' || st === 'PAID' || st === 'PAYMENT_RECEIVED_STOCK_FAILED') {
        counts.PENDING += c;
      } else if (Object.prototype.hasOwnProperty.call(counts, st)) {
        counts[st] += c;
      }
    });

    counts.ALL = totalValidOrders;

    try {
      const abandonedCount = await Cart.count({
        include: [{ model: CartItem, as: 'items', required: true }]
      });
      counts.ABANDONED = abandonedCount;
    } catch {
      counts.ABANDONED = 0;
    }

    try {
      const activeReturnsCount = await ReturnRequest.count({
        where: { status: { [Op.notIn]: ['REFUNDED', 'REJECTED'] } }
      });
      counts.RETURNED = Math.max(counts.RETURNED, activeReturnsCount);
    } catch {
      // Keep order counts RETURNED
    }

    res.json({ success: true, counts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, getMyOrders, getMyOrderById, trackOrder, cancelMyOrder, placeOrder, updateStatus, getDashboardStats, getStatusCounts };

