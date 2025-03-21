import { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import io from "socket.io-client";
import "../../styles/gemini-voice.css";

const GeminiVoice = ({ user, micActive, selectedFiles = [], onToggle }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responses, setResponses] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pdfsProcessed, setPdfsProcessed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioElementRef = useRef(null);
  const { toast } = useToast();

  const conversationRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (micActive && !socketRef.current) {
      const apiUrl = import.meta.env.VITE_API_URL;

      socketRef.current = io(apiUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        transports: ["websocket", "polling"],
        timeout: 10000,
        path: "/socket.io/",
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to Gemini voice service");
        setIsActive(true);

        // Initialize Gemini voice service with user info and document context
        initializeVoiceService();
      });

      socketRef.current.on("gemini_voice_ready", (data) => {
        console.log("Gemini voice service ready:", data);
        toast({
          title: "Gemini Voice Ready",
          description: "You can now talk to Gemini AI",
        });

        // Process PDFs if available
        if (selectedFiles.length > 0 && !pdfsProcessed) {
          processPdfFiles();
        }
      });

      socketRef.current.on("gemini_voice_response", (data) => {
        setIsProcessing(false);
        setResponses((prev) => [...prev, { text: data.text, type: "ai" }]);

        // Auto-scroll to the bottom of conversation
        scrollToBottom();
      });

      socketRef.current.on("gemini_voice_audio", (data) => {
        if (audioEnabled && data.audioData) {
          playAudioResponse(data.audioData);
        }
      });

      socketRef.current.on("gemini_pdfs_processed", (data) => {
        setPdfsProcessed(true);
        toast({
          title: "PDFs Processed",
          description: data.message,
        });
      });

      socketRef.current.on("gemini_voice_error", (data) => {
        console.error("Gemini voice error:", data.error);
        setIsProcessing(false);
        toast({
          title: "Gemini Voice Error",
          description: data.error,
          variant: "destructive",
        });
      });

      socketRef.current.on("gemini_voice_stopped", () => {
        setIsListening(false);
        setIsProcessing(false);
        setIsActive(false);
      });

      socketRef.current.on("disconnect", () => {
        console.log("Disconnected from Gemini voice service");
        setIsActive(false);
        setIsListening(false);
      });
    } else if (!micActive && socketRef.current) {
      stopListening();
      socketRef.current.emit("stop_gemini_voice");
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsActive(false);
      setPdfsProcessed(false);
    }

    return () => {
      if (socketRef.current) {
        stopListening();
        socketRef.current.emit("stop_gemini_voice");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [micActive]);

  // Monitor for changes in selected files
  useEffect(() => {
    if (
      isActive &&
      selectedFiles.length > 0 &&
      !pdfsProcessed &&
      socketRef.current
    ) {
      processPdfFiles();
    }
  }, [selectedFiles, isActive]);

  const initializeVoiceService = () => {
    const documentContext = getDocumentContext();
    socketRef.current.emit("start_gemini_voice", {
      ...user,
      documentContext,
      selectedFiles,
    });
  };

  const processPdfFiles = () => {
    if (!socketRef.current || selectedFiles.length === 0) return;

    // Inform user that PDFs are being processed
    toast({
      title: "Processing PDFs",
      description: `Analyzing ${selectedFiles.length} document(s) for voice chat...`,
    });

    // Send files to backend for processing
    socketRef.current.emit("gemini_process_pdfs", selectedFiles);
  };

  const getDocumentContext = () => {
    // Extract context from selected files if any
    if (!selectedFiles || selectedFiles.length === 0) {
      return "";
    }

    return `The user has uploaded ${
      selectedFiles.length
    } PDF file(s): ${selectedFiles.map((file) => file.name).join(", ")}`;
  };

  const playAudioResponse = (base64Data) => {
    try {
      // Convert base64 to audio buffer
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Create audio blob
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      // Play audio
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
      }

      audioElementRef.current.src = url;
      audioElementRef.current.play();

      // Clean up URL
      audioElementRef.current.onended = () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error("Error playing audio response:", error);
    }
  };

  const startListening = async () => {
    if (!isActive) return;

    setIsListening(true);
    setTranscript("");

    try {
      // Initialize Web Speech API for voice recognition
      if (window.webkitSpeechRecognition || window.SpeechRecognition) {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onend = () => {
          if (isListening) {
            // If still in listening mode, restart recognition
            recognition.start();
          }
        };

        recognition.start();
      } else {
        // If Web Speech API is not supported, try audio recording
        await setupAudioRecording();
      }
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      toast({
        title: "Voice Recognition Error",
        description:
          "Unable to start voice recognition. Please check microphone permissions.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const setupAudioRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

          // Convert blob to binary data
          const reader = new FileReader();
          reader.readAsArrayBuffer(audioBlob);
          reader.onloadend = () => {
            // Send audio data to the server through socket
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit("voice_data", reader.result);
            }
          };
        }
      });

      // Start recording
      mediaRecorder.start();

      // Record in chunks to simulate streaming
      const recordInterval = setInterval(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording" &&
          isListening
        ) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.start();
        } else {
          clearInterval(recordInterval);
        }
      }, 3000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);

    // Stop speech recognition if active
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop audio recording if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Clean up audio stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Submit final transcript if it exists
    if (transcript.trim()) {
      handleSubmitTranscript();
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSubmitTranscript = () => {
    if (!transcript.trim()) return;

    // Add user message to conversation
    setResponses((prev) => [...prev, { text: transcript, type: "user" }]);

    // Process the transcript with Gemini
    setIsProcessing(true);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("gemini_voice_message", transcript);
    } else {
      setIsProcessing(false);
      toast({
        title: "Connection Error",
        description: "Not connected to Gemini voice service",
        variant: "destructive",
      });
    }

    // Clear the transcript
    setTranscript("");

    // Scroll to bottom
    scrollToBottom();
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    toast({
      title: audioEnabled
        ? "Voice Response Disabled"
        : "Voice Response Enabled",
      description: audioEnabled
        ? "AI responses will be text only"
        : "AI responses will include voice when available",
    });
  };

  const scrollToBottom = () => {
    if (conversationRef.current) {
      setTimeout(() => {
        conversationRef.current.scrollTop =
          conversationRef.current.scrollHeight;
      }, 100);
    }
  };

  return (
    <AnimatePresence>
      {micActive && (
        <motion.div
          className={cn(
            "gemini-voice-container",
            isExpanded ? "expanded" : "collapsed"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="gemini-voice-header">
            <div className="gemini-title" onClick={handleToggleExpand}>
              <div className={cn("gemini-status", { active: isActive })}>
                {isActive ? "Gemini AI Voice" : "Connecting..."}
              </div>
              <button
                className="toggle-expand"
                onClick={handleToggleExpand}
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? "▼" : "▲"}
              </button>
            </div>
            <div className="gemini-controls">
              {selectedFiles.length > 0 && (
                <div
                  className="pdf-status"
                  title={`${selectedFiles.length} PDF(s) ${
                    pdfsProcessed ? "processed" : "pending"
                  }`}
                >
                  <FileText
                    size={16}
                    className={
                      pdfsProcessed ? "text-green-400" : "text-yellow-400"
                    }
                  />
                  <span className="pdf-count">{selectedFiles.length}</span>
                </div>
              )}
              <button
                className={cn("audio-toggle", { active: audioEnabled })}
                onClick={toggleAudio}
                title={
                  audioEnabled
                    ? "Disable voice responses"
                    : "Enable voice responses"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  {audioEnabled ? (
                    <>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    </>
                  ) : (
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                  )}
                </svg>
              </button>
              <button
                className="close-button"
                onClick={onToggle}
                aria-label="Close Gemini Voice"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="gemini-voice-content">
              <div className="gemini-conversation" ref={conversationRef}>
                {responses.length === 0 ? (
                  <div className="gemini-welcome">
                    <div className="gemini-welcome-icon">
                      <MessageSquare size={24} />
                    </div>
                    <p>Ask a question or start a conversation with Gemini AI</p>
                    {selectedFiles.length > 0 ? (
                      <p className="hint">
                        {pdfsProcessed
                          ? `${selectedFiles.length} PDF(s) processed. Ask questions about your documents!`
                          : "Processing your PDFs, please wait..."}
                      </p>
                    ) : (
                      <p className="hint">
                        Click the microphone button to start speaking
                      </p>
                    )}
                  </div>
                ) : (
                  responses.map((response, index) => (
                    <div
                      key={index}
                      className={cn(
                        "gemini-message",
                        response.type === "user" ? "user-message" : "ai-message"
                      )}
                    >
                      <div className="message-avatar">
                        {response.type === "user" ? (
                          <div className="user-avatar">
                            {user?.name?.charAt(0) || "U"}
                          </div>
                        ) : (
                          <div className="ai-avatar">G</div>
                        )}
                      </div>
                      <div className="message-content">{response.text}</div>
                    </div>
                  ))
                )}

                {isProcessing && (
                  <div className="gemini-message ai-message">
                    <div className="message-avatar">
                      <div className="ai-avatar processing">G</div>
                    </div>
                    <div className="message-content processing">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="gemini-voice-input">
                <div className="transcript-container">
                  <input
                    type="text"
                    className="transcript-input"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={
                      isListening ? "Speak now..." : "Type a message..."
                    }
                    disabled={isProcessing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isProcessing) {
                        handleSubmitTranscript();
                      }
                    }}
                  />
                  <button
                    className="submit-button"
                    onClick={handleSubmitTranscript}
                    disabled={!transcript.trim() || isProcessing}
                  >
                    Send
                  </button>
                </div>

                <button
                  className={cn(
                    "mic-button",
                    isListening ? "listening" : "",
                    isProcessing ? "disabled" : ""
                  )}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing || !isActive}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GeminiVoice;
