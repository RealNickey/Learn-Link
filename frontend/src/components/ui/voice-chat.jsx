import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Button } from "./button";
import "./../../styles/voice-chat.css";

const VoiceChat = ({ user, expanded, onExpand }) => {
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [users, setUsers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [customUsername, setCustomUsername] = useState("");
  const [editingName, setEditingName] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const defaultUsername =
    user?.name || user?.email || `user#${Math.floor(Math.random() * 999999)}`;

  const userStatus = useRef({
    microphone: false,
    mute: false,
    username: defaultUsername,
    online: false,
  });

  useEffect(() => {
    socketRef.current = io(apiUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false,
      transports: ["websocket", "polling"],
      timeout: 10000,
      path: "/socket.io/",
    });

    socketRef.current.on("connect", () => {
      setConnectionStatus("connected");
      console.log("Connected to voice chat server!");
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

    socketRef.current.on("usersUpdate", (data) => {
      setUsers(data);
    });

    socketRef.current.on("send", (data) => {
      if (!userStatus.current.mute) {
        const audio = new Audio(data);
        audio.play();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!editingName) {
      const newUsername = user?.name || user?.email || defaultUsername;
      userStatus.current.username = newUsername;
      setCustomUsername(newUsername);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("userInformation", userStatus.current);
      }
    }
  }, [user?.name, user?.email, defaultUsername, editingName]);

  useEffect(() => {
    if (micEnabled && connected) {
      setupAudioRecording();
    } else if (!micEnabled && mediaRecorderRef.current) {
      stopAudioRecording();
    }
  }, [micEnabled, connected]);

  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      let audioChunks = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks);
        audioChunks = [];

        const fileReader = new FileReader();
        fileReader.readAsDataURL(audioBlob);
        fileReader.onloadend = () => {
          if (!userStatus.current.microphone || !userStatus.current.online)
            return;

          const base64String = fileReader.result;
          socketRef.current.emit("voice", base64String);
        };

        if (micEnabled && connected) {
          mediaRecorder.start();
          setTimeout(() => {
            if (mediaRecorder.state === "recording") {
              mediaRecorder.stop();
            }
          }, 1000);
        }
      });

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

  const toggleConnection = () => {
    if (connected) {
      socketRef.current.disconnect();
      setConnected(false);
      userStatus.current.online = false;
      setMicEnabled(false);
      userStatus.current.microphone = false;
      stopAudioRecording();
    } else {
      socketRef.current.connect();
      setConnected(true);
      userStatus.current.online = true;
      socketRef.current.emit("userInformation", userStatus.current);
    }
  };

  const toggleMicrophone = () => {
    if (!connected) return;

    const newMicEnabled = !micEnabled;
    setMicEnabled(newMicEnabled);

    userStatus.current.microphone = newMicEnabled;
    socketRef.current.emit("userInformation", userStatus.current);
  };

  const toggleMute = () => {
    if (!connected) return;

    const newMuted = !muted;
    setMuted(newMuted);

    userStatus.current.mute = newMuted;
    socketRef.current.emit("userInformation", userStatus.current);
  };

  const handleUsernameChange = (e) => {
    setCustomUsername(e.target.value);
  };

  const saveUsername = () => {
    if (customUsername.trim()) {
      userStatus.current.username = customUsername.trim();
      if (connected) {
        socketRef.current.emit("userInformation", userStatus.current);
      }
      setEditingName(false);
    }
  };

  const onlineUsersCount = Object.values(users).filter(
    (user) => user.online
  ).length;

  const isUserListed = Object.values(users).some(
    (u) => u.username === userStatus.current.username
  );

  const currentUserSocketId = Object.keys(users).find(
    (key) => users[key].username === userStatus.current.username
  );

  return (
    <div className={`voice-chat-container ${expanded ? "expanded" : "collapsed"}`}>
      <div className="voice-chat-header" onClick={() => onExpand(!expanded)}>
        <h3>Voice Chat {connected ? "🟢" : "🔴"}</h3>
        <div className="online-indicator">
          {/* {onlineUsersCount} online {expanded ? "▼" : "▲"} ▼,▲ up and down pointing 
          triangle replace with empty text */}
          {onlineUsersCount} online {expanded ? "‎ " : "‎ "} 
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
                <span className="edit-icon">ㅤ</span>
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
