import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthData } from './../slices/authSlice';
import AuthService from './../services/AuthService';
import { useNavigate } from 'react-router-dom';
import './Loginpage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
  
    AuthService.login(email, password)
      .then(result => {
        const { accessToken, refreshToken, user } = result;
        
        dispatch(setAuthData({
          accessToken,
          refreshToken,
          user
        }));
        navigate('/home');
      })
      .catch(err => {
        setError("Invalid username or password");
      });
  };
  

  const handleSignUp = () => {
    navigate('/registration');  // Переход на страницу регистрации
  };

  return (
    <div className="login-page">
      <input type="checkbox" className="login-page__checkbox" id="check" />
      <div className="login-page__form login-page__form--login">
        <header className="login-page__header">Login</header>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="login-page__input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="login-page__input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-page__error">{error}</p>}
          
          <div className="login-page__forgot-password">
            <a href="#" className="login-page__forgot-password-link">Forgot password?</a>
          </div>

          <input type="submit" className="login-page__button" value="Login" />
        </form>

        <div className="login-page__signup">
          <span>Don't have an account? 
          <button 
              className="login-page__signup-label" 
              onClick={handleSignUp} 
            >
              Sign Up
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
