'use strict';
const cron = require('node-cron');
const { sequelize, Order, OrderItem, Product, ProductVariant, InventoryMovementLog } = require('../models');
const { Op } = require('sequelize');

// Runs every minute to expire unpaid orders after 15 minutes of inactivity and restore their stock
cron.schedule('* * * * *', async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const ordersToExpire = await Order.findAll({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: {
          [Op.lt]: fifteenMinutesAgo
        }
      },
      include: [{ model: OrderItem, as: 'items' }]
    });

    for (const order of ordersToExpire) {
      const transaction = await sequelize.transaction();
      try {
        const [affectedRows] = await Order.update(
          { status: 'EXPIRED', inventoryProcessed: false },
          {
            where: {
              id: order.id,
              status: 'PENDING_PAYMENT'
            },
            transaction
          }
        );

        if (affectedRows > 0) {
          if (order.inventoryProcessed) {
            for (const item of order.items || []) {
              if (item.variantId) {
                const variant = await ProductVariant.findOne({ where: { id: item.variantId }, lock: transaction.LOCK.UPDATE, transaction });
                if (variant) {
                  await variant.increment('stock', { by: item.quantity, transaction });
                }
              }

              const product = await Product.findOne({ where: { id: item.productId }, lock: transaction.LOCK.UPDATE, transaction });
              if (product) {
                await product.increment('stock', { by: item.quantity, transaction });
              }

              await InventoryMovementLog.create({
                productId: item.productId,
                variantId: item.variantId || null,
                orderId: order.id,
                quantity: item.quantity,
                type: 'ORDER_CANCEL_RESTOCK',
                reason: `Order payment timeout (15 min expired): ${order.orderNumber}`
              }, { transaction });
            }
          }

          await transaction.commit();
          console.log(`[OrderExpiryJob] Successfully expired unpaid Order ${order.orderNumber} (ID: ${order.id}) and restocked inventory.`);
        } else {
          await transaction.rollback();
        }
      } catch (err) {
        await transaction.rollback();
        console.error(`[OrderExpiryJob] Error expiring order ${order.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[OrderExpiryJob] Error running order expiry job:', err.message);
  }
});

console.log('[Cron] Order Expiration job scheduled');
