// controllers/userController.js
const userService = require('../services/user-service');
const {validationResult} = require('express-validator');
const ApiError = require('./../exceptions/apiError');
const TokenService = require('./../services/token-service')

class UserController {
    // Регистрация пользователя
    async registration(req, res, next) {
        try {
            const { phone, email, username, password } = req.body;
            const userData = await userService.registration(phone, email, username, password);
            return res.json(userData); 
        } catch (e) {
            next(e); 
        }
    }

    // Логин
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const userData = await userService.login(email, password);
            res.json(userData);
        } catch (e) {
            next(e);
        }
    }

    // Логаут
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ message: "Refresh token не передан" });
            }
            await userService.logout(refreshToken); // Invalidate the refresh token
            return res.json({ message: "Logout successful" });
        } catch (e) {
            next(e);
        }
    }
    

    // Обновление refresh токена
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const newTokens = await userService.refreshToken(refreshToken);
            res.json(newTokens);
        } catch (e) {
            next(e);
        }
    }


    async getUsers(req, res, next) {
        try {
            const users =  await userService.getAllUsers();
            return res.json(users);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new UserController();
