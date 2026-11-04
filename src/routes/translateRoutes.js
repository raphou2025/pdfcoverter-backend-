const express = require('express');
const router = express.Router();
const { translateText } = require('../controllers/translateController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, translateText);

module.exports = router;