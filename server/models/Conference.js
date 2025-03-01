const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');  // Импортируем модель User

const Conference = sequelize.define('conference', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  date: { type: DataTypes.DATE, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  userId: {  
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',  // Ссылаемся на таблицу пользователей
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, { timestamps: true });

// Связь: Один пользователь может иметь много конференций
User.hasMany(Conference, { foreignKey: 'userId' });
Conference.belongsTo(User, { foreignKey: 'userId' });

module.exports = Conference;
