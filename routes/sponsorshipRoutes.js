const express = require('express');
const { getSponsors, addNewSponsors } = require('../controllers/sponsorshipController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../helpers/fileUpload');
const router = express.Router()

router.get('/all',authMiddleware, getSponsors)
router.post('/add',authMiddleware,upload.single('sponsorLogo'), addNewSponsors)

module.exports = router
