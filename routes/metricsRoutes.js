const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getSummary, getLatestTransactions, getLatestFanRegistrations, getUpcomingEvents, getTransactionsGraphData, getAllTransactions, getFinancialSourcesSummary } = require('../controllers/metricsController');
const router = express.Router()

router.get('/get', authMiddleware, getSummary)
router.get('/transactions', authMiddleware, getAllTransactions)
router.get('/transactions/latest/get', authMiddleware, getLatestTransactions)
router.get('/fans/latest/get', authMiddleware, getLatestFanRegistrations)
router.get('/events/upcoming/get', authMiddleware, getUpcomingEvents)
router.get('/graph', authMiddleware, getTransactionsGraphData)
router.get('/financial-sources/summary', authMiddleware, getFinancialSourcesSummary)


module.exports = router