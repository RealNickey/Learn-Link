import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './styles/main.css';
import './styles/dashboard.css';
import App from './App';

const root = createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain={import.meta.env.VITE_DOMAIN}
    clientId={import.meta.env.VITE_CLIENT_ID}
    cacheLocation="localstorage" // Use local storage to persist the user's session
    authorizationParams={{
      redirect_uri: window.location.origin + '/dashboard', // Ensure this matches the allowed callback URLs
    }}
    onRedirectCallback={(appState) => {
      window.history.replaceState(
        {},
        document.title,
        appState?.returnTo || window.location.pathname
      );
    }}
    onError={(error) => {
      console.error('Auth0 error:', error);
    }}
  >
    <App />
  </Auth0Provider>,
);
