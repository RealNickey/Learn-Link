import React from 'react';
import ParticipantList from './ParticipantList';
import './ParticipantPanel.css';

const ParticipantPanel = () => {
  return (
    <div className="dashboard-panel">
      <h2>Participants</h2>
      <ParticipantList />
    </div>
  );
};

export default ParticipantPanel;
