const User = require('./../models/User');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const TokenService = require('./token-service');
const UserDTO = require('./../dtos/user-dto');
const ApiError = require('./../exceptions/apiError');
const tokenService = require('./token-service');

class UserService {
    async registration(phone, email, username, password) {
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { phone },
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.phone === phone) {
                throw ApiError.BadRequest('Пользователь с таким телефоном уже существует');
            }
            if (existingUser.email === email) {
                throw ApiError.BadRequest('Пользователь с таким email уже существует');
            }
            if (existingUser.username === username) {
                throw  ApiError.BadRequest('Пользователь с таким username уже существует');
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ phone, email, username, password: hashedPassword });
        const newUserDto = new UserDTO(newUser);
        const tokens = TokenService.generateToken({ id: newUserDto.id });
        await TokenService.saveToken(newUserDto.id, tokens.refreshToken);
        return { ...tokens, user: newUserDto };
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email: email } });
        if (!user) {
            throw ApiError.BadRequest("Пользователя с таким email не найдено");
        }    
        const isPasswordEquals = await bcrypt.compare(password, user.dataValues.password);
        if (!isPasswordEquals) {
            throw ApiError.BadRequest("Неверный пароль");
        }
        const userDto = new UserDTO(user);
        const tokens = TokenService.generateToken({ id: userDto.id });
        await TokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto };
    }

    async logout(refreshToken){
        const token = await tokenService.removeToken(refreshToken);
        if (token === 0) {
            throw ApiError.BadRequest("Токен не найден или уже удален");
        }
        return token;
    }

    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
    
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDB = await tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDB) {
            throw ApiError.UnauthorizedError();
        }
    
        const user = await User.findOne({ where: { id: userData.id } });
        const userDto = new UserDTO(user);  // Здесь создаем userDto, а не newUserDto
        const tokens = TokenService.generateToken({ id: userDto.id });
        await TokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto };
    }
    
    
    async getAllUsers(){
        const users = User.findAll();
        return users;
    }
}

module.exports = new UserService();
