import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: {
    id: null,
    phone: null,
    email: null,
    username: null,
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthData: (state, action) => {
      const { accessToken, refreshToken, user } = action.payload;
      state.isAuthenticated = true;
      state.user = user;

      // Сохраняем токены в localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = {
        id: null,
        phone: null,
        email: null,
        username: null,
      };

      // Удаляем токены из localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
});

export const { setAuthData, logout } = authSlice.actions;

export default authSlice.reducer;
