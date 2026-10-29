export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email address is required.' };
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required.' };
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
};

export const validatePhoneNumber = (phone, options = {}) => {
  const { required = true, defaultCountry = 'IN' } = options;

  if (!phone || !String(phone).trim()) {
    if (!required) return { isValid: true, formatted: null };
    return { isValid: false, message: 'Phone number is required.' };
  }

  const raw = String(phone).trim();

  // Letters or disallowed symbols
  if (/[a-zA-Z]/.test(raw)) {
    return { isValid: false, message: 'Phone number must not contain letters.' };
  }
  if (/[^0-9+\s\-()]/.test(raw)) {
    return { isValid: false, message: 'Phone number contains invalid characters.' };
  }

  const digitsOnly = raw.replace(/\D/g, '');

  if (!digitsOnly) {
    return { isValid: false, message: 'Phone number must contain only numeric digits.' };
  }

  let country = null;
  let countryCode = null;
  let nationalNumber = null;

  // Check prefix
  if (raw.startsWith('+91') || (digitsOnly.startsWith('91') && digitsOnly.length === 12)) {
    country = 'IN';
    countryCode = '+91';
    nationalNumber = digitsOnly.startsWith('91') && digitsOnly.length === 12 ? digitsOnly.slice(2) : digitsOnly.replace(/^91/, '');
  } else if (raw.startsWith('+971') || (digitsOnly.startsWith('971') && digitsOnly.length === 12)) {
    country = 'AE';
    countryCode = '+971';
    nationalNumber = digitsOnly.startsWith('971') && digitsOnly.length === 12 ? digitsOnly.slice(3) : digitsOnly.replace(/^971/, '');
  } else if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    country = 'IN';
    countryCode = '+91';
    nationalNumber = digitsOnly;
  } else if (digitsOnly.length === 9 && /^5/.test(digitsOnly)) {
    country = 'AE';
    countryCode = '+971';
    nationalNumber = digitsOnly;
  } else if (defaultCountry === 'AE' && (digitsOnly.startsWith('05') || digitsOnly.startsWith('5'))) {
    country = 'AE';
    countryCode = '+971';
    nationalNumber = digitsOnly.startsWith('0') ? digitsOnly.slice(1) : digitsOnly;
  } else {
    if (defaultCountry === 'AE') {
      country = 'AE';
      countryCode = '+971';
      nationalNumber = digitsOnly;
    } else {
      country = 'IN';
      countryCode = '+91';
      nationalNumber = digitsOnly;
    }
  }

  // 1. India Validation (+91)
  if (country === 'IN') {
    if (nationalNumber.length !== 10) {
      if (nationalNumber.length < 10) {
        return { isValid: false, message: 'India mobile number must be exactly 10 digits.' };
      }
      return { isValid: false, message: 'India mobile number cannot exceed 10 digits.' };
    }
    if (!/^[6-9]/.test(nationalNumber)) {
      return { isValid: false, message: 'India mobile numbers must start with 6, 7, 8, or 9 (rejects 0–5).' };
    }
    return {
      isValid: true,
      country: 'IN',
      countryCode: '+91',
      nationalNumber,
      formatted: `+91${nationalNumber}`
    };
  }

  // 2. UAE Validation (+971)
  if (country === 'AE') {
    if (nationalNumber.length !== 9) {
      if (nationalNumber.length < 9) {
        return { isValid: false, message: 'UAE mobile number must be exactly 9 digits.' };
      }
      return { isValid: false, message: 'UAE mobile number cannot exceed 9 digits.' };
    }
    if (!/^5/.test(nationalNumber)) {
      return { isValid: false, message: 'UAE mobile numbers must start with 5 (e.g. 50, 52, 54, 55, 56, 58).' };
    }
    return {
      isValid: true,
      country: 'AE',
      countryCode: '+971',
      nationalNumber,
      formatted: `+971${nationalNumber}`
    };
  }

  return {
    isValid: false,
    message: 'Only India (+91) and UAE/Dubai (+971) phone numbers are supported.'
  };
};

export const parsePhoneNumber = (phone, defaultCountry = 'IN') => {
  if (!phone || !String(phone).trim()) {
    return {
      country: defaultCountry,
      countryCode: defaultCountry === 'AE' ? '+971' : '+91',
      nationalNumber: ''
    };
  }

  const raw = String(phone).trim();
  const digitsOnly = raw.replace(/\D/g, '');

  if (raw.startsWith('+971') || (digitsOnly.startsWith('971') && digitsOnly.length >= 11)) {
    return {
      country: 'AE',
      countryCode: '+971',
      nationalNumber: digitsOnly.startsWith('971') ? digitsOnly.slice(3) : digitsOnly
    };
  }

  if (raw.startsWith('+91') || (digitsOnly.startsWith('91') && digitsOnly.length >= 12)) {
    return {
      country: 'IN',
      countryCode: '+91',
      nationalNumber: digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly
    };
  }

  if (digitsOnly.length === 9 && /^5/.test(digitsOnly)) {
    return {
      country: 'AE',
      countryCode: '+971',
      nationalNumber: digitsOnly
    };
  }

  return {
    country: defaultCountry,
    countryCode: defaultCountry === 'AE' ? '+971' : '+91',
    nationalNumber: digitsOnly
  };
};
