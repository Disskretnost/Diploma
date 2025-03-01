import { configureStore } from '@reduxjs/toolkit';
import authReducer from './../slices/authSlice';  // Путь может быть другим, в зависимости от структуры проекта

const store = configureStore({
  reducer: {
    auth: authReducer,  // Здесь мы добавляем редуктор для аутентификации
  },
});

export default store;
