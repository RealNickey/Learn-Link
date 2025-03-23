import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
// ...existing imports...

const VoiceChat = ({ roomId, ...props }) => {
  const { user, userAvatar } = useContext(AuthContext);
  // ...existing code...
  
  // State to track all participants and their avatars
  const [participants, setParticipants] = useState([]);
  
  // Update participant list when someone joins/leaves
  useEffect(() => {
    // ...existing code for voice chat...
    
    // When initializing your voice chat connection, send the avatar URL
    const connectToVoiceChat = async () => {
      // Example using a hypothetical voice chat service
      try {
        await voiceChatService.connect({
          roomId,
          userId: user?.sub || user?.id,
          userName: user?.name || user?.email,
          userAvatar: userAvatar // Pass the avatar URL
        });
        
        // Setup listeners for participants joining/leaving
        voiceChatService.onParticipantJoined((participant) => {
          setParticipants(prev => [...prev, participant]);
        });
        
        voiceChatService.onParticipantLeft((participantId) => {
          setParticipants(prev => prev.filter(p => p.id !== participantId));
        });
      } catch (error) {
        console.error("Error connecting to voice chat:", error);
      }
    };
    
    if (user) {
      connectToVoiceChat();
    }
    
    // Cleanup function
    return () => {
      // Disconnect from voice chat when component unmounts
      voiceChatService.disconnect();
    };
  }, [roomId, user, userAvatar]);

  return (
    <div className="voice-chat-container">
      <h3>Voice Chat</h3>
      <div className="participants-list">
        {/* Show current user */}
        <div className="participant">
          <div className="avatar-container">
            {userAvatar ? (
              <img src={userAvatar} alt="Your avatar" className="user-avatar" />
            ) : (
              <div className="default-avatar">{user?.name?.[0] || user?.email?.[0]}</div>
            )}
            <span className="speaking-indicator me"></span>
          </div>
          <div className="participant-name">You</div>
        </div>
        
        {/* Show other participants */}
        {participants.map(participant => (
          <div key={participant.id} className="participant">
            <div className="avatar-container">
              {participant.avatar ? (
                <img src={participant.avatar} alt={`${participant.name}'s avatar`} className="user-avatar" />
              ) : (
                <div className="default-avatar">{participant.name[0]}</div>
              )}
              {participant.isSpeaking && <span className="speaking-indicator"></span>}
            </div>
            <div className="participant-name">{participant.name}</div>
          </div>
        ))}
      </div>
      
      {/* Voice controls */}
      <div className="voice-controls">
        {/* Mute/unmute button, etc. */}
      </div>
    </div>
  );
};

export default VoiceChat;
