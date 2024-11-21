const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../helpers/fileUpload');
const { createNewEvent, getAllEvents, getEventDetails, eventRegistration, completeEventRegistration, getEventRegistrants } = require('../controllers/eventsController');

router.post('/create', authMiddleware, upload.fields([
    { name: 'homeTeamLogo', maxCount: 1 },
    { name: 'awayTeamLogo', maxCount: 1 } 
]), createNewEvent)
router.get('/', authMiddleware, getAllEvents)
router.get('/:eventId/details', getEventDetails)
router.post('/register', eventRegistration)
router.post('/register/complete', completeEventRegistration)
router.get('/:eventId/registrants', getEventRegistrants)


module.exports = router