import React, { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./styles/dashboard.css";
import "./styles/list-files.css"; // Import the new styles
import { FileUpload } from "./components/ui/file-upload";
import { ListFiles } from "./components/ui/list-files";
import { PlaceholdersAndVanishInput } from "./components/ui/placeholders-and-vanish-input";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import { Dock, DockIcon, MusicPlayer } from "./components/ui/dock"; // Updated import to include MusicPlayer
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

import Toolbar from "./components/ui/toolbar";
import VoiceChat from "./components/ui/voice-chat"; // Add this import
import LiveCursor from "./components/ui/livecursor";
import {
  ChatBubble,
  ChatBubbleMessage,
  ChatBubbleAvatar,
} from "./components/ui/chat-bubble";
import { cn } from "./lib/utils";
import QuizPanel from "./components/ui/quiz-panel";

// Removed ToastDemo component

const Profile = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth0();
  const [files, setFiles] = useState([]);
  const [micOn, setMicOn] = useState(true); // Added state for mic
  const [aiContent, setAiContent] = useState(""); // Added state for AI content
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false); // New state for PDF preview visibility
  const { toast } = useToast();
  const [pdfContent, setPdfContent] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatHistory, setChatHistory] = useState([]); // Added state for chat history
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false); // Added state for loading AI response
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAiError, setIsAiError] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);

  const userImage = user.picture; // Store user image in a variable

  const handleFileUpload = (newFiles) => {
    const duplicateFiles = newFiles.filter((newFile) =>
      files.some(
        (existingFile) =>
          existingFile.name === newFile.name &&
          existingFile.lastModified === newFile.lastModified
      )
    );

    if (duplicateFiles.length > 0) {
      toast({
        title: "Error",
        description: "Duplicate files cannot be uploaded.",
        variant: "destructive",
      });
      return;
    }

    const uniqueFiles = newFiles.filter(
      (newFile) =>
        !files.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.lastModified === newFile.lastModified
        )
    );

    if (files.length + uniqueFiles.length > 3) {
      toast({
        title: "Error",
        description: "You can only upload up to 3 PDF files.",
        variant: "destructive",
      });
      return;
    }

    setFiles((prevFiles) => [...prevFiles, ...uniqueFiles]);
    setSelectedFiles([]); // Reset selected files
    console.log(newFiles);
  };

  const generateSummary = async (file) => {
    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    const toastId = toast({
      title: "Generating Summary",
      description: "Please wait while we analyze your document...",
      duration: 2000, // Auto-close after 2 seconds
    });

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/generate-summary`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const { summary } = await response.json();
      setAiContent(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error",
        description: "Failed to generate summary",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSelectFile = (file) => {
    if (selectedFile === file) {
      setShowPdfPreview(!showPdfPreview);
      if (showPdfPreview) {
        setSelectedFile(null); // Clear selection when closing preview
      }
    } else {
      setSelectedFile(file);
      setShowPdfPreview(true);
    }
  };

  const handleRemoveFile = (fileToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    // If removing the currently selected file, hide preview
    if (selectedFile === fileToRemove) {
      setSelectedFile(null);
      setShowPdfPreview(false);
    }
  };

  const toggleMic = () => {
    setMicOn(!micOn);
  };

  const handleInputSubmit = async (inputValue) => {
    // Add user message immediately
    setChatHistory((prev) => [
      ...prev,
      { type: "user", content: inputValue, image: userImage },
    ]);

    setIsAiResponding(true);
    setIsAiError(false);

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/generate-ai-content?prompt=${encodeURIComponent(inputValue)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          // Using credentials: "same-origin" is safer for this type of request
          // It only sends credentials if the request is to the same origin
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content: data.content,
          status: "success",
        },
      ]);
    } catch (error) {
      console.error("Error fetching AI content:", error);
      setIsAiError(true);
      setChatHistory((prev) => [
        ...prev,
        {
          type: "ai",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
          status: "error",
        },
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handlePdfUpload = (summary) => {
    setAiContent(summary);
  };

  const handleFileSelect = (file, checked) => {
    setSelectedFiles((prev) =>
      checked ? [...prev, file] : prev.filter((f) => f !== file)
    );
  };

  const handleFocusArea = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file using the checkboxes",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);
    setIsLoadingAiResponse(true); // Start loading animation
    toast({
      title: "Generating Focus Area",
      description: `Analyzing ${selectedFiles.length} document(s)...`,
      duration: 2000,
    });

    try {
      // Clear previous content
      setAiContent("");

      // Process each selected file
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("pdf", file);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/generate-summary`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to generate summary");
        }

        const { summary } = await response.json();
        // Append new summary with file name
        const focusAreaText = `File: ${file.name}\n\n${summary}`;
        setAiContent(
          (prev) => `${prev}${prev ? "\n\n---\n\n" : ""}${focusAreaText}`
        );
        setChatHistory((prev) => [
          ...prev,
          { type: "ai", content: focusAreaText },
        ]);
        console.log(`Focus Area for ${file.name}:`, summary); // Temporarily show the result in console
      }

      toast({
        title: "Success",
        description: "Focus area generated successfully",
      });
    } catch (error) {
      console.error("Error generating focus area:", error);
      toast({
        title: "Error",
        description: "Failed to generate focus area",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsGeneratingSummary(false);
      setIsLoadingAiResponse(false); // Stop loading animation
    }
  };

  const handleGenerateQuiz = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files using the checkboxes",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Generating Quiz",
      description: `Creating questions from ${selectedFiles.length} document(s)...`,
      duration: 2000,
    });

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        console.log("Adding file:", file.name);
        formData.append("pdfs", file);
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/generate-quiz`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Quiz service unavailable"
            : `Server error: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Quiz data received:", data);

      if (!data.quiz || !data.quiz.questions) {
        throw new Error("Invalid quiz data received");
      }

      setCurrentQuiz(data.quiz);
      setIsQuizOpen(true);

      toast({
        title: "Success",
        description: `Quiz generated from ${selectedFiles.length} documents!`,
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate quiz",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Function to create a data URL for PDF preview
  const getPdfDataUrl = (file) => {
    if (!file) return null;
    return URL.createObjectURL(file);
  };

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  console.log("isLoading:", isLoading);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("error:", error);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    isAuthenticated && (
      <>
        <div className="dashboard-container" id="dashboard-container">
          <LiveCursor
            containerId="dashboard-container"
            username={user?.name || user?.email}
          />
          <div className="section div1">
            <ListFiles
              files={files}
              onSelect={handleSelectFile}
              onRemove={handleRemoveFile}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              activeFile={showPdfPreview ? selectedFile : null} // Only show active file when preview is open
            />
          </div>
          <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-black border-neutral-800 rounded-lg div2">
            <FileUpload
              onChange={handleFileUpload}
              onPdfUpload={handlePdfUpload}
            />
          </div>
          <div className="section div3" style={{ padding: 0 }}>
            <div
              style={{ width: "100%", height: "100%", position: "relative" }}
            >
              {showPdfPreview && selectedFile ? (
                <div
                  className="pdf-preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    zIndex: 10,
                    background: "rgba(0,0,0,0.8)",
                  }}
                >
                  <iframe
                    src={getPdfDataUrl(selectedFile)}
                    title="PDF Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                  />
                </div>
              ) : (
                <Tldraw
                  onMount={(editor) => {
                    editor.user.updateUserPreferences({ colorScheme: "dark" });
                  }}
                />
              )}
            </div>
          </div>
          <div className="section div4">
            <PlaceholdersAndVanishInput
              placeholders={[
                "What is Virutal Reality",
                "Which are the types of CSS",
                "Which are the layers of OSI model",
              ]}
              onChange={(e) => console.log(e.target.value)}
              onSubmit={handleInputSubmit} // Updated to use handleInputSubmit
            />
          </div>
          <div className="section div5 flex items-center justify-center p-3">
            <Toolbar userName={user.name} userImage={userImage} />
          </div>
          <div className="section div6">
            <div
              className="h-full overflow-y-auto p-4 flex flex-col space-y-4"
              ref={chatContainerRef}
            >
              {chatHistory.map((chat, index) => (
                <ChatBubble
                  key={index}
                  variant={chat.type === "user" ? "sent" : "received"}
                >
                  {chat.type === "user" ? (
                    <ChatBubbleAvatar
                      src={userImage}
                      fallback={user?.name?.charAt(0)}
                    />
                  ) : (
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 relative",
                        isAiResponding &&
                          index === chatHistory.length - 1 &&
                          "ai-avatar-loading"
                      )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          "text-white transition-colors duration-200",
                          chat.status === "error" && "text-red-500"
                        )}
                      >
                        <path d="M12 8V4H8" />
                        <rect width="16" height="12" x="4" y="8" rx="2" />
                        <path d="M2 14h2" />
                        <path d="M20 14h2" />
                        <path d="M15 13v2" />
                        <path d="M9 13v2" />
                      </svg>
                    </div>
                  )}
                  {(!isAiResponding ||
                    index !== chatHistory.length - 1 ||
                    chat.type === "user") && (
                    <ChatBubbleMessage
                      variant={chat.type === "user" ? "sent" : "received"}
                    >
                      {chat.content}
                    </ChatBubbleMessage>
                  )}
                </ChatBubble>
              ))}
              {isAiResponding && !chatHistory.length && (
                <ChatBubble variant="received">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 ai-avatar-loading">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <path d="M12 8V4H8" />
                      <rect width="16" height="12" x="4" y="8" rx="2" />
                      <path d="M2 14h2" />
                      <path d="M20 14h2" />
                      <path d="M15 13v2" />
                      <path d="M9 13v2" />
                    </svg>
                  </div>
                </ChatBubble>
              )}
              {isLoadingAiResponse && (
                <div className="chat-message ai">
                  <div className="chat-bubble ai">
                    <div className="ai-icon-wrapper">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-loader animate-spin"
                      >
                        <line x1="12" y1="2" x2="12" y2="6" />
                        <line x1="12" y1="18" x2="12" y2="22" />
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                        <line x1="2" y1="12" x2="6" y2="12" />
                        <line x1="18" y1="12" x2="22" y2="12" />
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                      </svg>
                    </div>
                    <div className="chat-content">Generating response...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="section div7">
            <Dock>
              <DockIcon
                onClick={toggleMic}
                title={micOn ? "Mic On" : "Mic Off"}
              >
                {micOn ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-mic"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-mic-off"
                  >
                    <line x1="2" x2="22" y1="2" y2="22" />
                    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
                    <path d="M5 10v2a7 7 0 0 0 12 5" />
                    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </DockIcon>
              <DockIcon title="AI Quiz" onClick={handleGenerateQuiz}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-graduation-cap"
                >
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                  <path d="M22 10v6" />
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                </svg>
              </DockIcon>
              <DockIcon title="Flash Cards">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-book-type"
                >
                  <path d="M10 13h4" />
                  <path d="M12 6v7" />
                  <path d="M16 8V6H8v2" />
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                </svg>
              </DockIcon>
              <DockIcon title="Focus Area" onClick={handleFocusArea}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-brain-circuit"
                >
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M9 13a4.5 4.5 0 0 0 3-4" />
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                  <path d="M6 18a4 4 0 0 1-1.967-.516" />
                  <path d="M12 13h4" />
                  <path d="M12 18h6a2 2 0 0 1 2 2v1" />
                  <path d="M12 8h8" />
                  <path d="M16 8V5a2 2 0 0 1 2-2" />
                  <circle cx="16" cy="13" r=".5" />
                  <circle cx="18" cy="3" r=".5" />
                  <circle cx="20" cy="21" r=".5" />
                  <circle cx="20" cy="8" r=".5" />
                </svg>{" "}
              </DockIcon>
              <MusicPlayer /> {/* Added MusicPlayer component */}
            </Dock>
          </div>
        </div>
        <QuizPanel
          quiz={currentQuiz}
          isOpen={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
        />
        <VoiceChat user={user} /> {/* Add this component */}
        <Toaster />
      </>
    )
  );
};

export default Profile;
