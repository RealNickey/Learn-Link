import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

const LandingPage = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="landing-page">
      <h1>Welcome to Learn-Link</h1>
      <p>Your one-stop solution for learning and collaboration.</p>
      <div>
        <button onClick={() => loginWithRedirect()} className="get-started-button">
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
