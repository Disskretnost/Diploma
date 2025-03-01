// user-dto.js
class UserDTO {
    id;
    phone;
    email;
    username;

    constructor(user) {
        this.id = user.id; // Здесь используем правильное поле 'id' из объекта User
        this.phone = user.phone;
        this.email = user.email;
        this.username = user.username;
    }
}

module.exports = UserDTO;
