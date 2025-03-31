import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Button } from "./button";
import "./../../styles/voice-chat.css";

const VoiceChat = ({ user, onFilesReceived, files = [] }) => {
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [users, setUsers] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [customUsername, setCustomUsername] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Default username from Auth0 user or generate random one
  const defaultUsername =
    user?.name || user?.email || `user#${Math.floor(Math.random() * 999999)}`;

  const userStatus = useRef({
    microphone: false,
    mute: false,
    username: defaultUsername,
    online: false,
  });

  // Setup to watch for file changes from parent component
  useEffect(() => {
    if (connected && files.length > 0) {
      // Check if we have new files that haven't been shared yet
      const unprocessedFiles = files.filter(
        file => !processedFiles.some(
          processed => processed.name === file.name && processed.lastModified === file.lastModified
        )
      );
      
      if (unprocessedFiles.length > 0) {
        console.log("New files detected, sharing via voice chat:", unprocessedFiles);
        shareFiles(unprocessedFiles);
      }
    }
  }, [files, connected, processedFiles]);

  // Share files when user connects to voice chat or when new files are uploaded
  const shareFiles = async (filesToShare) => {
    if (!filesToShare.length || !connected) return;
    
    setIsUploading(true);
    
    try {
      // Process each file
      for (const file of filesToShare) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Use relative URL to ensure it works both locally and through port forwarding
        const response = await fetch(`/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed for file ${file.name}`);
        }
        
        const data = await response.json();
        console.log('File uploaded and ready to share:', data.file);
        
        // Share the file with other users via socket
        socketRef.current.emit('voice-chat-connect', data.file);
        
        // Add to processed files
        setProcessedFiles(prev => [...prev, file]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    // Use relative URL for socket connection to ensure it works with port forwarding
    // Either use a relative path or window.location.origin
    const socketUrl = window.location.origin;
    
    // Create socket connection with improved configuration
    socketRef.current = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false, // Don't connect automatically
      transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
      timeout: 10000, // Increase timeout to 10 seconds
      path: "/socket.io/", // Explicitly set the path
    });

    // Socket connection events
    socketRef.current.on("connect", () => {
      setConnectionStatus("connected");
      console.log("Connected to voice chat server!");

      // Send user information upon connection
      socketRef.current.emit("userInformation", userStatus.current);
      
      // When connecting, share all files that haven't been processed yet
      if (files.length > 0) {
        const filesToShare = files.filter(
          file => !processedFiles.some(
            processed => processed.name === file.name && processed.lastModified === file.lastModified
          )
        );
        if (filesToShare.length > 0) {
          shareFiles(filesToShare);
        }
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnectionStatus("error");
      setConnected(false);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from voice chat server");
      setConnectionStatus("disconnected");
      setConnected(false);
    });

    // Listen for user updates
    socketRef.current.on("usersUpdate", (data) => {
      setUsers(data);
    });

    // Listen for incoming audio
    socketRef.current.on("send", (data) => {
      if (!userStatus.current.mute) {
        const audio = new Audio(data);
        audio.play();
      }
    });

    // Listen for shared files
    socketRef.current.on("filesShared", (files) => {
      console.log("Received shared files:", files);
      setSharedFiles(files);

      // Auto-download the latest shared file
      if (files.length > 0) {
        const latestFile = files[files.length - 1];
        autoDownloadFile(latestFile);
      }

      // Update parent component with the files
      if (typeof onFilesReceived === "function") {
        onFilesReceived(files);
      }
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update username when user prop changes
  useEffect(() => {
    if (!editingName) {
      const newUsername = user?.name || user?.email || defaultUsername;
      userStatus.current.username = newUsername;
      setCustomUsername(newUsername);

      // If already connected, update username
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("userInformation", userStatus.current);
      }
    }
  }, [user?.name, user?.email, defaultUsername, editingName]);

  // Setup audio recording
  useEffect(() => {
    if (micEnabled && connected) {
      setupAudioRecording();
    } else if (!micEnabled && mediaRecorderRef.current) {
      stopAudioRecording();
    }
  }, [micEnabled, connected]);

  // Setup audio recording and transmission
  const setupAudioRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      let audioChunks = [];

      // Handle data available event
      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      // Handle stop event
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks);
        audioChunks = [];

        // Convert blob to base64
        const fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = () => {
          if (!userStatus.current.microphone || !userStatus.current.online)
            return;

          const base64String = fileReader.result;
          socketRef.current.emit("voice", base64String);
        };

        // Restart recording
        if (micEnabled && connected) {
          mediaRecorder.start();
          setTimeout(() => {
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
          }, 1000);
        }
      });

      // Start recording
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMicEnabled(false);
    }
  };

  // Stop audio recording
  const stopAudioRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Toggle connection
  const toggleConnection = () => {
    if (connected) {
      // Disconnect
      socketRef.current.disconnect();
      setConnected(false);
      userStatus.current.online = false;
      setMicEnabled(false);
      userStatus.current.microphone = false;
      stopAudioRecording();
    } else {
      // Connect
      socketRef.current.connect();
      setConnected(true);
      userStatus.current.online = true;
      socketRef.current.emit("userInformation", userStatus.current);

      // Share files when connecting to voice chat
      if (files.length > 0) {
        const filesToShare = files.filter(
          file => !processedFiles.some(
            processed => processed.name === file.name && processed.lastModified === file.lastModified
          )
        );
        if (filesToShare.length > 0) {
          shareFiles(filesToShare);
        }
      }
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (!connected) return;

    const newMicEnabled = !micEnabled;
    setMicEnabled(newMicEnabled);

    userStatus.current.microphone = newMicEnabled;
    socketRef.current.emit("userInformation", userStatus.current);
  };

  // Toggle mute
  const toggleMute = () => {
    if (!connected) return;

    const newMuted = !muted;
    setMuted(newMuted);

    userStatus.current.mute = newMuted;
    socketRef.current.emit("userInformation", userStatus.current);
  };

  // Handle username change
  const handleUsernameChange = (e) => {
    setCustomUsername(e.target.value);
  };

  // Save username
  const saveUsername = () => {
    if (customUsername.trim()) {
      userStatus.current.username = customUsername.trim();
      if (connected) {
        socketRef.current.emit("userInformation", userStatus.current);
      }
      setEditingName(false);
    }
  };

  // Upload file when user connects to voice chat
  const uploadAndShareFile = async () => {
    if (!files.length) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      // Use relative URL to ensure it works both locally and through port forwarding
      const response = await fetch(`/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      console.log("File uploaded:", data.file);

      // Share the file with other users via socket
      socketRef.current.emit("voice-chat-connect", data.file);

      // Reset file selection
      if (downloadLinkRef.current) {
        downloadLinkRef.current.href = data.file;
        downloadLinkRef.current.download = files[0].name;
        downloadLinkRef.current.click();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-download a file
  const autoDownloadFile = (fileData) => {
    if (!fileData || !fileData.url) return;
    
    // Download the file and convert it to a File object
    const convertToFile = async () => {
      try {
        // Fetch the file from the URL
        const response = await fetch(fileData.url);
        if (!response.ok) throw new Error('Failed to download file');
        
        const blob = await response.blob();
        
        // Create a File object with the same properties expected by the dashboard
        const file = new File([blob], fileData.originalName, {
          type: fileData.mimeType || 'application/pdf',
          lastModified: new Date(fileData.uploadedAt || Date.now()).getTime()
        });
        
        // Store in browser memory by passing to parent component
        if (typeof onFilesReceived === 'function') {
          console.log(`File downloaded and stored in memory: ${fileData.originalName}`);
          onFilesReceived([file]);
        }
      } catch (error) {
        console.error('Error downloading shared file:', error);
      }
    };
    
    // Process the file
    convertToFile();
  };

  // Count online users
  const onlineUsersCount = Object.values(users).filter(
    (user) => user.online
  ).length;

  // Check if current user is in the participants list
  const isUserListed = Object.values(users).some(
    (u) => u.username === userStatus.current.username
  );

  // Find current user's socket ID
  const currentUserSocketId = Object.keys(users).find(
    (key) => users[key].username === userStatus.current.username
  );

  return (
    <div
      className={`voice-chat-container ${expanded ? "expanded" : "collapsed"}`}
    >
      <div className="voice-chat-header" onClick={() => setExpanded(!expanded)}>
        <h3>Voice Chat {connected ? "🟢" : "🔴"}</h3>
        <div className="online-indicator">
          {onlineUsersCount} online {expanded ? "▼" : "▲"}
        </div>
      </div>

      {expanded && (
        <>
          <div className="user-profile">
            {editingName ? (
              <div className="username-edit">
                <input
                  type="text"
                  value={customUsername}
                  onChange={handleUsernameChange}
                  placeholder="Enter your display name"
                />
                <button onClick={saveUsername}>Save</button>
              </div>
            ) : (
              <div
                className="username-display"
                onClick={() => setEditingName(true)}
              >
                <span className="display-name">
                  {userStatus.current.username} {connected && "(You)"}
                </span>
                <span className="edit-icon">✏️</span>
              </div>
            )}
            <div className="connection-status">
              Status:{" "}
              <span className={`status-${connectionStatus}`}>
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "error"
                  ? "Connection Error"
                  : "Disconnected"}
              </span>
            </div>
          </div>

          <div className="voice-controls">
            <Button
              variant={connected ? "default" : "outline"}
              onClick={toggleConnection}
              className={connected ? "connect-button active" : "connect-button"}
            >
              {connected ? "Disconnect" : "Connect"}
            </Button>

            <Button
              variant={micEnabled ? "default" : "outline"}
              onClick={toggleMicrophone}
              disabled={!connected}
              className={micEnabled ? "mic-button active" : "mic-button"}
            >
              {micEnabled ? "Mic On" : "Mic Off"}
            </Button>

            <Button
              variant={muted ? "default" : "outline"}
              onClick={toggleMute}
              disabled={!connected}
              className={muted ? "mute-button active" : "mute-button"}
            >
              {muted ? "Unmute" : "Mute"}
            </Button>
          </div>

          <div className="users-list">
            <h4>Participants</h4>
            {Object.keys(users).length > 0 ? (
              <ul>
                {Object.entries(users).map(([socketId, userData]) => (
                  <li
                    key={socketId}
                    className={`${userData.online ? "online" : "offline"} ${
                      socketId === currentUserSocketId ? "current-user" : ""
                    }`}
                  >
                    <span className="username">{userData.username}</span>
                    <span className="status-icons">
                      {userData.microphone && userData.online && (
                        <span className="mic-icon" title="Microphone On">
                          🎤
                        </span>
                      )}
                      {userData.mute && userData.online && (
                        <span className="mute-icon" title="Audio Muted">
                          🔇
                        </span>
                      )}
                      {socketId === currentUserSocketId && (
                        <span className="you-indicator" title="You">
                          👤
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-users">No participants yet</p>
            )}
          </div>

          {files.length > 0 && (
            <div className="file-status">
              <h4>File Sharing Status</h4>
              <p>{isUploading ? "Sharing files..." : connected ? "Files will be shared automatically" : "Connect to share files"}</p>
              <p className="file-count">{files.length} file(s) ready to share</p>
            </div>
          )}

          <div className="voice-chat-footer">
            <div className="connection-instructions">
              <h5>How to join:</h5>
              <ol>
                <li>Edit your display name (optional)</li>
                <li>Click "Connect" to join the voice chat</li>
                <li>Allow microphone access when prompted</li>
                <li>Click "Mic On" to start speaking</li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceChat;
