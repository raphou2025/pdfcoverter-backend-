const express = require('express');
const { getDashboardStats, getMonitoringStats, getUsers } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/stats', protect, requireAdmin, getDashboardStats);
router.get('/monitoring', protect, requireAdmin, getMonitoringStats);
router.get('/users', protect, requireAdmin, getUsers);

module.exports = router;
