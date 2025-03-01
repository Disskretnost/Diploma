import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { setAuthData } from './slices/authSlice';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import AuthService from './services/AuthService';
import Room from './/pages/Room/room';


const App = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && !isAuthenticated) {
      AuthService.refreshToken(refreshToken)
        .then(data => {
          const { accessToken, refreshToken, user } = data;
          dispatch(setAuthData({ accessToken, refreshToken, user }));
        })
        .catch(error => {
          console.error('Ошибка при обновлении токенов:', error.message);
        });
    }
  }, [dispatch, isAuthenticated]);

  if (isAuthenticated === null) {
    return <div>Загрузка...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Navigate to="/login" />} />
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/home" />} />
      <Route path="/registration" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/home" />} />
      <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
      <Route path="/room/:id" element={<Room />} />
    </Routes>
      

  );
};

export default App;
