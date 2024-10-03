const express = require('express');
const { receiveBudpayHook } = require('../controllers/webhookController');
const router = express.Router();

router.post('/budpay/callback', receiveBudpayHook)

module.exports = router