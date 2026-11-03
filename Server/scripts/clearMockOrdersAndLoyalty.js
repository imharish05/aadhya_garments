const { sequelize, Order, OrderItem, Customer } = require('../models');

async function clearMockData() {
  try {
    console.log('🧹 Clearing mock Orders...');
    await sequelize.authenticate();
    
    // Delete all OrderItems first due to foreign key constraints
    await OrderItem.destroy({ where: {}, truncate: false });
    await Order.destroy({ where: {}, truncate: false });
    
    console.log('✅ Successfully cleared all mock Orders and Order Items!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing mock data:', err);
    process.exit(1);
  }
}

clearMockData();
