import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css'
import App from './App';

const root = createRoot(document.getElementById('root'));

root.render(
  <Auth0Provider
    domain={import.meta.env.VITE_DOMAIN}
    clientId={import.meta.env.VITE_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin + '/dashboard',
    }}
  >
    <App />
  </Auth0Provider>,
);
