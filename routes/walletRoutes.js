const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { createWallet, getClubWallet, getFinancialRecords } = require('../controllers/walletController');

const router = express.Router();

router.post("/create", authMiddleware, createWallet)
router.get("/get", authMiddleware, getClubWallet)
router.get("/records", authMiddleware, getFinancialRecords)


module.exports = router