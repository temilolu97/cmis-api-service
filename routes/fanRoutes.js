const express = require('express');
const { registerFans, getAllFansByClubId, generateRegistrationLink, createFanCategories, getFanCategories, updateFanCategory, getCategoriesForFans, completeFanRegistration, deleteCategory } = require('../controllers/fansController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', registerFans)
router.get('/all', authMiddleware, getAllFansByClubId)
router.get('/link/generate',authMiddleware, generateRegistrationLink)
router.post('/categories',authMiddleware, createFanCategories)
router.get('/categories',authMiddleware, getFanCategories)
router.get('/categories/get', getCategoriesForFans)
router.delete('/categories/:categoryId', authMiddleware, deleteCategory)
router.put("/category/update/:id", authMiddleware, updateFanCategory)
router.post("/register/complete", completeFanRegistration)
module.exports = router