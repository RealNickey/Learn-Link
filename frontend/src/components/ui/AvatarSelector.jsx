import React from 'react';
import { avatars } from '../../assets/avatars';

const AvatarSelector = ({ selectedAvatar, onSelect, onClose }) => {
  return (
    <div className="avatar-selector">
      <div className="avatar-selector-header">
        <h4>Select Avatar</h4>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="avatar-grid">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className={`avatar-option ${selectedAvatar === avatar.url ? 'selected' : ''}`}
            onClick={() => onSelect(avatar.url)}
          >
            <img src={avatar.url} alt={avatar.name} />
            <span>{avatar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvatarSelector;
