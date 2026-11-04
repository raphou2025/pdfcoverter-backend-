const prisma = require('../config/db');
const { translateTextAPI } = require('../services/googleTranslate');

const translateText = async (req, res) => {
  const { text, sourceLang, targetLang } = req.body || {};
  const supportedLanguages = ['en', 'km'];

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'Enter text to translate' });
  }

  if (text.length > 5000) {
    return res.status(400).json({ message: 'Text must be 5000 characters or fewer' });
  }

  if (
    !supportedLanguages.includes(sourceLang) ||
    !supportedLanguages.includes(targetLang) ||
    sourceLang === targetLang
  ) {
    return res.status(400).json({ message: 'Select two different supported languages' });
  }

  try {
    const translatedText = await translateTextAPI(text.trim(), sourceLang, targetLang);

    await prisma.translationHistory.create({
      data: {
        userId: req.user.id,
        sourceText: text.trim(),
        translatedText,
        sourceLang,
        targetLang
      }
    });

    res.json({ translatedText });
  } catch (error) {
    console.error('Translation failed:', error);
    res.status(500).json({ message: 'Failed to translate text' });
  }
};

module.exports = { translateText };