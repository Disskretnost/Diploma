import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import { setAuthData } from './slices/authSlice';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import AuthService from './services/AuthService';
import Room from './/pages/Room/room';
import SimpleSFUClient from './pages/VideoConference/VideoConference';


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
      <Route path="/" element={<SimpleSFUClient /> } />
      <Route path="/login" element={<LoginPage /> } />
      <Route path="/home" element={<HomePage /> } />
      <Route path="/room/:id" element={<Room />} />
    </Routes>
      

  );
};

export default App;
