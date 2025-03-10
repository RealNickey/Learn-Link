import React from 'react';
import PropTypes from 'prop-types';
import { avatars } from '../assets/avatars';

const ParticipantItem = ({ participant }) => {
  return (
    <div className="participant-item">
      <img 
        src={participant.avatar || avatars[0].url} 
        alt={`${participant.name}'s profile`} 
        className="participant-photo" 
      />
      <span className="participant-name">{participant.name}</span>
      <span className={`participant-status ${participant.isOnline ? 'online' : 'offline'}`}>
        {participant.isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};

ParticipantItem.propTypes = {
  participant: PropTypes.shape({
    name: PropTypes.string.isRequired,
    isOnline: PropTypes.bool.isRequired,
    avatar: PropTypes.string,
  }).isRequired,
};

export default ParticipantItem;