const prisma = require('../config/db');
const path = require('path');
const { extractTextFromImage } = require('../services/tesseractService');
const { extractTextFromPDF } = require('../services/pdfService');
const { uploadFileToSupabase } = require('../services/supabaseStorage');

const convertFile = async (req, res) => {
  let history;

  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const file = req.file;
    const fileName = `${Date.now()}-${path.basename(file.originalname)}`;

    const publicUrl = await uploadFileToSupabase(fileName, file.buffer, file.mimetype);

    history = await prisma.conversionHistory.create({
      data: {
        userId: req.user.id,
        originalFileName: file.originalname,
        fileUrl: publicUrl,
        status: 'processing'
      }
    });

    let extractedText;
    if (file.mimetype === 'application/pdf') {
      extractedText = await extractTextFromPDF(file.buffer);
    } else if (file.mimetype.startsWith('image/')) {
      extractedText = await extractTextFromImage(file.buffer);
    } else {
      throw new Error('Only PDF and image files can be converted to text');
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be found in this file');
    }

    const outputFileName = `${Date.now()}-${path.parse(file.originalname).name}.txt`;
    const outputUrl = await uploadFileToSupabase(
      outputFileName,
      Buffer.from(extractedText, 'utf8'),
      'text/plain; charset=utf-8'
    );

    await prisma.conversionHistory.update({
      where: { id: history.id },
      data: { status: 'completed', outputUrl, outputFormat: 'txt' }
    });

    res.json({
      message: 'Text extracted successfully',
      extractedText,
      outputUrl
    });

  } catch (error) {
    console.error(error);
    if (history) {
      try {
        await prisma.conversionHistory.update({
          where: { id: history.id },
          data: { status: 'failed' }
        });
      } catch (updateError) {
        console.error('Failed to mark conversion as failed:', updateError);
      }
    }
    res.status(500).json({ message: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await prisma.conversionHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

module.exports = { convertFile, getHistory };