'use strict';

const router = require('express').Router();
const {
  detectGeoLocation,
  initiatePayment,
  handleRazorpayWebhook,
  getPaymentSummary,
  verifyPayment
} = require('../controllers/paymentController');
const { optionalCustomer, verifyAdmin } = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');

// Public geo-detection endpoint
router.get('/geo-detect', detectGeoLocation);

// Client checkout endpoints (handles INR/Razorpay)
router.post('/initiate', optionalCustomer, initiatePayment);
router.post('/verify', optionalCustomer, verifyPayment);

// Webhook endpoint for Razorpay
router.post('/webhook/razorpay', handleRazorpayWebhook);

// Admin dashboard reporting endpoints
router.get('/admin/summary', verifyAdmin, hasPermission('view_payments'), getPaymentSummary);

module.exports = router;
