const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { inviteNewEmployee, acceptInvite, getEmployees } = require('../controllers/employeeController');

const router = express.Router()

router.post('/create', authMiddleware, inviteNewEmployee)
router.post('/accept-invite', acceptInvite)
router.get('/',authMiddleware, getEmployees)

module.exports = router
