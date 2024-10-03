const express = require('express');
const { registerClub, login, getProfile} = require('../controllers/authController')
const auth = require('../middlewares/authMiddleware')
const router = express.Router();

router.post('/register', registerClub)
router.post('/login', login)
router.get('/me',auth, getProfile)


module.exports = router