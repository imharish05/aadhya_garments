'use strict';

/**
 * Robust variant attribute parser and formatter.
 * Handles double/triple stringified JSON safely.
 */
export const formatVariantName = (rawVar) => {
  if (!rawVar) return null;
  let parsed = rawVar;

  // Unpack nested JSON strings if present
  for (let i = 0; i < 5; i++) {
    if (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ) {
        try {
          const next = JSON.parse(parsed);
          if (next === parsed) break;
          parsed = next;
        } catch {
          break;
        }
      } else {
        break;
      }
    } else {
      break;
    }
  }

  if (Array.isArray(parsed) && parsed.length > 0) {
    parsed = parsed[0];
  }

  if (parsed && typeof parsed === 'object') {
    if (typeof parsed.variantName === 'string' && parsed.variantName.trim()) {
      return parsed.variantName.trim();
    }
    if (typeof parsed.name === 'string' && parsed.name.trim() && !parsed.name.includes('{')) {
      return parsed.name.trim();
    }
    if (typeof parsed.variant === 'string' && parsed.variant.trim() && !parsed.variant.includes('{')) {
      return parsed.variant.trim();
    }

    const entries = Object.entries(parsed).filter(
      ([k, v]) =>
        v !== undefined &&
        v !== null &&
        v !== '' &&
        !['id', 'createdAt', 'updatedAt', 'productId', 'price', 'stock', 'sku', 'image', 'gstRate', 'variantId'].includes(k)
    );

    if (entries.length > 0) {
      return entries
        .map(([k, v]) => (k.toLowerCase() === 'variant' ? String(v) : `${k}: ${v}`))
        .join(' · ');
    }
  }

  if (typeof parsed === 'string' && parsed !== '{}' && parsed !== '[]') {
    return parsed;
  }

  return null;
};

/**
 * Safely access an attribute value from an object using case-insensitive key matching.
 */
export const getAttrCaseInsensitive = (obj, targetKey) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  if (obj[targetKey] !== undefined) return obj[targetKey];
  const targetLower = String(targetKey).trim().toLowerCase();
  const foundKey = Object.keys(obj).find(k => k.trim().toLowerCase() === targetLower);
  return foundKey ? obj[foundKey] : undefined;
};

/**
 * Compare two variant attribute maps or JSON strings for equality.
 */
export const areVariantsEqual = (varA, varB) => {
  let a = varA;
  let b = varB;

  for (let i = 0; i < 5; i++) {
    if (typeof a === 'string') {
      try { a = JSON.parse(a); } catch { break; }
    } else break;
  }
  for (let i = 0; i < 5; i++) {
    if (typeof b === 'string') {
      try { b = JSON.parse(b); } catch { break; }
    } else break;
  }

  const cleanObj = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
    const result = {};
    const IGNORED_KEYS = ['id', 'createdAt', 'updatedAt', 'productId', 'price', 'stock', 'sku', 'image', 'gstRate', 'variantId'];
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && !IGNORED_KEYS.includes(k)) {
        result[k.trim().toLowerCase()] = String(v).trim().toLowerCase();
      }
    });
    return result;
  };

  const cleanA = cleanObj(a);
  const cleanB = cleanObj(b);

  const keysA = Object.keys(cleanA).sort();
  const keysB = Object.keys(cleanB).sort();

  if (keysA.length === 0 && keysB.length === 0) return true;
  if (keysA.length !== keysB.length) return false;

  return keysA.every(k => cleanA[k] === cleanB[k]);
};

/**
 * Check whether a cart item matches a product and its currently selected variant/attributes.
 */
export const isCartItemMatch = (item, product, selectedVariant = null, currentSelectedAttrs = null, hasDbVariants = null) => {
  if (!item || !product) return false;

  const sameProd = Number(item.productId || item.product?.id || item.id) === Number(product.id);
  if (!sameProd) return false;

  const itemVarId = item.variantId || item.variant?.id || null;
  const targetVarId = selectedVariant?.id || null;
  const isDbVariants = hasDbVariants !== null ? hasDbVariants : Boolean(product.variants && product.variants.length > 0);

  if (isDbVariants) {
    if (targetVarId) {
      if (itemVarId) {
        return Number(itemVarId) === Number(targetVarId);
      }
      const itemAttrs = item.selectedVariant || item.variant?.attributes;
      if (itemAttrs && typeof itemAttrs === 'object' && Object.keys(itemAttrs).length > 0) {
        return areVariantsEqual(itemAttrs, currentSelectedAttrs);
      }
      return false;
    }
  }

  if (itemVarId || targetVarId) {
    return Number(itemVarId) === Number(targetVarId);
  }

  const itemAttrs = item.selectedVariant || item.variant?.attributes;
  const hasItemAttrs = itemAttrs && typeof itemAttrs === 'object' && Object.keys(itemAttrs).length > 0;
  const hasSelectedAttrs = currentSelectedAttrs && typeof currentSelectedAttrs === 'object' && Object.keys(currentSelectedAttrs).length > 0;

  if (hasItemAttrs || hasSelectedAttrs) {
    return areVariantsEqual(itemAttrs, currentSelectedAttrs);
  }

  return true;
};
