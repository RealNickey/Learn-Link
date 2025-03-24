import React from "react";
import ReactDOM from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import "./styles/main.css";
import "./styles/dashboard.css";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Auth0Provider
    domain={import.meta.env.VITE_DOMAIN}
    clientId={import.meta.env.VITE_CLIENT_ID}
    cacheLocation="localstorage" // Use local storage to persist the user's session
    useRefreshTokens={true} // Use refresh tokens to maintain the session
    authorizationParams={{
      redirect_uri: window.location.origin + "/dashboard", // Ensure this matches the allowed callback URLs
    }}
    onRedirectCallback={(appState) => {
      window.history.replaceState(
        {},
        document.title,
        appState?.returnTo || window.location.pathname
      );
    }}
    onError={(error) => {
      console.error("Auth0 error:", error);
    }}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Auth0Provider>
);
