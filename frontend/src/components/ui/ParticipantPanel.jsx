import React from 'react';
import VoiceChat from './voice-chat';
import './ParticipantPanel.css';

const ParticipantPanel = ({ user }) => {
  return (
    <div className="voice-chat-wrapper">
      <VoiceChat user={user} />
    </div>
  );
};

export default ParticipantPanel;
