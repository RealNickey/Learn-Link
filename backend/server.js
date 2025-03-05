require("dotenv").config();
const express = require("express");
const cors = require("cors");

const http = require("http");
const multer = require('multer');
const { generateAIContent, processPdfContent, comparePdfs, generateQuiz } = require("./aiService");
const setupVoiceChat = require('./voiceChat');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Initialize voice chat
const io = setupVoiceChat(server);

// Middleware
app.use(
  cors({
    // Allow requests from specific origins when deployed
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://learn-link-frontend.vercel.app",
            "https://learn-link.vercel.app",
            "https://learn-link-git-main-realnickeys.vercel.app",
          ]
        : "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 3, // Maximum 3 files
  },
});

// Add OPTIONS handling for preflight requests
app.options("*", cors());

// Move quiz route to the top of routes
app.post("/generate-quiz", (req, res) => {
  upload.array("pdfs", 3)(req, res, async function (err) {
    if (err) {
      console.error("[Quiz Route] Upload error:", err);
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.files || req.files.length === 0) {
        throw new Error("No PDF files provided");
      }

      console.log(
        "[Quiz Route] Received files:",
        req.files.map((f) => f.originalname).join(", ")
      );

      // Create structured PDF data objects with buffer and filename
      const pdfData = req.files.map((file) => ({
        buffer: file.buffer,
        filename: file.originalname,
      }));

      console.log(
        "[Quiz Route] Created PDF data objects:",
        pdfData.map((p) => p.filename).join(", ")
      );

      // Generate quiz with proper file data
      const quiz = await generateQuiz(pdfData);

      console.log(
        "[Quiz Route] Quiz generated successfully with",
        quiz.questions.length,
        "questions"
      );

      return res.status(200).json({ quiz });
    } catch (error) {
      console.error("[Quiz Route] Error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate quiz",
      });
    }
  });
});

// Routes
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    res.json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading PDF:", error);
    res.status(500).json({ error: "Failed to upload PDF" });
  }
});

app.post("/generate-summary", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const pdfBuffer = req.file.buffer;
    const summary = await processPdfContent(pdfBuffer);

    res.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// Add new endpoint for PDF comparison
app.post(
  "/compare-pdfs",
  upload.fields([
    { name: "pdf1", maxCount: 1 },
    { name: "pdf2", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files["pdf1"] || !req.files["pdf2"]) {
        return res.status(400).json({ error: "Two PDF files are required" });
      }

      const pdf1Buffer = req.files["pdf1"][0].buffer;
      const pdf2Buffer = req.files["pdf2"][0].buffer;

      const comparison = await comparePdfs(pdf1Buffer, pdf2Buffer);
      res.json({ comparison });
    } catch (error) {
      console.error("Error comparing PDFs:", error);
      res.status(500).json({ error: "Failed to compare PDFs" });
    }
  }
);

app.get("/generate-ai-content", async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const content = await generateAIContent(prompt);
    res.json({ content });
  } catch (error) {
    console.error("Error generating content:", error);
    res
      .status(500)
      .json({ error: "Failed to generate content: " + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ error: "Something broke!" });
});


// Check if we're in a Vercel serverless environment
if (process.env.NODE_ENV !== "production") {
  // Start the server with confirmation when not in production (local development)
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

    console.log('Available routes:');
    console.log('- POST /generate-quiz');
    console.log('- POST /generate-summary');
    console.log('- POST /compare-pdfs');
    console.log('- GET /generate-ai-content');
    console.log('Voice chat enabled');

  });
}

// Export the Express app for serverless functions
module.exports = app;
