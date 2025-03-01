import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Button } from './button';
import './../../styles/voice-chat.css';

const VoiceChat = ({ user }) => {
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [users, setUsers] = useState({});
  const [expanded, setExpanded] = useState(false);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const userStatus = useRef({
    microphone: false,
    mute: false,
    username: user?.name || user?.email || `user#${Math.floor(Math.random() * 999999)}`,
    online: false,
  });

  // Initialize socket connection and audio processing
  useEffect(() => {
    // Connect to socket server
    socketRef.current = io("ws://localhost:3000");

    // Send initial user information
    socketRef.current.emit("userInformation", userStatus.current);

    // Listen for user updates
    socketRef.current.on("usersUpdate", (data) => {
      setUsers(data);
    });

    // Listen for incoming audio
    socketRef.current.on("send", (data) => {
      const audio = new Audio(data);
      audio.play();
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [user?.name, user?.email]);

  // Setup audio recording
  useEffect(() => {
    if (micEnabled && connected) {
      setupAudioRecording();
    }
  }, [micEnabled, connected]);

  // Setup audio recording and transmission
  const setupAudioRecording = async () => {
    try {
      // Get user media
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
          if (!userStatus.current.microphone || !userStatus.current.online) return;
          
          const base64String = fileReader.result;
          socketRef.current.emit("voice", base64String);
        };
        
        // Restart recording
        if (micEnabled && connected) {
          mediaRecorder.start();
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 1000);
        }
      });
      
      // Start recording
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Toggle connection
  const toggleConnection = () => {
    const newConnected = !connected;
    setConnected(newConnected);
    
    userStatus.current.online = newConnected;
    socketRef.current.emit("userInformation", userStatus.current);
    
    if (!newConnected) {
      setMicEnabled(false);
      stopAudioRecording();
      userStatus.current.microphone = false;
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (!connected) return;
    
    const newMicEnabled = !micEnabled;
    setMicEnabled(newMicEnabled);
    
    userStatus.current.microphone = newMicEnabled;
    socketRef.current.emit("userInformation", userStatus.current);
    
    if (!newMicEnabled) {
      stopAudioRecording();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!connected) return;
    
    const newMuted = !muted;
    setMuted(newMuted);
    
    userStatus.current.mute = newMuted;
    socketRef.current.emit("userInformation", userStatus.current);
  };

  // Count online users
  const onlineUsersCount = Object.values(users).filter(user => user.online).length;

  return (
    <div className={`voice-chat-container ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="voice-chat-header" onClick={() => setExpanded(!expanded)}>
        <h3>Voice Chat {connected ? '🟢' : '🔴'}</h3>
        <div className="online-indicator">
          {onlineUsersCount} online {expanded ? '▼' : '▲'}
        </div>
      </div>
      
      {expanded && (
        <>
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
            <ul>
              {Object.values(users).map((user, index) => (
                <li key={index} className={user.online ? 'online' : 'offline'}>
                  {user.username} 
                  {user.microphone && user.online && <span className="mic-icon">🎤</span>}
                  {user.mute && user.online && <span className="mute-icon">🔇</span>}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default VoiceChat;
