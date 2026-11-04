const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { uploadProfilePictureToSupabase } = require('../services/supabaseStorage');

const profileFields = { id: true, email: true, name: true, avatarUrl: true, role: true, preferredLanguage: true };

// @desc Get user profile
const getUserProfile = async (req, res) => {
  res.json(req.user);
};

// @desc Update user settings
const updateUserSettings = async (req, res) => {
  const { name, preferredLanguage } = req.body || {};
  const data = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
      return res.status(400).json({ message: 'Name must be between 1 and 80 characters' });
    }
    data.name = name.trim();
  }

  if (preferredLanguage !== undefined) {
    if (!['en', 'km'].includes(preferredLanguage)) {
      return res.status(400).json({ message: 'Preferred language must be English or Khmer' });
    }
    data.preferredLanguage = preferredLanguage;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'At least one valid setting is required' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: profileFields
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

const uploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Choose a profile picture to upload' });
  }

  const { buffer, mimetype } = req.file;
  const validSignature = (
    (mimetype === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) ||
    (mimetype === 'image/png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (mimetype === 'image/webp' &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP')
  );
  if (!validSignature) {
    return res.status(400).json({ message: 'The uploaded file is not a valid JPG, PNG, or WebP image' });
  }

  try {
    const avatarUrl = await uploadProfilePictureToSupabase(req.user.id, buffer, mimetype);
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl },
      select: profileFields
    });
    return res.json(updatedUser);
  } catch (error) {
    console.error('Profile picture upload failed:', error);
    return res.status(500).json({ message: 'Failed to upload profile picture' });
  }
};

const removeProfilePicture = async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      select: profileFields
    });
    return res.json(updatedUser);
  } catch (error) {
    console.error('Failed to remove profile picture:', error);
    return res.status(500).json({ message: 'Failed to remove profile picture' });
  }
};

// @desc Change the authenticated user's password
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};

  if (typeof oldPassword !== 'string' || !oldPassword || typeof newPassword !== 'string' || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from the current password' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change failed:', error);
    return res.status(500).json({ message: 'Failed to update password' });
  }
};

module.exports = {
  getUserProfile,
  updateUserSettings,
  uploadProfilePicture,
  removeProfilePicture,
  changePassword
};