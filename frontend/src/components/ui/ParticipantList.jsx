import React, { useEffect, useState } from 'react';
import ParticipantItem from '../ParticipantItem';
import './ParticipantPanel.css';

const ParticipantList = () => {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await fetch('/api/participants'); // Adjust the API endpoint as needed
        const data = await response.json();
        setParticipants(data);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();
  }, []);

  return (
    <div className="participant-list">
      {participants.map((participant) => (
        <ParticipantItem key={participant.id} participant={participant} />
      ))}
    </div>
  );
};

export default ParticipantList;