const express = require('express');
const { registerClub, login, getProfile, resetPassword} = require('../controllers/authController')
const auth = require('../middlewares/authMiddleware')
const router = express.Router();

router.post('/register', registerClub)
router.post('/login', login)
router.get('/me',auth, getProfile)
router.post('/reset-password',resetPassword)


module.exports = router