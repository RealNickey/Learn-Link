import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import './styles/dashboard.css';

const Profile = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth0();

  console.log("isLoading:", isLoading);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("error:", error);

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    isAuthenticated && (
      <div className="dashboard-container">
        <div className="section div1">
          <div className="user-info">
            <img className="profile-image" src={user.picture} alt={user.name} />
            <h2 className="user-name">{user.name}</h2>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
        <div className="section div2">
          <h2>Section 2</h2>
          <p>Content for section 2</p>
        </div>
        <div className="section div3">
          <h2>Section 3</h2>
          <p>Content for section 3</p>
        </div>
        <div className="section div4">
          <h2>Section 4</h2>
          <p>Content for section 4</p>
        </div>
        <div className="section div5">
          <h2>Section 5</h2>
          <p>Content for section 5</p>
        </div>
        <div className="section div6">
          <h2>Section 6</h2>
          <p>Content for section 6</p>
        </div>
        <div className="section div7">
          <h2>Section 7</h2>
          <p>Content for section 7</p>
        </div>
      </div>
    )
  );
};

export default Profile;