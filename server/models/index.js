const User = require('./User');  // Импортируем модель User
const Conference = require('./Conference');  // Импортируем модель Conference
const Token = require('./Token');  // Импортируем модель Token

// Экспортируем все модели для использования в других частях приложения
module.exports = {
  User,
  Conference,
  Token
};
