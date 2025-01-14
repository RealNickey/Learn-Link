require("dotenv").config();
const express = require("express");
const { generateAIContent } = require("./aiService");
const app = express();
const port = 3000;

// ...existing code...

app.get("/generate-ai-content", async (req, res) => {
  const prompt = req.query.prompt || "Explain how AI works";
  try {
    const content = await generateAIContent(prompt);
    res.send(content);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// ...existing code...

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
