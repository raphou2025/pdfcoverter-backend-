// const express = require('express');
// const router = express.Router();
// const { mergePDFs, jpgToPdf } = require('../controllers/pdfToolsController');
// const { protect } = require('../middlewares/authMiddleware');
// const multer = require('multer');

// // Use Multer for multiple files
// const upload = multer({ storage: multer.memoryStorage() });

// router.post('/merge', protect, upload.array('files', 10), mergePDFs);
// router.post('/jpg-to-pdf', protect, upload.array('files', 10), jpgToPdf);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { mergePDFs, jpgToPdf, splitPDF } = require('../controllers/pdfToolsController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/merge', protect, upload.array('files', 10), mergePDFs);
router.post('/jpg-to-pdf', protect, upload.array('files', 10), jpgToPdf);
router.post('/split', protect, upload.single('file'), splitPDF); // 🚨 Added this

module.exports = router;