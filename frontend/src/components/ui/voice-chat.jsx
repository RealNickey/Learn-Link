import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Button } from "./button";
import "./../../styles/voice-chat.css";

const VoiceChat = ({ user }) => {
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [users, setUsers] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [customUsername, setCustomUsername] = useState("");
  const [editingName, setEditingName] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

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

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    socketRef.current = io(apiUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false, // Don't connect automatically
    });

    // Socket connection events
    socketRef.current.on("connect", () => {
      setConnectionStatus("connected");
      console.log("Connected to voice chat server!");

      // Send user information upon connection
      socketRef.current.emit("userInformation", userStatus.current);
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
