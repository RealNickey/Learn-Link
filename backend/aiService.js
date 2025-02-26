require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateAIContent(prompt) {
    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = { generateAIContent };
