// token-service.js
const jwt = require('jsonwebtoken');
const Token = require('../models/Token');
const { where } = require('sequelize');
require('dotenv').config({ path: '../.env' });  // Указываем путь к файлу .env на один уровень выше

class TokenService {
    generateToken(payload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '30m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return {
            accessToken,
            refreshToken
        };
    }

    async saveToken(id, refreshToken) {
        const tokenData = await Token.findOne({ where: { userId: id } });
        if (tokenData) {
            tokenData.refresh = refreshToken;
            return tokenData.save();
        }
        const token = await Token.create({ userId: id, refresh: refreshToken });
        return token;
    }
    
    async removeToken(refreshToken) {
        const tokenData = await Token.destroy({
            where: { refresh: refreshToken }
        });
        return tokenData;
    }

    async findToken(refreshToken) {
        const tokenData = await Token.findOne({
            where: { refresh: refreshToken }
        });
        return tokenData;
    }

    validateAccessToken(token){
        try{
            const userData = jwt.verify(token,process.env.JWT_ACCESS_SECRET);
            return userData;
        }catch(e){
            return null
        }
    }

    validateRefreshToken(token){
        try{
            const userData = jwt.verify(token,process.env.JWT_REFRESH_SECRET);
            return userData;
        }catch(e){
            return null
        }
    }

}

module.exports = new TokenService();
