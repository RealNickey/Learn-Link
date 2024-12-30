import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import './styles/dashboard.css';

const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated && (
      <div className="dashboard-container">
        <div className="user-info">
          <img className="profile-image" src={user.picture} alt={user.name} />
          <h2 className="user-name">{user.name}</h2>
          <p className="user-email">{user.email}</p>
        </div>
      </div>
    )
  );
};

export default Profile;