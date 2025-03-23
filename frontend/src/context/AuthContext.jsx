import React, { createContext, useState, useEffect } from 'react';
import createAuth0Client from '@auth0/auth0-spa-js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  const loginWithRedirect = async () => {
    const auth0Client = await createAuth0Client({
      domain: import.meta.env.VITE_DOMAIN,
      clientId: import.meta.env.VITE_CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    });

    await auth0Client.loginWithRedirect();
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const auth0Client = await createAuth0Client({
          domain: import.meta.env.VITE_DOMAIN,
          clientId: import.meta.env.VITE_CLIENT_ID,
          authorizationParams: {
            redirect_uri: window.location.origin,
          },
        });

        const isAuthenticated = await auth0Client.isAuthenticated();

        if (isAuthenticated) {
          const userProfile = await auth0Client.getUser();
          setUser(userProfile);
          setUserAvatar(userProfile.picture);
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
