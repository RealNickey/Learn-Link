require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const multer = require("multer");
const firebase = require("./firebaseConfig");
const {
  generateAIContent,
  processPdfContent,
  comparePdfs,
  generateQuiz,
} = require("./aiService");
const setupVoiceChat = require("./voiceChat");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Initialize Firebase
firebase.initializeFirebase();

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

// Add Firebase connection status endpoint with detailed information
app.get("/firebase-status", (req, res) => {
  res.json(firebase.getConnectionStatus());
});

// Add Firebase data operation endpoints
app.post("/firebase/write", async (req, res) => {
  const { path, data } = req.body;

  if (!path || !data) {
    return res.status(400).json({ error: "Path and data are required" });
  }

  const result = await firebase.writeData(path, data);

  if (result.success) {
    res.status(200).json({ success: true, message: "Data written successfully" });
  } else {
    res.status(500).json({ error: result.error || "Failed to write data" });
  }
});

app.get("/firebase/read", async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Path parameter is required" });
  }

  const result = await firebase.readData(path);

  if (result.success) {
    res.status(200).json({ data: result.data });
  } else {
    res.status(500).json({ error: result.error || "Failed to read data" });
  }
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
    console.log("- GET /firebase-status");
    console.log("- POST /firebase/write");
    console.log("- GET /firebase/read");
    console.log("Voice chat enabled at /socket.io/");

    if (firebase.isConnected()) {
      console.log("Firebase Realtime Database: Connected ✅");
    } else {
      console.log("Firebase Realtime Database: Not connected ❌");
    }
  });
}

// Export the Express app and server for serverless functions
module.exports = server;
