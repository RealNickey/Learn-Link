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
} = require("./aiService");
const setupVoiceChat = require("./voiceChat");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

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

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4();
    // Save the original filename and the unique id
    const fileName = `${fileId}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit per file
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

    // Get the file details
    const file = req.file;
    const fileId = file.filename.split("-")[0]; // Extract the UUID
    const originalName = path.basename(file.originalname);
    const fileSize = file.size;
    const filePath = file.path;

    // File metadata to broadcast
    const fileData = {
      id: fileId,
      name: originalName,
      size: fileSize,
      path: filePath,
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };

    // Broadcast to all connected clients
    io.emit("fileShared", fileData);

    console.log(`[File Sync] File uploaded and broadcast: ${originalName}`);

    res.json({
      message: "File uploaded successfully",
      file: fileData,
    });
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

// File download endpoint
app.get("/download-file/:fileId", (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Find files matching the ID pattern in the uploads directory
    const files = fs.readdirSync(uploadDir);
    const targetFile = files.find((file) => file.startsWith(fileId));

    if (!targetFile) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadDir, targetFile);
    const originalName = targetFile.substring(targetFile.indexOf("-") + 1);

    // Set headers for file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalName}"`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ error: "Failed to download file" });
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
