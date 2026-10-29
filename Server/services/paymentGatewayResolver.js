'use strict';

const RazorpayService = require('./RazorpayService');

/**
 * Resolve payment gateway. Domestic INR store powered by Razorpay.
 * @param {string} [currency='INR'] - The currency code
 * @returns {import('./PaymentGatewayInterface')}
 */
const getGateway = (currency = 'INR') => {
  return RazorpayService;
};

module.exports = { getGateway };
