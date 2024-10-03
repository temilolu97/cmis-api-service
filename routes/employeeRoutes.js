const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { inviteNewEmployee, acceptInvite } = require('../controllers/employeeController');

const router = express.Router()

router.post('/create', authMiddleware, inviteNewEmployee)
router.post('/accept-invite', acceptInvite)

module.exports = router
