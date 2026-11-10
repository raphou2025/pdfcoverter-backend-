const { PDFParse } = require('pdf-parse');

const extractTextFromPDF = async (fileBuffer) => {
  const parser = new PDFParse({ data: fileBuffer });

  try {
    const data = await parser.getText();
    return data.text;
  } catch (error) {
    console.error("PDF Parsing Error:", error.message);
    throw new Error('Failed to extract text from PDF');
  } finally {
    await parser.destroy();
  }
};

module.exports = { extractTextFromPDF };

