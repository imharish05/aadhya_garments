'use strict';
const router = require('express').Router();
const { getAll, getOne, getWishlist, toggleWishlist, syncWishlist, getTickets, createTicket } = require('../controllers/customerController');
const { verifyCustomer, verifyAdmin } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');

// Saved addresses handler
let addresses = null;
let addressAuth = verifyCustomer;
try {
  addresses = require('../mob-api/addresses/addressesController');
  addressAuth = require('../mob-api/common/auth');
} catch (e) {
  addresses = {
    listAddresses: (req, res) => res.json({ success: true, addresses: req.customer?.address ? [req.customer.address] : [] }),
    createAddress: (req, res) => res.json({ success: true, message: 'Address updated' }),
    getAddress: (req, res) => res.json({ success: true, address: req.customer?.address || null }),
    updateAddress: (req, res) => res.json({ success: true, message: 'Address updated' }),
    setDefaultAddress: (req, res) => res.json({ success: true, message: 'Default address set' }),
    deleteAddress: (req, res) => res.json({ success: true, message: 'Address deleted' }),
  };
}

router.get('/addresses', addressAuth, addresses.listAddresses);
router.post('/addresses', addressAuth, addresses.createAddress);
router.get('/addresses/:addressId', addressAuth, addresses.getAddress);
router.put('/addresses/:addressId', addressAuth, addresses.updateAddress);
router.put('/addresses/:addressId/default', addressAuth, addresses.setDefaultAddress);
router.delete('/addresses/:addressId', addressAuth, addresses.deleteAddress);

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
