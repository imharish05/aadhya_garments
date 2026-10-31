'use strict';
const router = require('express').Router();
const { getAll, getOne, getWishlist, toggleWishlist, syncWishlist, getTickets, createTicket } = require('../controllers/customerController');
const addressController = require('../controllers/addressController');
const { verifyCustomer, verifyAdmin } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');

// Saved addresses handler (backed by CustomerAddress DB model)
router.get('/addresses', verifyCustomer, addressController.listAddresses);
router.post('/addresses', verifyCustomer, addressController.createAddress);
router.get('/addresses/:addressId', verifyCustomer, addressController.getAddress);
router.put('/addresses/:addressId', verifyCustomer, addressController.updateAddress);
router.put('/addresses/:addressId/default', verifyCustomer, addressController.setDefaultAddress);
router.delete('/addresses/:addressId', verifyCustomer, addressController.deleteAddress);

// Customer self-service routes
router.get('/wishlist', verifyCustomer, getWishlist);
router.post('/wishlist', verifyCustomer, toggleWishlist);
router.post('/wishlist/sync', verifyCustomer, syncWishlist);
router.get('/tickets', verifyCustomer, getTickets);
router.post('/tickets', verifyCustomer, createTicket);

// Admin-only routes
router.get('/', verifyAdmin, hasPermission('view_customers'), getAll);
router.get('/:id', verifyAdmin, hasPermission('view_customers'), getOne);

module.exports = router;
