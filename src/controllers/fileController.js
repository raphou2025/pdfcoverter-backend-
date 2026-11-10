// const prisma = require('../config/db');
// const path = require('path');
// const { extractTextFromImage } = require('../services/tesseractService');
// const { extractTextFromPDF } = require('../services/pdfService');
// const { uploadFileToSupabase } = require('../services/supabaseStorage');

// const convertFile = async (req, res) => {
//   let history;

//   try {
//     if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

//     const file = req.file;
//     const fileName = `${Date.now()}-${path.basename(file.originalname)}`;

//     const publicUrl = await uploadFileToSupabase(fileName, file.buffer, file.mimetype);

//     history = await prisma.conversionHistory.create({
//       data: {
//         userId: req.user.id,
//         originalFileName: file.originalname,
//         fileUrl: publicUrl,
//         status: 'processing'
//       }
//     });

//     let extractedText;
//     if (file.mimetype === 'application/pdf') {
//       extractedText = await extractTextFromPDF(file.buffer);
//     } else if (file.mimetype.startsWith('image/')) {
//       extractedText = await extractTextFromImage(file.buffer);
//     } else {
//       throw new Error('Only PDF and image files can be converted to text');
//     }

//     if (!extractedText.trim()) {
//       throw new Error('No text could be found in this file');
//     }

//     const outputFileName = `${Date.now()}-${path.parse(file.originalname).name}.txt`;
//     const outputUrl = await uploadFileToSupabase(
//       outputFileName,
//       Buffer.from(extractedText, 'utf8'),
//       'text/plain; charset=utf-8'
//     );

//     await prisma.conversionHistory.update({
//       where: { id: history.id },
//       data: { status: 'completed', outputUrl, outputFormat: 'txt' }
//     });

//     res.json({
//       message: 'Text extracted successfully',
//       extractedText,
//       outputUrl
//     });

//   } catch (error) {
//     console.error(error);
//     if (history) {
//       try {
//         await prisma.conversionHistory.update({
//           where: { id: history.id },
//           data: { status: 'failed' }
//         });
//       } catch (updateError) {
//         console.error('Failed to mark conversion as failed:', updateError);
//       }
//     }
//     res.status(500).json({ message: error.message });
//   }
// };

// const getHistory = async (req, res) => {
//   try {
//     const history = await prisma.conversionHistory.findMany({
//       where: { userId: req.user.id },
//       orderBy: { createdAt: 'desc' }
//     });
//     res.json(history);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch history' });
//   }
// };

// module.exports = { convertFile, getHistory };

const prisma = require('../config/db');
const path = require('path');
const axios = require('axios'); // 🚨 Added Axios to download URL images
const { extractTextFromImage } = require('../services/tesseractService');
const { extractTextFromPDF } = require('../services/pdfService');
const { uploadFileToSupabase } = require('../services/supabaseStorage');

const convertFile = async (req, res) => {
  let history;

  try {
    let fileBuffer;
    let mimetype;
    let originalName;

    // 🚨 1. Check if the user provided a File OR an Image URL
    if (req.file) {
      fileBuffer = req.file.buffer;
      mimetype = req.file.mimetype;
      originalName = req.file.originalname;
    } else if (req.body.imageUrl) {
      const imageUrl = req.body.imageUrl;
      
      // Download the image from the URL into memory
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fileBuffer = Buffer.from(response.data, 'binary');
      
      // Determine the file type from headers (fallback to jpeg)
      mimetype = response.headers['content-type'] || 'image/jpeg';
      originalName = `url-image-${Date.now()}.jpg`;
    } else {
      return res.status(400).json({ message: 'Please upload a file or provide an image URL' });
    }

    // 2. Upload the original file (or downloaded image) to Supabase
    const fileName = `${Date.now()}-${path.basename(originalName)}`;
    const publicUrl = await uploadFileToSupabase(fileName, fileBuffer, mimetype);

    // 3. Create Database Record
    history = await prisma.conversionHistory.create({
      data: {
        userId: req.user.id,
        originalFileName: originalName,
        fileUrl: publicUrl,
        status: 'processing'
      }
    });

    // 4. Extract Text based on file type
    let extractedText;
    if (mimetype === 'application/pdf') {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (mimetype.startsWith('image/')) {
      extractedText = await extractTextFromImage(fileBuffer);
    } else {
      throw new Error('Only PDF and image files can be converted to text');
    }

    if (!extractedText.trim()) {
      throw new Error('No text could be found in this file or image');
    }

    // 5. Save the extracted text as a .txt file in Supabase
    const outputFileName = `${Date.now()}-${path.parse(originalName).name}.txt`;
    const outputUrl = await uploadFileToSupabase(
      outputFileName,
      Buffer.from(extractedText, 'utf8'),
      'text/plain; charset=utf-8'
    );

    // 6. Update Database to completed
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

// const prisma = require('../config/db');
// const path = require('path');
// const axios = require('axios');
// const pdfParse = require('pdf-parse');
// const { extractTextFromImage } = require('../services/tesseractService');
// const { extractTextFromPDF } = require('../services/pdfService');
// const { uploadFileToSupabase } = require('../services/supabaseStorage');

// const convertFile = async (req, res) => {
//   let history;

//   try {
//     let fileBuffer;
//     let mimetype;
//     let originalName;

//     if (req.file) {
//       fileBuffer = req.file.buffer;
//       mimetype = req.file.mimetype;
//       originalName = req.file.originalname;
//     } else if (req.body.imageUrl) {
//       const imageUrl = req.body.imageUrl;
//       const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//       fileBuffer = Buffer.from(response.data, 'binary');
//       mimetype = response.headers['content-type'] || 'image/jpeg';
//       originalName = `url-image-${Date.now()}.jpg`;
//     } else {
//       return res.status(400).json({ message: 'Please upload a file or provide an image URL' });
//     }

//     if (mimetype === 'application/pdf') {
//       try {
//         const pdfData = await pdfParse(fileBuffer);
//         if (pdfData.numpages > 20) {
//           return res.status(400).json({ message: `This PDF has ${pdfData.numpages} pages. Limit is 20 pages.` });
//         }
//       } catch (err) {
//         return res.status(400).json({ message: 'Could not read PDF. The file may be corrupted.' });
//       }
//     }

//     const fileName = `${Date.now()}-${path.basename(originalName)}`;
//     const publicUrl = await uploadFileToSupabase(fileName, fileBuffer, mimetype);

//     history = await prisma.conversionHistory.create({
//       data: {
//         userId: req.user.id,
//         originalFileName: originalName,
//         fileUrl: publicUrl,
//         status: 'processing'
//       }
//     });

//     let extractedText;
//     if (mimetype === 'application/pdf') {
//       extractedText = await extractTextFromPDF(fileBuffer);
//     } else if (mimetype.startsWith('image/')) {
//       extractedText = await extractTextFromImage(fileBuffer);
//     } else {
//       throw new Error('Only PDF and image files can be converted to text');
//     }

//     // 🚨 NEW: Check for unreadable/garbage text (like the Khmer PDF issue)
//     const lettersOnly = extractedText.replace(/[^a-zA-Z\u1780-\u17FF]/g, '');
    
//     if (!extractedText.trim() || lettersOnly.length < 10) {
//       throw new Error('No readable text found. The file might be a scanned image. Please try an image file instead.');
//     }

//     const outputFileName = `${Date.now()}-${path.parse(originalName).name}.txt`;
//     const outputUrl = await uploadFileToSupabase(
//       outputFileName,
//       Buffer.from(extractedText, 'utf8'),
//       'text/plain; charset=utf-8'
//     );

//     await prisma.conversionHistory.update({
//       where: { id: history.id },
//       data: { status: 'completed', outputUrl, outputFormat: 'txt' }
//     });

//     res.json({
//       message: 'Text extracted successfully',
//       extractedText,
//       outputUrl
//     });

//   } catch (error) {
//     console.error(error);
//     if (history) {
//       try {
//         await prisma.conversionHistory.update({
//           where: { id: history.id },
//           data: { status: 'failed' }
//         });
//       } catch (updateError) {
//         console.error('Failed to mark conversion as failed:', updateError);
//       }
//     }
//     res.status(500).json({ message: error.message });
//   }
// };

// const getHistory = async (req, res) => {
//   try {
//     const history = await prisma.conversionHistory.findMany({
//       where: { userId: req.user.id },
//       orderBy: { createdAt: 'desc' }
//     });
//     res.json(history);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch history' });
//   }
// };

// module.exports = { convertFile, getHistory };