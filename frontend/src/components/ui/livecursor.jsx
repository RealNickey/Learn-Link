import React, { useEffect, useState, useRef } from 'react';
import AblySpaces from '@ably/spaces';
import * as Ably from 'ably';

const LiveCursor = ({ containerId = 'dashboard-container' }) => {
  const [cursors, setCursors] = useState({});
  const clientRef = useRef(null);
  const spaceRef = useRef(null);

  useEffect(() => {
    const setupAbly = async () => {
      try {
        // Initialize Ably client with proper configuration
        clientRef.current = new Ably.Realtime({
          key: import.meta.env.VITE_ABLY_KEY,
          clientId: `user-${Math.random().toString(36).substr(2, 9)}`,
          echoMessages: false,
          recoveryKey: null
        });

        // Wait for connection to be established
        await new Promise((resolve, reject) => {
          clientRef.current.connection.once('connected', resolve);
          clientRef.current.connection.once('failed', reject);
        });

        console.log('Ably connected successfully');

        // Initialize Spaces
        const spaces = new AblySpaces(clientRef.current);
        const space = await spaces.get('learn-link-space');
        spaceRef.current = space;

        await space.enter();
        console.log('Entered space successfully');

        // Subscribe to cursor updates
        space.cursors.subscribe('update', (cursorUpdate) => {
          console.log('Cursor update received:', cursorUpdate);
          setCursors(prev => ({
            ...prev,
            [cursorUpdate.connectionId]: cursorUpdate
          }));
        });

        // Track user's cursor with debouncing
        let timeoutId;
        const handleMouseMove = (event) => {
          if (!spaceRef.current) return;

          const { clientX, clientY } = event;
          const container = document.getElementById(containerId);
          const boundingBox = container?.getBoundingClientRect();
          
          if (!boundingBox) return;

          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            const x = clientX - boundingBox.left;
            const y = clientY - boundingBox.top;

            // Send cursor position relative to container
            spaceRef.current.cursors.set({
              position: { x, y },
              data: { 
                color: '#FF5733',
                containerId 
              }
            }).catch(console.error);
          }, 0);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          clearTimeout(timeoutId);
          if (spaceRef.current) {
            spaceRef.current.cursors.unsubscribe();
            spaceRef.current.leave();
          }
        };
      } catch (error) {
        console.error('Error setting up Ably:', error);
      }
    };

    setupAbly();

    return () => {
      if (clientRef.current) {
        clientRef.current.close();
      }
    };
  }, [containerId]);

  return (
    <>
      {Object.values(cursors).map((cursor) => (
        cursor?.position && cursor?.data?.containerId === containerId && (
          <div
            key={cursor.connectionId}
            style={{
              position: 'fixed',
              left: cursor.position.x,
              top: cursor.position.y,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: cursor.data?.color || '#FF5733',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              transition: 'all 0.1s ease',
              zIndex: 1000
            }}
          />
        )
      ))}
    </>
  );
};

export default LiveCursor;

