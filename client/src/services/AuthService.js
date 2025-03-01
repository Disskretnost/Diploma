import $api from "../http";  // Подключаем axios экземпляр

export default class AuthService {
  // Авторизация
  static async login(email, password) {
    try {
      const response = await $api.post('/login', { email, password });

      if (response.status === 200 && response.data.accessToken) {
        return response.data; // Возвращаем только данные в случае успеха
      } else {
        throw new Error('Неверные данные для авторизации');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Произошла ошибка при авторизации. Попробуйте снова.');
    }
  }

  // Регистрация
  static async registration(phone, email, username, password) {
    try {
      const response = await $api.post('/registration', { phone, email, username, password });
      console.log(response.data);

      if (response.status === 200 ) {
        return response.data; // Возвращаем только данные в случае успеха
      } else {
        throw new Error('Ошибка при регистрации');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Произошла ошибка при регистрации. Попробуйте снова.');
    }
  }

  // Выход
  static async logout(refreshToken) {
    try {
      const response = await $api.post('/logout', { refreshToken });

      if (response.status === 200) {
        return true; // Просто возвращаем true, если статус 200
      } else {
        throw new Error('Ошибка при выходе');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Произошла ошибка при выходе');
    }
  }

  // Получение токенов
  static async refreshToken(refreshToken) {
    try {
      const response = await $api.post('/refresh', { refreshToken });

      if (response.status === 200 && response.data) {
        return response.data; // Возвращаем обновленные токены
      } else {
        throw new Error('Ошибка при обновлении токенов');
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Произошла ошибка при обновлении токенов');
    }
  }
}
