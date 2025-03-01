import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthData } from './../slices/authSlice';
import AuthService from './../services/AuthService';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate
import './RegisterPage.css';

const RegisterPage = () => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate(); // Инициализируем navigate

    const handleSubmit = (e) => {
        e.preventDefault();
    
        // Проверка на совпадение паролей
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
    
        AuthService.registration(phone, email, username, password )
            .then(result => {
                const { accessToken, refreshToken, user } = result;
    
                // Отправляем экшн для обновления Redux стора с данными авторизации
                dispatch(setAuthData({
                    accessToken,
                    refreshToken,
                    user
                }));
    
                // Перенаправляем на главную страницу после успешной регистрации
                navigate('/home');
            })
            .catch(err => {
                // В случае ошибки
                setError('Ошибка регистрации. Пожалуйста, попробуйте снова.');
            });
    };
    

    return (
        <div className="registration-page">
            <input type="checkbox" className="registration-page__checkbox" id="check" />
            <div className="registration-page__form registration-page__form--register">
                <header className="registration-page__header">Register</header>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        className="registration-page__input"
                        placeholder="Enter your phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        className="registration-page__input"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        className="registration-page__input"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="registration-page__input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="registration-page__input"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    {error && <p className="registration-page__error">{error}</p>}
                    <input type="submit" className="registration-page__button" value="Register" />
                </form>
                <div className="registration-page__signup">
                    <span>Already have an account? 
                    <button
                        className="registration-page__signup-label"
                        onClick={() => navigate('/login')} // Навигация на страницу логина
                    >
                        Login
                    </button>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
