const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('users', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  status: { type: DataTypes.ENUM('active', 'inactive', 'banned'), defaultValue: 'active' }
}, { timestamps: true });

module.exports = User;


