'use strict';
/**
 * /server/models/index.js
 * Loads all Sequelize models and defines all associations in one place.
 * Import this file wherever you need the DB models.
 */

const sequelize = require('../config/db');

// ── Model imports ────────────────────────────────────────────────────────────
const Role              = require('./Role');
const AdminUser         = require('./AdminUser');
const Customer          = require('./Customer');
const CustomerAddress   = require('./CustomerAddress');
Customer.hasMany(CustomerAddress, { foreignKey: 'customerId', as: 'savedAddresses', onDelete: 'CASCADE' });
CustomerAddress.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer', onDelete: 'CASCADE' });

const Category          = require('./Category');
const SubCategory       = require('./SubCategory');
const Product           = require('./Product');
const ProductVariant    = require('./ProductVariant');
const Cart              = require('./Cart');
const CartItem          = require('./CartItem');
const Coupon            = require('./Coupon');
const Order             = require('./Order');
const OrderItem         = require('./OrderItem');
const Wishlist          = require('./Wishlist');
const SupportTicket     = require('./SupportTicket');
const Banner            = require('./Banner');
const Review            = require('./Review');
const MarketingMessage  = require('./MarketingMessage');
const SearchKeyword     = require('./SearchKeyword');
const TrendingCache     = require('./TrendingCache');
const SiteSetting       = require('./SiteSetting');
const InventoryMovementLog = require('./InventoryMovementLog');
const ContactEnquiry    = require('./ContactEnquiry');
const ReturnRequest     = require('./ReturnRequest');

// ── Associations ─────────────────────────────────────────────────────────────

SearchKeyword.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(SearchKeyword,   { foreignKey: 'category_id', as: 'searchKeywords' });

// AdminUser ↔ Role
AdminUser.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(AdminUser,   { foreignKey: 'roleId', as: 'admins' });

// Category ↔ SubCategory
SubCategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(SubCategory,   { foreignKey: 'categoryId', as: 'subcategories' });

// Product ↔ Category / SubCategory
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product,   { foreignKey: 'categoryId', as: 'products' });

Product.belongsTo(SubCategory, { foreignKey: 'subCategoryId', as: 'subcategory' });
SubCategory.hasMany(Product,   { foreignKey: 'subCategoryId', as: 'products' });

// Product ↔ ProductVariant
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Cart ↔ Customer (hasOne)
Customer.hasOne(Cart,   { foreignKey: 'customerId', as: 'cart' });
Cart.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Cart.belongsTo(Coupon, { foreignKey: 'couponId', as: 'coupon' });

// CartItem ↔ Cart / Product / ProductVariant
Cart.hasMany(CartItem,     { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(Cart,   { foreignKey: 'cartId', as: 'cart' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
CartItem.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });
ProductVariant.hasMany(CartItem, { foreignKey: 'variantId', as: 'cartItems' });

// Order ↔ Customer / Coupon
Customer.hasMany(Order,  { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Order.belongsTo(Coupon,  { foreignKey: 'couponId', as: 'coupon' });
Coupon.hasMany(Order,    { foreignKey: 'couponId', as: 'orders' });

// OrderItem ↔ Order / Product / ProductVariant
Order.hasMany(OrderItem,     { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order,   { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', constraints: false, as: 'product' });
OrderItem.belongsTo(ProductVariant, { foreignKey: 'variantId', constraints: false, as: 'variant' });
ProductVariant.hasMany(OrderItem, { foreignKey: 'variantId', constraints: false, as: 'orderItems' });

// InventoryMovementLog
InventoryMovementLog.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
InventoryMovementLog.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });
InventoryMovementLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Wishlist ↔ Customer / Product / ProductVariant
Customer.hasMany(Wishlist,    { foreignKey: 'customerId', as: 'wishlists' });
Wishlist.belongsTo(Customer,  { foreignKey: 'customerId', as: 'customer' });
Wishlist.belongsTo(Product,   { foreignKey: 'productId', as: 'product' });
Product.hasMany(Wishlist,     { foreignKey: 'productId', as: 'wishlistedBy' });
Wishlist.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });
ProductVariant.hasMany(Wishlist,   { foreignKey: 'variantId', as: 'wishlists' });

// Review
Product.hasMany(Review,     { foreignKey: 'productId', as: 'reviews' });
Review.belongsTo(Product,   { foreignKey: 'productId', as: 'product' });
Customer.hasMany(Review,    { foreignKey: 'customerId', as: 'reviews' });
Review.belongsTo(Customer,  { foreignKey: 'customerId', as: 'customer' });
Order.hasMany(Review,       { foreignKey: 'orderId', as: 'reviews' });
Review.belongsTo(Order,     { foreignKey: 'orderId', as: 'order' });

// Stock alerts

// SupportTicket
Customer.hasMany(SupportTicket,    { foreignKey: 'customerId', as: 'tickets' });
SupportTicket.belongsTo(Customer,  { foreignKey: 'customerId', as: 'customer' });
SupportTicket.belongsTo(Order,     { foreignKey: 'orderId', as: 'order' });

// ReturnRequest
Customer.hasMany(ReturnRequest, { foreignKey: 'customerId', as: 'returnRequests' });
ReturnRequest.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Order.hasMany(ReturnRequest, { foreignKey: 'orderId', as: 'returnRequests' });
ReturnRequest.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

OrderItem.hasMany(ReturnRequest, { foreignKey: 'orderItemId', as: 'returnRequests' });
ReturnRequest.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });

Product.hasMany(ReturnRequest, { foreignKey: 'productId', constraints: false, as: 'returnRequests' });
ReturnRequest.belongsTo(Product, { foreignKey: 'productId', constraints: false, as: 'product' });

ProductVariant.hasMany(ReturnRequest, { foreignKey: 'variantId', constraints: false, as: 'returnRequests' });
ReturnRequest.belongsTo(ProductVariant, { foreignKey: 'variantId', constraints: false, as: 'variant' });

module.exports = {
  sequelize,
  Role, AdminUser, Customer, CustomerAddress,
  Category, SubCategory, Product, ProductVariant,
  Cart, CartItem,
  Coupon,
  Order, OrderItem,
  Wishlist,
  SupportTicket, Banner,
  Review, MarketingMessage, SearchKeyword, TrendingCache, SiteSetting, InventoryMovementLog,
  ContactEnquiry,
  ReturnRequest,
};
