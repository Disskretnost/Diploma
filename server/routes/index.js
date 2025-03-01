const { Router } = require('express');

const userController = require('./../controllers/userController');
const authmiddleware = require('../midllewares/authMiddlewares');

const router = Router();


router.post('/registration', userController.registration);

router.post('/login', userController.login);

router.post('/logout', userController.logout);

router.post('/refresh', userController.refresh);

router.get('/users', authmiddleware, userController.getUsers);

module.exports = router;  
