// const { PDFDocument } = require("pdf-lib");
// const prisma = require("../config/db");
// const { uploadFileToSupabase } = require("../services/supabaseStorage");

// //1 Marge PDFs
// const mergePDFs = async (req, res) => {
//   try {
//     if (!req.files || req.files.length < 2) {
//       return res
//         .status(400)
//         .json({ message: "Please upload at least 2 PDF files to merge." });
//     }

//     const mergedPdf = await PDFDocument.create();

//     for (const file of req.files) {
//       const pdf = await PDFDocument.load(file.buffer);
//       const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
//       copiedPages.forEach((page) => mergedPdf.addPage(page));
//     }

//     const mergedPdfBytes = await mergedPdf.save();
//     const fileName = `merged-${Date.now()}.pdf`;

//     // Upload to Supabase
//     const publicUrl = await uploadFileToSupabase(
//       fileName,
//       Buffer.from(mergedPdfBytes),
//       "application/pdf",
//     );

//     // Save to DB
//     await prisma.conversionHistory.create({
//       data: {
//         userId: req.user.id,
//         originalFileName: "Merged Document",
//         fileUrl: publicUrl,
//         status: "completed",
//         outputUrl: publicUrl,
//         outputFormat: "pdf",
//       },
//     });

//     res.json({ message: "PDFs merged successfully", outputUrl: publicUrl });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to merge PDFs. " });
//   }
// };

// // 2. JPG to PDF
// const jpgToPdf = async (req, res) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Please upload at least 1 image" });
//     }

//     const pdfDoc = await PDFDocument.create();

//     for (const file of req.files) {
//       let image;
//       if (file.mimetype === "image/jpeg")
//         image = await pdfDoc.embedJpg(file.buffer);
//       else if (file.mimetype === "image/png")
//         image = await pdfDoc.embedPng(file.buffer);
//       else throw new Error("Only JPG and PNG are supported.");

//       const page = pdfDoc.addPage([image.width, image.height]);
//       page.drawImage(image, {
//         x: 0,
//         y: 0,
//         width: image.width,
//         height: image.height,
//       });
//     }

//     const pdfBytes = await pdfDoc.save();
//     const fileName = `images-to-pdf-${Date.now()}.pdf`;
//     const publicUrl = await uploadFileToSupabase(
//       fileName,
//       Buffer.from(pdfBytes),
//       "application/pdf",
//     );

//     await prisma.conversionHistory.create({
//       data: {
//         userId: req.user.id,
//         originalFileName: "Images to PDF",
//         fileUrl: publicUrl,
//         status: "completed",
//         outputUrl: publicUrl,
//         outputFormat: "pdf",
//       },
//     });
//     res.json({ message: "Images converted to PDF", outputUrl: publicUrl });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = { mergePDFs, jpgToPdf };


const { PDFDocument } = require("pdf-lib");
const prisma = require("../config/db");
const { uploadFileToSupabase } = require("../services/supabaseStorage");

// 1. Merge PDFs
const mergePDFs = async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res
        .status(400)
        .json({ message: "Please upload at least 2 PDF files to merge." });
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdf = await PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const fileName = `merged-${Date.now()}.pdf`;

    const publicUrl = await uploadFileToSupabase(
      fileName,
      Buffer.from(mergedPdfBytes),
      "application/pdf"
    );

    await prisma.conversionHistory.create({
      data: {
        userId: req.user.id,
        originalFileName: "Merged Document",
        fileUrl: publicUrl,
        status: "completed",
        outputUrl: publicUrl,
        outputFormat: "pdf",
      },
    });

    res.json({ message: "PDFs merged successfully", outputUrl: publicUrl });
  } catch (error) {
    console.error(error);
    // 🚨 Return the actual error message to help debug
    res.status(500).json({ message: error.message || "Failed to merge PDFs." });
  }
};

// 2. JPG to PDF
const jpgToPdf = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Please upload at least 1 image" });
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of req.files) {
      let image;
      if (file.mimetype === "image/jpeg")
        image = await pdfDoc.embedJpg(file.buffer);
      else if (file.mimetype === "image/png")
        image = await pdfDoc.embedPng(file.buffer);
      else throw new Error("Only JPG and PNG are supported.");

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `images-to-pdf-${Date.now()}.pdf`;
    const publicUrl = await uploadFileToSupabase(
      fileName,
      Buffer.from(pdfBytes),
      "application/pdf"
    );

    await prisma.conversionHistory.create({
      data: {
        userId: req.user.id,
        originalFileName: "Images to PDF",
        fileUrl: publicUrl,
        status: "completed",
        outputUrl: publicUrl,
        outputFormat: "pdf",
      },
    });
    res.json({ message: "Images converted to PDF", outputUrl: publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 🚨 3. Split PDF (NEW)
const splitPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }
    
    const { startPage, endPage } = req.body;

    const pdfDoc = await PDFDocument.load(req.file.buffer);
    const totalPages = pdfDoc.getPageCount();
    const start = parseInt(startPage) - 1;
    const end = parseInt(endPage) - 1;

    if (start < 0 || end >= totalPages || start > end) {
      return res.status(400).json({ 
        message: `Invalid page range. This PDF has ${totalPages} pages.` 
      });
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(
      pdfDoc, 
      Array.from({ length: end - start + 1 }, (_, i) => start + i)
    );
    copiedPages.forEach((page) => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const fileName = `split-pdf-${Date.now()}.pdf`;
    const publicUrl = await uploadFileToSupabase(
      fileName, 
      Buffer.from(pdfBytes), 
      "application/pdf"
    );

    await prisma.conversionHistory.create({
      data: {
        userId: req.user.id,
        originalFileName: `Split: ${req.file.originalname}`,
        fileUrl: publicUrl,
        status: "completed",
        outputUrl: publicUrl,
        outputFormat: "pdf",
      },
    });

    res.json({ message: "PDF split successfully", outputUrl: publicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to split PDF." });
  }
};

module.exports = { mergePDFs, jpgToPdf, splitPDF };