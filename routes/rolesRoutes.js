const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getRoles, createRole } = require('../controllers/roleController');

const router = express.Router();


router.get('/', authMiddleware, getRoles)
router.post('/', authMiddleware, createRole)

module.exports = router