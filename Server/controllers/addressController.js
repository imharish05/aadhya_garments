'use strict';
const { CustomerAddress, Customer } = require('../models');

/**
 * List all saved addresses for the authenticated customer
 * GET /customers/addresses
 */
const listAddresses = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const addresses = await CustomerAddress.findAll({
      where: { customerId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    return res.json({ success: true, addresses });
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new saved address
 * POST /customers/addresses
 */
const createAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const {
      label = 'Home',
      name,
      phone,
      email = '',
      address,
      addressLine2 = '',
      landmark = '',
      city,
      state,
      pincode,
      country = 'India',
      isDefault = false
    } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, address, city, state, and pincode are required.'
      });
    }

    // Check count: if customer has no addresses yet, make this one default
    const existingCount = await CustomerAddress.count({ where: { customerId } });
    const shouldBeDefault = Boolean(isDefault || existingCount === 0);

    if (shouldBeDefault) {
      await CustomerAddress.update({ isDefault: false }, { where: { customerId } });
    }

    const newAddress = await CustomerAddress.create({
      customerId,
      label: (label || 'Home').trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: (email || req.customer.email || '').trim(),
      address: address.trim(),
      addressLine2: (addressLine2 || '').trim(),
      landmark: (landmark || '').trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: (country || 'India').trim(),
      isDefault: shouldBeDefault
    });

    // Also update Customer.address JSON snapshot if this is default
    if (shouldBeDefault) {
      try {
        await Customer.update(
          {
            address: {
              fullName: newAddress.name,
              phone: newAddress.phone,
              email: newAddress.email,
              address: newAddress.address,
              city: newAddress.city,
              state: newAddress.state,
              pincode: newAddress.pincode,
              country: newAddress.country
            }
          },
          { where: { id: customerId } }
        );
      } catch (custErr) {
        console.error('Non-critical: Failed to update Customer.address snapshot:', custErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      address: newAddress
    });
  } catch (err) {
    console.error('Error creating address:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get a single saved address by ID
 * GET /customers/addresses/:addressId
 */
const getAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const address = await CustomerAddress.findOne({
      where: { id: req.params.addressId, customerId }
    });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    return res.json({ success: true, address });
  } catch (err) {
    console.error('Error fetching address:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update a saved address
 * PUT /customers/addresses/:addressId
 */
const updateAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const address = await CustomerAddress.findOne({
      where: { id: req.params.addressId, customerId }
    });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const {
      label,
      name,
      phone,
      email,
      address: street,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      isDefault
    } = req.body;

    if (isDefault) {
      await CustomerAddress.update({ isDefault: false }, { where: { customerId } });
    }

    await address.update({
      label: label !== undefined ? label.trim() : address.label,
      name: name !== undefined ? name.trim() : address.name,
      phone: phone !== undefined ? phone.trim() : address.phone,
      email: email !== undefined ? (email || '').trim() : address.email,
      address: street !== undefined ? street.trim() : address.address,
      addressLine2: addressLine2 !== undefined ? (addressLine2 || '').trim() : address.addressLine2,
      landmark: landmark !== undefined ? (landmark || '').trim() : address.landmark,
      city: city !== undefined ? city.trim() : address.city,
      state: state !== undefined ? state.trim() : address.state,
      pincode: pincode !== undefined ? pincode.trim() : address.pincode,
      country: country !== undefined ? (country || 'India').trim() : address.country,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : address.isDefault
    });

    return res.json({
      success: true,
      message: 'Address updated successfully',
      address
    });
  } catch (err) {
    console.error('Error updating address:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Set an address as default
 * PUT /customers/addresses/:addressId/default
 */
const setDefaultAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const address = await CustomerAddress.findOne({
      where: { id: req.params.addressId, customerId }
    });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await CustomerAddress.update({ isDefault: false }, { where: { customerId } });
    await address.update({ isDefault: true });

    return res.json({
      success: true,
      message: 'Default address set successfully',
      address
    });
  } catch (err) {
    console.error('Error setting default address:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a saved address
 * DELETE /customers/addresses/:addressId
 */
const deleteAddress = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const address = await CustomerAddress.findOne({
      where: { id: req.params.addressId, customerId }
    });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = address.isDefault;
    await address.destroy();

    // If this was default, assign default to the most recent remaining address
    if (wasDefault) {
      const remaining = await CustomerAddress.findOne({
        where: { customerId },
        order: [['createdAt', 'DESC']]
      });
      if (remaining) {
        await remaining.update({ isDefault: true });
      }
    }

    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (err) {
    console.error('Error deleting address:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listAddresses,
  createAddress,
  getAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress
};
