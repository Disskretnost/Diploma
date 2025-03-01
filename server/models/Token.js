const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');  // Импортируем модель User

const Token = sequelize.define('token', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  refresh: { type: DataTypes.STRING, allowNull: false },  // Хранит refresh токен
  userId: {  
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',  // Ссылается на таблицу пользователей
      key: 'id'
    },
    onDelete: 'CASCADE'  // Если пользователь удаляется, то и токен удаляется
  }
}, { timestamps: true });

// Связь: Один пользователь может иметь только один токен
User.hasOne(Token, { foreignKey: 'userId' });
Token.belongsTo(User, { foreignKey: 'userId' });

module.exports = Token;
