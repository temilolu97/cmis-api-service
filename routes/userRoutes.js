const express = require('express');
const {getUsersForTeam} = require('../controllers/teamController');
const { getUserDetails } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();
router.get('/me',authMiddleware, getUserDetails)
module.exports = router;