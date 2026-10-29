import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_AED_RATE } from '../../utils/currency';

// Clear legacy currency from localStorage to ensure strictly Indian Rupees (INR)
if (typeof window !== 'undefined') {
  try {
    localStorage.setItem('bb_currency', 'INR');
  } catch {}
}

const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    code: 'INR',
    rate: DEFAULT_AED_RATE,
  },
  reducers: {
    setCurrency: (state) => {
      state.code = 'INR';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bb_currency', 'INR');
        } catch {}
      }
    },
    setRate: (state, action) => {
      state.rate = action.payload;
    }
  },
});

export const { setCurrency, setRate } = currencySlice.actions;
export default currencySlice.reducer;
