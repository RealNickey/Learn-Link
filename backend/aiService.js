require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

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

module.exports = { generateAIContent, processPdfContent };
