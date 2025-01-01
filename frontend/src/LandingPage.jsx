import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "./styles/LandingPage.css";

const LandingPage = () => {
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    document.body.classList.add("landing-page-body");
    return () => {
      document.body.classList.remove("landing-page-body");
    };
  }, []);

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