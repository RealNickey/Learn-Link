require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("fs").promises;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

async function generateAIContent(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating AI content:", error);
    throw error;
  }
}

async function processPdfContent(
  pdfBuffer,
  prompt = "Summarize this document"
) {
  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);
    return result.response.text();
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
}

async function localPdfToPart(buffer, displayName) {
  const tempPath = `/tmp/${displayName}-${Date.now()}.pdf`;
  try {
    await fs.writeFile(tempPath, buffer);
  } catch (error) {
    console.error("Error writing temporary PDF file:", error);
    throw error;
  }
  try {
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: "application/pdf",
      displayName,
    });

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
      await localPdfToPart(pdf1Buffer, "PDF 1"),
      await localPdfToPart(pdf2Buffer, "PDF 2"),
      "What are some important topics in these documents?,generate a focus area for exams as points",
    ]);
    return result.response.text();
  } catch (error) {
    console.error("Error comparing PDFs:", error);
    throw error;
  }
}

/**
 * Generates quiz questions based on PDF content
 * @param {Array} pdfFiles - Array of PDF objects with buffer and filename
 * @returns {Object} Quiz object with questions array
 */
async function generateQuiz(pdfFiles) {
  try {
    console.log(`[generateQuiz] Processing ${pdfFiles.length} PDF files`);

    // Generate questions for each PDF
    const allQuestions = [];

    for (let i = 0; i < pdfFiles.length; i++) {
      // Check if we're receiving a proper object with buffer and filename
      let buffer, filename;

      if (pdfFiles[i].buffer && pdfFiles[i].filename) {
        // If properly structured object
        buffer = pdfFiles[i].buffer;
        filename = pdfFiles[i].filename;
      } else {
        // If just a buffer
        buffer = pdfFiles[i];
        filename = `Document ${i + 1}`;
      }

      console.log(`[generateQuiz] Processing file ${i + 1}: ${filename}`);

      const prompt = `
        You are an expert teacher creating a quiz based on this PDF document.
        
        Create 5 multiple-choice questions that test understanding of key concepts in the document.
        Each question must:
        1. Be based directly on specific content in this document
        2. Have four answer options (A, B, C, D)
        3. Have one clearly correct answer
        4. Include a brief explanation of the correct answer
        
        Format your response as a valid JSON array with this structure:
        [
          {
            "question": "Question text here?",
            "options": ["First option", "Second option", "Third option", "Fourth option"],
            "correctAnswer": 0,
            "explanation": "Why this is the correct answer, with reference to document content"
          }
        ]
        
        Remember: Create exactly 5 questions, each with 4 options. Make sure the content is specifically from this document.
        Only provide the JSON array, no other text.
      `;

      try {
        const result = await model.generateContent([
          {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: "application/pdf",
            },
          },
          prompt,
        ]);

        const responseText = result.response.text();
        console.log("[generateQuiz] Received AI response for file:", filename);

        // Extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = responseText.match(
          /```(?:json)?\s*([\s\S]*?)\s*```/
        ) || [null, responseText];
        const jsonStr = jsonMatch[1].trim();

        try {
          const parsedQuestions = JSON.parse(jsonStr);
          console.log(
            `[generateQuiz] Successfully parsed ${parsedQuestions.length} questions for ${filename}`
          );

          // Display a sample question in console for debugging
          console.log(`[generateQuiz] Sample question:`, parsedQuestions[0]);

          // Add file identifier to each question
          const questionsWithSource = parsedQuestions.map((q) => ({
            ...q,
            source: filename,
          }));

          allQuestions.push(...questionsWithSource);
        } catch (parseError) {
          console.error("[generateQuiz] Failed to parse JSON:", parseError);
          console.log("[generateQuiz] Raw response:", responseText);

          // Create fallback questions for this document
          const fallbackQuestions = [
            {
              question: `What is the main topic of ${filename}?`,
              options: [
                "The primary subject of the document",
                "An unrelated concept",
                "A minor detail",
                "None of the above",
              ],
              correctAnswer: 0,
              explanation: "This is a fallback question.",
              source: filename,
            },
          ];

          allQuestions.push(...fallbackQuestions);
        }
      } catch (error) {
        console.error(`[generateQuiz] Error generating questions:`, error);

        // Add single fallback question
        allQuestions.push({
          question: `What information can be found in ${filename}?`,
          options: [
            "Main content",
            "Unrelated information",
            "No specific content",
            "Random data",
          ],
          correctAnswer: 0,
          explanation: "This is a fallback question due to an error.",
          source: filename,
        });
      }
    }

    console.log(
      `[generateQuiz] Total questions generated: ${allQuestions.length}`
    );

    // Ensure we have at least 5 questions total
    if (allQuestions.length < 5) {
      const moreNeeded = 5 - allQuestions.length;
      console.log(
        `[generateQuiz] Adding ${moreNeeded} generic questions to reach minimum of 5`
      );

      for (let i = 0; i < moreNeeded; i++) {
        allQuestions.push({
          question: `Generic Question ${
            i + 1
          }: What approach is best for studying the content?`,
          options: [
            "Understanding key concepts",
            "Memorizing random facts",
            "Ignoring main topics",
            "Not reading the document",
          ],
          correctAnswer: 0,
          explanation:
            "Understanding key concepts is always the best approach.",
          source: "General",
        });
      }
    }

    // Print all generated questions to terminal for debugging
    console.log("\n=== GENERATED QUIZ QUESTIONS ===");
    allQuestions.slice(0, 5).forEach((q, i) => {
      console.log(`\nQ${i + 1} [${q.source}]: ${q.question}`);
      q.options.forEach((opt, j) => {
        const marker = j === q.correctAnswer ? "✓" : " ";
        console.log(`  ${marker} ${opt}`);
      });
    });
    console.log("\n===============================\n");

    // Return only 5 questions
    return { questions: allQuestions.slice(0, 5) };
  } catch (error) {
    console.error("[generateQuiz] Error in quiz generation:", error);
    throw error;
  }
}

/**
 * Generates flashcards based on PDF content
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Array} Array of flashcard objects with frontText and backText
 */
async function generateFlashcards(pdfBuffer) {
  try {
    console.log(`[generateFlashcards] Processing PDF file`);

    const prompt = `
      You are an expert teacher creating flashcards based on this PDF document.
      
      Create 5 flashcards that highlight key concepts from the document.
      Each flashcard must:
      1. Have a front side with a clear, concise question or concept
      2. Have a back side with a comprehensive answer or explanation
      3. Be based directly on specific content in this document
      
      Format your response as a valid JSON array with this structure:
      [
        {
          "frontText": "Question or concept here?",
          "backText": "Answer or explanation here."
        }
      ]
      
      Remember: Create exactly 5 flashcards. Make sure the content is specifically from this document.
      Only provide the JSON array, no other text.
    `;

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            data: pdfBuffer.toString("base64"),
            mimeType: "application/pdf",
          },
        },
        prompt,
      ]);

      const responseText = result.response.text();
      console.log("[generateFlashcards] Received AI response");

      // Extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = responseText.match(
        /```(?:json)?\s*([\s\S]*?)\s*```/
      ) || [null, responseText];
      const jsonStr = jsonMatch[1].trim();

      try {
        const parsedFlashcards = JSON.parse(jsonStr);
        console.log(
          `[generateFlashcards] Successfully parsed ${parsedFlashcards.length} flashcards`
        );

        return parsedFlashcards;
      } catch (parseError) {
        console.error("[generateFlashcards] Failed to parse JSON:", parseError);
        console.log("[generateFlashcards] Raw response:", responseText);

        // Create fallback flashcards
        return [
          {
            frontText: "What is the main topic of this document?",
            backText:
              "The document covers important concepts and information relevant to the subject matter.",
          },
          {
            frontText: "How can this information be applied?",
            backText:
              "This information can be applied in practical scenarios related to the subject.",
          },
          {
            frontText: "What are key terms to remember?",
            backText:
              "The document contains several key terms that are important for understanding the subject.",
          },
        ];
      }
    } catch (error) {
      console.error(`[generateFlashcards] Error generating flashcards:`, error);

      // Return fallback flashcards
      return [
        {
          frontText: "What is this document about?",
          backText:
            "This document contains information on a specific subject matter.",
        },
        {
          frontText: "What should I focus on when studying this material?",
          backText:
            "Focus on understanding key concepts rather than memorizing details.",
        },
      ];
    }
  } catch (error) {
    console.error("[generateFlashcards] Error in flashcard generation:", error);
    throw error;
  }
}

/**
 * Generates AI response based on uploaded PDFs and user prompt
 * @param {Array} pdfFiles - Array of PDF buffers
 * @param {String} prompt - User query
 * @returns {String} AI response based on PDFs content
 */
async function generatePdfChatResponse(pdfFiles, prompt) {
  try {
    console.log(
      `[generatePdfChatResponse] Processing ${pdfFiles.length} PDF files with prompt: "${prompt}"`
    );

    // Prepare parts for the model
    const parts = [];

    // Add all PDF files as parts
    for (let i = 0; i < pdfFiles.length; i++) {
      const buffer = pdfFiles[i].buffer;
      const filename = pdfFiles[i].filename || `Document ${i + 1}`;

      console.log(
        `[generatePdfChatResponse] Adding file ${i + 1}: ${filename}`
      );

      parts.push({
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      });
    }

    // Add the prompt as the final part
    const enhancedPrompt = `
      Based on the content of the PDF documents provided, please answer the following query:
      
      "${prompt}"
      
      Use specific information from the documents to provide a detailed and accurate response.
      If the information to answer the query is not in the documents, state this clearly.
    `;

    parts.push(enhancedPrompt);

    // Generate response
    const result = await model.generateContent(parts);
    return result.response.text();
  } catch (error) {
    console.error("[generatePdfChatResponse] Error:", error);
    throw error;
  }
}

module.exports = {
  generateAIContent,
  processPdfContent,
  comparePdfs,
  generateQuiz,
  generateFlashcards,
  generatePdfChatResponse,
};
