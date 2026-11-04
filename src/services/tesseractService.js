const Tesseract = require('tesseract.js');

const OCR_LANGUAGES = 'eng+khm';

const extractTextFromImage = async (fileBuffer) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      fileBuffer,
      OCR_LANGUAGES,
      {
        logger: m => console.log(m)
      }
    );
    
    return text;
  } catch (error) {
    console.error("OCR Error:", error.message);
    throw new Error('Failed to extract text from image');
  }
};

module.exports = { extractTextFromImage };