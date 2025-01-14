const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// Define user-related routes here
router.get('/', usersController.getAllUsers);
router.post('/', usersController.createUser);

module.exports = router;
