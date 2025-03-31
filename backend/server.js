require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const multer = require("multer");
const {
  generateAIContent,
  processPdfContent,
  comparePdfs,
  generateQuiz,
  generateFlashcards,
  generatePdfChatResponse,
} = require("./aiService");
const setupVoiceChat = require("./voiceChat");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Initialize voice chat
const io = setupVoiceChat(server);

// Allow requests from all relevant origins
const allowedOrigins = [
  "http://localhost:5173", // Local development
  "https://learn-link-frontend.vercel.app",
  "https://learn-link.vercel.app",
  "https://learn-link-git-main-realnickeys.vercel.app",
];

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.includes("localhost")
      ) {
        callback(null, origin);
      } else {
        // If the origin is not in the allowed list, we don't send credentials
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

// Parse JSON bodies
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

// Health check endpoint for Socket.IO
app.get("/socket.io/", (req, res) => {
  res.send(
    "Socket.IO is available. Use WebSocket connection instead of HTTP polling."
  );
});

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

// Update AI content endpoint to handle both GET and POST
app.get("/generate-ai-content", async (req, res) => {
  const prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required",
      content: "Please provide a question or prompt for me to respond to.",
    });
  }

  try {
    console.log(`[AI Content] Generating response for prompt: "${prompt}"`);
    const content = await generateAIContent(prompt);
    console.log("[AI Content] Response generated successfully");
    res.json({ content });
  } catch (error) {
    console.error("[AI Content] Error generating content:", error);
    res.status(500).json({
      error: "Failed to generate content",
      details: error.message,
      content:
        "I encountered an error while processing your request. Please try again later.",
    });
  }
});

app.post("/generate-ai-content", async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required",
      content: "Please provide a question or prompt for me to respond to.",
    });
  }

  try {
    console.log(`[AI Content] Generating response for prompt: "${prompt}"`);
    const content = await generateAIContent(prompt);
    console.log("[AI Content] Response generated successfully");
    res.json({ content });
  } catch (error) {
    console.error("[AI Content] Error generating content:", error);
    res.status(500).json({
      error: "Failed to generate content",
      details: error.message,
      content:
        "I encountered an error while processing your request. Please try again later.",
    });
  }
});

// Add new endpoint for generating flashcards
app.post("/generate-flashcards", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const pdfBuffer = req.file.buffer;
    const flashcards = await generateFlashcards(pdfBuffer);

    res.json({ flashcards });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

// Add new endpoint for PDF-based chat
app.post("/pdf-chat", upload.array("pdfs", 3), async (req, res) => {
  try {
    console.log("[PDF Chat] Request received");

    if (!req.files || req.files.length === 0) {
      console.error("[PDF Chat] Error: No PDF files provided in request");
      return res.status(400).json({
        error: "No PDF files provided",
        content:
          "I couldn't find any PDF files in your request. Please try again with valid PDF files.",
      });
    }

    console.log(`[PDF Chat] Received ${req.files.length} files:`);
    req.files.forEach((file, i) => {
      console.log(
        `  ${i + 1}. ${file.originalname} (${Math.round(file.size / 1024)}KB)`
      );
    });

    const prompt = req.body.prompt;
    if (!prompt) {
      console.error("[PDF Chat] Error: No prompt provided in request");
      return res.status(400).json({
        error: "Prompt is required",
        content:
          "I need a question to answer based on your PDF files. Please include a prompt with your request.",
      });
    }

    console.log(`[PDF Chat] Prompt: "${prompt}"`);

    // Create structured PDF data objects with buffer and filename
    const pdfData = req.files.map((file) => ({
      buffer: file.buffer,
      filename: file.originalname,
    }));

    // Generate response based on PDFs and prompt
    console.log("[PDF Chat] Generating response...");
    const content = await generatePdfChatResponse(pdfData, prompt);
    console.log("[PDF Chat] Response generated successfully");

    res.json({ content });
  } catch (error) {
    console.error("[PDF Chat] Error generating response:", error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error.message,
      content:
        "I encountered an error while processing your request. Please try again later.",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// Start the server with confirmation for all environments
if (process.env.VERCEL) {
  // In Vercel environment we don't need to call listen
  console.log("Running on Vercel serverless environment");
} else {
  // For local development and other environments, start the HTTP server
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);

    console.log("Available routes:");
    console.log("- POST /generate-quiz");
    console.log("- POST /generate-summary");
    console.log("- POST /compare-pdfs");
    console.log("- GET /generate-ai-content");
    console.log("Voice chat enabled at /socket.io/");
  });
}

// Export the Express app and server for serverless functions
module.exports = server;
