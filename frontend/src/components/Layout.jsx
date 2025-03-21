import React from 'react';
import ParticipantPanel from './ui/ParticipantPanel';
import { useAuth } from '../context/AuthContext'; // Adjust the import path based on your authentication setup

const Layout = ({ children }) => {
  const { user } = useAuth(); // Get the authenticated user from your auth context

  return (
    <div className="layout-container">
      {/* Main content */}
      <main>
        {children}
      </main>
      
      {/* Voice chat component in top right */}
      {user && <ParticipantPanel user={user} />}
    </div>
  );
};

export default Layout;
