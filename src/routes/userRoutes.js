const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  exportUserData,
  updateUserSettings,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword,
  deleteOwnAccount
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const uploadAvatar = require('../middlewares/avatarUpload');

router.get('/profile', protect, getUserProfile);
router.get('/export', protect, exportUserData);
router.put('/settings', protect, updateUserSettings);
router.post('/profile-picture', protect, uploadAvatar, uploadProfilePicture);
router.delete('/profile-picture', protect, removeProfilePicture);
router.put('/password', protect, changePassword);
router.delete('/account', protect, deleteOwnAccount);

module.exports = router;