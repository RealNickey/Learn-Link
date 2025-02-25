require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require('fs').promises;

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

async function generateAIContent(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw error;
  }
}

async function processPdfContent(pdfBuffer, prompt = 'Summarize this document') {
  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: "application/pdf",
        }
      },
      prompt
    ]);
    return result.response.text();
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error;
  }
}

async function localPdfToPart(buffer, displayName) {
  const tempPath = `/tmp/${displayName}-${Date.now()}.pdf`;
  try {
    await fs.writeFile(tempPath, buffer);
  } catch (error) {
    console.error('Error writing temporary PDF file:', error);
    throw error;
  }
  try {
    const uploadResult = await fileManager.uploadFile(
      tempPath,
      {
        mimeType: "application/pdf",
        displayName,
      },
    );

    return {
      fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
      },
    };
  } finally {
    // Cleanup temp file
    await fs.unlink(tempPath).catch(console.error);
  }
}

async function comparePdfs(pdf1Buffer, pdf2Buffer) {
  try {
    const result = await model.generateContent([
      await localPdfToPart(pdf1Buffer, 'PDF 1'),
      await localPdfToPart(pdf2Buffer, 'PDF 2'),
      'What are some important topics in these documents?,generate a focus area for exams as points',
    ]);
    return result.response.text();
  } catch (error) {
    console.error('Error comparing PDFs:', error);
    throw error;
  }
}

async function generateQuiz(pdfBuffers) {
  try {
    const prompt = `Based on the content of all provided documents, generate 5 multiple choice questions. Return in this JSON format:
    {
      "questions": [
        {
          "question": "What is...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0
        }
      ]
    }`;

    // Use Promise.all to process all PDFs in parallel
    const pdfParts = await Promise.all(
      pdfBuffers.map(async (buffer, index) => ({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: "application/pdf"
        }
      }))
    );

    // Log for debugging
    console.log(`Processing ${pdfParts.length} PDFs`);

    const result = await model.generateContent([...pdfParts, prompt]);
    const response = result.response.text();
    
    // Clean and parse the response
    const jsonStr = response.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid quiz format returned from AI');
    }

    console.log('Quiz generated successfully:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error in generateQuiz:', error);
    throw error;
  }
}

module.exports = {
  generateAIContent,
  processPdfContent,
  comparePdfs,
  generateQuiz
};
