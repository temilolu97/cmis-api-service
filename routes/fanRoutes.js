const express = require('express');
const { registerFans, getAllFansByClubId } = require('../controllers/fansController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', registerFans)
router.get('/all', authMiddleware, getAllFansByClubId)
module.exports = router