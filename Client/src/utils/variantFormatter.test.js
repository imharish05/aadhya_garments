import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAttrCaseInsensitive, areVariantsEqual, isCartItemMatch } from './variantFormatter.js';

test('getAttrCaseInsensitive: retrieves attribute values case-insensitively', () => {
  const attrs = { Size: 'M', color: 'White' };
  assert.equal(getAttrCaseInsensitive(attrs, 'size'), 'M');
  assert.equal(getAttrCaseInsensitive(attrs, 'SIZE'), 'M');
  assert.equal(getAttrCaseInsensitive(attrs, 'Size'), 'M');
  assert.equal(getAttrCaseInsensitive(attrs, 'Color'), 'White');
  assert.equal(getAttrCaseInsensitive(attrs, 'COLOR'), 'White');
  assert.equal(getAttrCaseInsensitive(attrs, 'nonexistent'), undefined);
});

test('areVariantsEqual: compares objects and stringified JSON accurately', () => {
  assert.equal(areVariantsEqual({ Size: 'M', Color: 'White' }, { size: 'm', color: 'white' }), true);
  assert.equal(areVariantsEqual({ Size: 'M' }, { Size: 'L' }), false);
  assert.equal(areVariantsEqual('{"Size":"M"}', { size: 'm' }), true);
  assert.equal(areVariantsEqual({}, {}), true);
  assert.equal(areVariantsEqual(null, null), true);
  assert.equal(areVariantsEqual({ Size: 'M', stock: 10 }, { size: 'm', id: 5 }), true); // ignored system keys
});

test('isCartItemMatch: returns true only for matching product and variant', () => {
  const product = {
    id: 10,
    name: 'Signature Italian Linen Tailored Shirt',
    variants: [
      { id: 101, attributes: { Size: 'M', Color: 'Crisp White' } },
      { id: 102, attributes: { Size: 'L', Color: 'Crisp White' } },
    ]
  };

  // Item in cart has variant 101 (Size M, Crisp White)
  const cartItemVar101 = {
    productId: 10,
    variantId: 101,
    selectedVariant: { Size: 'M', Color: 'Crisp White' }
  };

  // When selected variant is 101 (Size M): should match (inCart = true -> "View Cart")
  const selectedVar101 = { id: 101, attributes: { Size: 'M', Color: 'Crisp White' } };
  assert.equal(
    isCartItemMatch(cartItemVar101, product, selectedVar101, selectedVar101.attributes, true),
    true
  );

  // When user switches option to Size L (variant 102): should NOT match (inCart = false -> "Add to Cart")
  const selectedVar102 = { id: 102, attributes: { Size: 'L', Color: 'Crisp White' } };
  assert.equal(
    isCartItemMatch(cartItemVar101, product, selectedVar102, selectedVar102.attributes, true),
    false
  );

  // When product has no DB variants, matches by attributes
  const simpleProduct = { id: 20, name: 'Simple Shirt' };
  const cartItemAttrM = {
    productId: 20,
    selectedVariant: { Size: 'M' }
  };

  assert.equal(
    isCartItemMatch(cartItemAttrM, simpleProduct, null, { Size: 'M' }, false),
    true
  );
  assert.equal(
    isCartItemMatch(cartItemAttrM, simpleProduct, null, { Size: 'L' }, false),
    false
  );

  // Different product ID entirely
  assert.equal(
    isCartItemMatch(cartItemVar101, { id: 99 }, selectedVar101, selectedVar101.attributes),
    false
  );
});
