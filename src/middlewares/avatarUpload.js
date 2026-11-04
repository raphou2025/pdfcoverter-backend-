const multer = require('multer');

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Profile pictures must be JPG, PNG, or WebP images'));
    }
  }
}).single('avatar');

module.exports = (req, res, next) => {
  uploadAvatar(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Profile pictures must be 5 MB or smaller' });
    }
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    return next();
  });
};
