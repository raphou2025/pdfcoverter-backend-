// const express = require('express');
// const { getDashboardStats, getMonitoringStats, getUsers } = require('../controllers/adminController');
// const { protect, requireAdmin } = require('../middlewares/authMiddleware');

// const router = express.Router();

// router.get('/stats', protect, requireAdmin, getDashboardStats);
// router.get('/monitoring', protect, requireAdmin, getMonitoringStats);
// router.get('/users', protect, requireAdmin, getUsers);

// module.exports = router;

const express = require('express');
const { 
  getDashboardStats, 
  getMonitoringStats, 
  getUsers, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/stats', protect, requireAdmin, getDashboardStats);
router.get('/monitoring', protect, requireAdmin, getMonitoringStats);
router.get('/users', protect, requireAdmin, getUsers);

// 🚨 New secure routes
router.put('/users/:id/role', protect, requireAdmin, updateUserRole);
router.delete('/users/:id', protect, requireAdmin, deleteUser);

module.exports = router;