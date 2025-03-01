require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const {
  generateAIContent,
  processPdfContent,
  comparePdfs,
} = require("./aiService");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: "http://localhost:5173",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Configure multer
const storage = multer.memoryStorage();
// Configure multer for memory storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Add generateQuiz function definition
function generateQuiz(pdfs) {
  // Dummy implementation: generate quiz from pdf files.
  // Replace with your actual quiz generation logic.
  const questions = pdfs.map((file, index) => ({
    question: `Question ${index + 1} for file ${file.originalname}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: "Option A",
  }));
  return { questions };
}

// Quiz route
app.post("/generate-quiz", upload.array("pdfs"), (req, res) => {
  console.log("[Quiz] Request received");
  console.log("[Quiz] Files:", req.files.length);
  try {
    const quiz = generateQuiz(req.files);
    console.log("Quiz generated:", quiz);
    res.json({ quiz });
  } catch (error) {
    console.error("[Quiz] Error:", error);
    res.status(500).send(error.message);
  }
});

// Other routes
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

// Error handlers must be last
app.use((err, req, res, next) => {
  console.error("[Error]", err);
  res.status(500).json({ error: err.message });
});

app.use((req, res) => {
  console.log(`[404] Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log("\nAvailable routes:");
  console.log("POST /generate-quiz");
  console.log("POST /upload-pdf");
  console.log("POST /generate-summary");
  console.log("POST /compare-pdfs");
  console.log("GET /generate-ai-content");

  // Test if routes are registered
  console.log("\nRegistered routes:");
  app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
      console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
    }
  });
});
