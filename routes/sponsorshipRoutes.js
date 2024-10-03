const express = require('express');
const { getSponsors } = require('../controllers/sponsorshipController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router()

router.get('/all',authMiddleware, getSponsors)
module.exports = router
