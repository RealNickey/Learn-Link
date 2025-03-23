import React, { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { IconMicrophone, IconMicrophoneOff } from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";

export const AudioRecorder = ({ socket, user }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const mediaRecorder = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Clean up function to stop media tracks
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      const recorder = new MediaRecorder(audioStream);
      mediaRecorder.current = recorder;
      
      recorder.ondataavailable = (e) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (socket) {
            socket.emit("voice", reader.result);
          }
        };
        reader.readAsDataURL(e.data);
      };

      recorder.start(100);
      setIsRecording(true);

      toast({
        title: "Microphone active",
        description: "Others can now hear you",
      });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && stream) {
      mediaRecorder.current.stop();
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);

      toast({
        title: "Microphone inactive",
        description: "Your microphone is now muted",
      });
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <Button
      onClick={toggleRecording}
      variant={isRecording ? "destructive" : "secondary"}
      size="icon"
      className="rounded-full h-12 w-12"
    >
      {isRecording ? (
        <IconMicrophoneOff className="h-6 w-6" />
      ) : (
        <IconMicrophone className="h-6 w-6" />
      )}
    </Button>
  );
};