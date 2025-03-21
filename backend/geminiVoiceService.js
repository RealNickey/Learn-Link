require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const WebSocket = require("ws");
const pdfParse = require("pdf-parse");

// Initialize Gemini with API key
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_WS_URL =
  "wss://generativelanguage.googleapis.com/v1alpha/models/gemini-2.0-flash-exp:streamGenerateContent?alt=websocket";

// Set up Gemini Live service
class GeminiVoiceService {
  constructor(io) {
    this.io = io;
    this.activeSessions = new Map(); // Store active voice sessions by user ID
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("New client connected to Gemini Voice Service:", socket.id);

      // Initialize Gemini Live connection when user starts the voice chat
      socket.on("start_gemini_voice", async (userData) => {
        try {
          console.log(
            "Start Gemini voice request from:",
            userData?.name || socket.id
          );

          // Store user context and enable voice mode
          socket.geminiContext = {
            userId: userData?.sub || socket.id,
            userName: userData?.name || "User",
            isActive: true,
            documentContext: userData?.documentContext || "",
            pdfContents: [], // Store extracted PDF content
            conversationHistory: [], // Track conversation history
            geminiWsConnection: null,
            sessionActive: false,
          };

          // Process any previously uploaded documents
          if (userData?.selectedFiles && userData.selectedFiles.length > 0) {
            await this.processPdfFiles(socket, userData.selectedFiles);
          }

          // Inform client that Gemini voice is ready
          socket.emit("gemini_voice_ready", { status: "ready" });

          console.log(
            `Gemini voice service activated for ${socket.geminiContext.userName}`
          );
        } catch (error) {
          console.error("Error initializing Gemini voice service:", error);
          socket.emit("gemini_voice_error", {
            error: "Failed to initialize Gemini voice service",
          });
        }
      });

      // Process voice data from client and send to Gemini Live API
      socket.on("voice_data", async (data) => {
        try {
          if (!socket.geminiContext?.isActive) {
            return; // Ignore if voice session not active
          }

          // Establish WebSocket connection if not already established
          if (!socket.geminiContext.sessionActive) {
            await this.initializeGeminiWebSocketSession(socket);
          }

          // Forward voice data to Gemini Live API via WebSocket
          await this.processAudioWithGemini(socket, data);
        } catch (error) {
          console.error("Error processing voice data:", error);
          socket.emit("gemini_voice_error", {
            error: "Failed to process voice data",
          });
        }
      });

      // Handle text messages for Gemini voice
      socket.on("gemini_voice_message", async (message) => {
        try {
          if (!socket.geminiContext?.isActive) {
            socket.emit("gemini_voice_error", {
              error: "Voice service not active",
            });
            return;
          }

          // Process text message with Gemini via WebSocket
          await this.processTextWithGemini(socket, message);
        } catch (error) {
          console.error("Error processing text message:", error);
          socket.emit("gemini_voice_error", {
            error: "Failed to process message",
          });
        }
      });

      // Process PDF files for context
      socket.on("gemini_process_pdfs", async (files) => {
        try {
          if (!socket.geminiContext?.isActive) {
            socket.emit("gemini_voice_error", {
              error: "Voice service not active",
            });
            return;
          }

          await this.processPdfFiles(socket, files);
          socket.emit("gemini_pdfs_processed", {
            message: `${files.length} PDF file(s) processed and ready for conversation`,
          });
        } catch (error) {
          console.error("Error processing PDF files:", error);
          socket.emit("gemini_voice_error", {
            error: "Failed to process PDF files",
          });
        }
      });

      // Stop Gemini voice service
      socket.on("stop_gemini_voice", () => {
        if (socket.geminiContext) {
          this.cleanUpGeminiSession(socket);
          socket.geminiContext.isActive = false;
          console.log(
            `Gemini voice service deactivated for ${socket.geminiContext.userName}`
          );
        }
        socket.emit("gemini_voice_stopped");
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(
          "Client disconnected from Gemini Voice Service:",
          socket.id
        );
        this.cleanUpGeminiSession(socket);
        // Clean up any active session
        if (socket.geminiContext?.userId) {
          this.activeSessions.delete(socket.geminiContext.userId);
        }
      });
    });
  }

  async initializeGeminiWebSocketSession(socket) {
    try {
      // Close existing connection if any
      if (socket.geminiContext.geminiWsConnection) {
        socket.geminiContext.geminiWsConnection.terminate();
      }

      // Create WebSocket URL with API key
      const wsUrl = `${GEMINI_WS_URL}&key=${process.env.GEMINI_API_KEY}`;

      // Initialize WebSocket connection to Gemini
      const wsConnection = new WebSocket(wsUrl);
      socket.geminiContext.geminiWsConnection = wsConnection;

      // Set up WebSocket event handlers
      wsConnection.on("open", () => {
        console.log("WebSocket connection to Gemini established");

        // Send initial setup message
        const setupMessage = this.createSetupMessage(socket.geminiContext);
        wsConnection.send(JSON.stringify(setupMessage));
        socket.geminiContext.sessionActive = true;
      });

      wsConnection.on("message", (data) => {
        this.handleGeminiWebSocketMessage(socket, data);
      });

      wsConnection.on("error", (error) => {
        console.error("WebSocket error:", error);
        socket.emit("gemini_voice_error", {
          error: "Connection error with Gemini API",
        });
        this.cleanUpGeminiSession(socket);
      });

      wsConnection.on("close", (code, reason) => {
        console.log(`WebSocket closed with code ${code}: ${reason}`);
        socket.geminiContext.sessionActive = false;
        socket.emit("gemini_voice_info", { message: "Gemini session ended" });
      });

      return new Promise((resolve) => {
        // Wait for connection to be established
        wsConnection.on("open", () => {
          resolve();
        });
      });
    } catch (error) {
      console.error("Error initializing WebSocket session:", error);
      socket.geminiContext.sessionActive = false;
      throw error;
    }
  }

  createSetupMessage(context) {
    // Create BidiGenerateContentSetup message for initializing the session
    const pdfContext = context.pdfContents.map((pdf) => pdf.text).join("\n\n");

    return {
      setup: {
        model: "models/gemini-2.0-flash-exp",
        generationConfig: {
          candidateCount: 1,
          maxOutputTokens: 1024,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          responseModalities: ["AUDIO"],
          speechConfig: {
            audioFormat: {
              audioEncoding: "LINEAR16",
              sampleRateHertz: 24000,
            },
          },
        },
        systemInstruction: `You are a helpful AI assistant. Answer questions based on the provided PDF context. ${
          pdfContext
            ? "Here is the content from uploaded PDFs that you should reference when answering questions:"
            : "No PDF content has been uploaded yet."
        }

${pdfContext}`,
      },
    };
  }

  handleGeminiWebSocketMessage(socket, data) {
    try {
      const message = JSON.parse(data);

      // Handle setup complete confirmation
      if (message.setupComplete) {
        console.log("Gemini WebSocket setup complete");
        return;
      }

      // Handle server content (text or audio responses)
      if (message.serverContent) {
        const content = message.serverContent;

        // If there's text content
        if (content.model_turn && content.model_turn.parts) {
          const textParts = content.model_turn.parts.filter(
            (part) => part.text
          );
          const audioParts = content.model_turn.parts.filter(
            (part) => part.inline_data
          );

          if (textParts.length > 0) {
            const textResponse = textParts.map((part) => part.text).join("");
            socket.emit("gemini_voice_response", {
              text: textResponse,
              isComplete: content.turn_complete || false,
            });

            // Store in conversation history if complete
            if (content.turn_complete) {
              socket.geminiContext.conversationHistory.push({
                role: "model",
                text: textResponse,
              });
            }
          }

          if (audioParts.length > 0) {
            // Handle audio data if present
            const audioData = audioParts[0].inline_data.data;
            socket.emit("gemini_voice_audio", {
              audioData: audioData,
              isComplete: content.turn_complete || false,
            });
          }
        }
      }

      // Handle tool calls if any
      if (message.toolCall) {
        // Process tool calls (not implemented in this basic version)
        console.log("Tool call received:", message.toolCall);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  async processAudioWithGemini(socket, audioData) {
    try {
      if (
        !socket.geminiContext.geminiWsConnection ||
        socket.geminiContext.geminiWsConnection.readyState !== WebSocket.OPEN
      ) {
        await this.initializeGeminiWebSocketSession(socket);
      }

      // Send audio data as a real-time input message
      const realtimeInputMessage = {
        realtimeInput: {
          audio: {
            data: audioData.toString("base64"),
          },
        },
      };

      socket.geminiContext.geminiWsConnection.send(
        JSON.stringify(realtimeInputMessage)
      );
    } catch (error) {
      console.error("Error processing audio with Gemini WebSocket:", error);
      throw error;
    }
  }

  async processTextWithGemini(socket, message) {
    try {
      // Track user message in conversation history
      socket.geminiContext.conversationHistory.push({
        role: "user",
        text: message,
      });

      if (!socket.geminiContext.sessionActive) {
        await this.initializeGeminiWebSocketSession(socket);
      }

      if (
        !socket.geminiContext.geminiWsConnection ||
        socket.geminiContext.geminiWsConnection.readyState !== WebSocket.OPEN
      ) {
        throw new Error("WebSocket connection is not open");
      }

      // Create message with conversation content
      const contentMessage = {
        clientContent: {
          content: {
            role: "user",
            parts: [{ text: message }],
          },
          turn_complete: true,
        },
      };

      // Send message through WebSocket
      socket.geminiContext.geminiWsConnection.send(
        JSON.stringify(contentMessage)
      );

      // For development, create fallback response just in case
      setTimeout(() => {
        const wsState = socket.geminiContext.geminiWsConnection?.readyState;
        // If response hasn't been received in 10 seconds, use fallback
        if (
          socket.geminiContext.conversationHistory[
            socket.geminiContext.conversationHistory.length - 1
          ].role === "user"
        ) {
          console.log(
            "No response received from Gemini WebSocket, using regular API as fallback"
          );
          this.processTextWithRegularAPI(socket, message);
        }
      }, 10000);
    } catch (error) {
      console.error("Error sending text message to Gemini WebSocket:", error);
      // Fallback to regular API
      await this.processTextWithRegularAPI(socket, message);
    }
  }

  async processTextWithRegularAPI(socket, message) {
    try {
      console.log(
        `Processing text message from ${socket.geminiContext.userName} using regular API: ${message}`
      );

      // Use Gemini API to generate a response
      const model = genAI.getGenerativeModel({
        model: "models/gemini-2.0-flash",
      });

      // Format conversation history for context
      let prompt = message;
      const context = [];

      // Add PDF content as context if available
      if (socket.geminiContext.pdfContents.length > 0) {
        const pdfText = socket.geminiContext.pdfContents
          .map((pdf) => `Document ${pdf.name}: ${pdf.summary || pdf.text}`)
          .join("\n\n");

        context.push(`Here is the content from uploaded PDFs:\n${pdfText}\n\n`);
      }

      // Add recent conversation history (last 3 turns at most)
      const recentHistory = socket.geminiContext.conversationHistory
        .slice(-6) // Only use last 6 messages (3 turns)
        .filter((msg) => msg.role !== "user" || msg.text !== message); // Exclude current message

      if (recentHistory.length > 0) {
        context.push("Recent conversation:");
        recentHistory.forEach((msg) => {
          context.push(
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`
          );
        });
      }

      // Combine context and user question
      if (context.length > 0) {
        prompt = `${context.join(
          "\n"
        )}\n\nUser: ${message}\n\nAnswer based on the provided PDF content:`;
      }

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Update conversation history
      socket.geminiContext.conversationHistory.push({
        role: "model",
        text: response,
      });

      // Send text response back to client
      socket.emit("gemini_voice_response", {
        text: response,
        isComplete: true,
      });
    } catch (error) {
      console.error("Error processing text with Gemini:", error);
      socket.emit("gemini_voice_error", {
        error: "Failed to process text with Gemini",
      });
    }
  }

  async processPdfFiles(socket, files) {
    try {
      socket.geminiContext.pdfContents = [];

      for (const file of files) {
        try {
          // Extract content from PDF
          const pdfContent = await this.extractPdfContent(file);

          // Generate summary if text is too long
          let summary = "";
          if (pdfContent.length > 5000) {
            summary = await this.generatePdfSummary(pdfContent, file.name);
          }

          // Store the PDF content and summary
          socket.geminiContext.pdfContents.push({
            name: file.name,
            text: pdfContent,
            summary: summary,
          });

          console.log(
            `Processed PDF: ${file.name}, chars: ${pdfContent.length}`
          );
        } catch (err) {
          console.error(`Error processing PDF ${file.name}:`, err);
        }
      }

      // If WebSocket session is active, reinitialize with new context
      if (socket.geminiContext.sessionActive) {
        this.cleanUpGeminiSession(socket);
        await this.initializeGeminiWebSocketSession(socket);
      }
    } catch (error) {
      console.error("Error processing PDF files:", error);
      throw error;
    }
  }

  async extractPdfContent(file) {
    try {
      // For this implementation, assume the file has a buffer property
      const data = await pdfParse(file.buffer);
      return data.text || "";
    } catch (error) {
      console.error("Error extracting PDF content:", error);
      return "";
    }
  }

  async generatePdfSummary(text, filename) {
    try {
      const model = genAI.getGenerativeModel({
        model: "models/gemini-2.0-flash",
      });
      const prompt = `Summarize the following content from ${filename}. Focus on the main topics and key information that would be useful for answering questions about this document. Keep the summary concise but informative, within 1000 words.
      
${text.substring(0, 15000)}${text.length > 15000 ? "..." : ""}`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error generating PDF summary:", error);
      return "";
    }
  }

  cleanUpGeminiSession(socket) {
    try {
      if (socket.geminiContext?.geminiWsConnection) {
        socket.geminiContext.geminiWsConnection.terminate();
        socket.geminiContext.geminiWsConnection = null;
        socket.geminiContext.sessionActive = false;
      }
    } catch (err) {
      console.error("Error cleaning up Gemini session:", err);
    }
  }
}

module.exports = function setupGeminiVoice(io) {
  const geminiVoiceService = new GeminiVoiceService(io);
  return geminiVoiceService;
};
