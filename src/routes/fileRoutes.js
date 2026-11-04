const express = require('express');
const router = express.Router();
const { convertFile, getHistory } = require('../controllers/fileController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/convert', protect, upload.single('file'), convertFile);
router.get('/history', protect, getHistory);

module.exports = router;