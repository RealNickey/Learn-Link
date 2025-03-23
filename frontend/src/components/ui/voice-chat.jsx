import React, { useContext, useEffect, useState } from "react";
import { AudioRecorder } from "./audio-recorder";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import "../../styles/voice-chat.css";

const AudioContext = React.createContext();

const VoiceChat = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ["websocket", "polling"],
      timeout: 10000,
      path: "/socket.io/",
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Voice chat connected!");
      setVoiceConnected(true);
      socketInstance.emit("voiceConnected"); // Notify server of voice connection
      toast({
        title: "Voice Chat Connected",
        description: "You can now share files with other participants",
      });
    });

    socketInstance.on("disconnect", () => {
      setVoiceConnected(false);
      toast({
        title: "Voice Chat Disconnected",
        description: "Reconnecting...",
        variant: "destructive",
      });
    });

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [toast]);

  return (
    <AudioContext.Provider value={{ socket, voiceConnected }}>
      <div className="voice-chat">
        <AudioRecorder socket={socket} user={user} />
      </div>
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioContext must be used within an AudioContext.Provider");
  }
  return context;
};

export default VoiceChat;
