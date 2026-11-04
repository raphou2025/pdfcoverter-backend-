const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserSettings,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const uploadAvatar = require('../middlewares/avatarUpload');

router.get('/profile', protect, getUserProfile);
router.put('/settings', protect, updateUserSettings);
router.post('/profile-picture', protect, uploadAvatar, uploadProfilePicture);
router.delete('/profile-picture', protect, removeProfilePicture);
router.put('/password', protect, changePassword);

module.exports = router;