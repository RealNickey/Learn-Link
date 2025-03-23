import React from 'react';
import TopRightSection from './ui/TopRightSection';
import { useAuth } from '../context/AuthContext'; // Ensure this path is correct

const Layout = ({ children }) => {
  const { user } = useAuth(); // Get the authenticated user from your auth context

  return (
    <div className="layout-container">
      {/* Main content */}
      <main>
        {children}
      </main>
      
      {/* Empty top right section */}
      <TopRightSection />
    </div>
  );
};

export default Layout;
