const express = require('express');
const {  getAllPlayers, addNewPlayer, getPlayerDetails, generateNewFanRegistrationLink, getFanRegistrationLink } = require('../controllers/teamController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../helpers/fileUpload');
const { getEmployees } = require('../controllers/employeeController');

const router = express.Router();


router.get('/employees', getEmployees)
router.get('/players',authMiddleware, getAllPlayers)
router.get('/players/:id',authMiddleware, getPlayerDetails)
router.post('/players/add', authMiddleware, upload.single('image'), addNewPlayer)
router.get('/registration-link', authMiddleware, getFanRegistrationLink)

module.exports = router;
