import React, { useEffect, useState, useRef } from 'react';
import AblySpaces from '@ably/spaces';
import * as Ably from 'ably';

const LiveCursor = ({ containerId = 'dashboard-container', username = 'Anonymous' }) => {
  const [cursors, setCursors] = useState({});
  const clientRef = useRef(null);
  const spaceRef = useRef(null);
  const lastUpdateRef = useRef({});

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

        // Subscribe to cursor updates with timestamp tracking
        space.cursors.subscribe('update', (cursorUpdate) => {
          const now = Date.now();
          lastUpdateRef.current[cursorUpdate.connectionId] = now;

          setCursors(prev => ({
            ...prev,
            [cursorUpdate.connectionId]: {
              ...cursorUpdate,
              lastUpdate: now
            }
          }));
        });

        // Handle cursor cleanup
        space.cursors.subscribe('leave', (member) => {
          console.log('Member left:', member);
          setCursors(prev => {
            const newCursors = { ...prev };
            delete newCursors[member.connectionId];
            return newCursors;
          });
        });

        // Clean up stale cursors every 5 seconds
        const cleanupInterval = setInterval(() => {
          const now = Date.now();
          setCursors(prev => {
            const newCursors = { ...prev };
            Object.entries(newCursors).forEach(([id, cursor]) => {
              if (now - cursor.lastUpdate > 5000) { // Remove cursors older than 5 seconds
                delete newCursors[id];
              }
            });
            return newCursors;
          });
        }, 5000);

        // Handle window resize
        const handleResize = () => {
          // Clear all cursors on resize to prevent position mismatches
          setCursors({});
        };

        window.addEventListener('resize', handleResize);
        
        // Handle visibility change
        const handleVisibilityChange = () => {
          if (document.hidden) {
            // Clear cursors when tab becomes inactive
            setCursors({});
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Track user's cursor with debouncing
        let timeoutId;
        const handleMouseMove = (event) => {
          if (!spaceRef.current || document.hidden) return;

          const { clientX, clientY } = event;
          const container = document.getElementById(containerId);
          const boundingBox = container?.getBoundingClientRect();
          
          if (!boundingBox) return;

          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            const x = (clientX - boundingBox.left) / boundingBox.width;
            const y = (clientY - boundingBox.top) / boundingBox.height;

            // Send cursor position as percentage values
            spaceRef.current.cursors.set({
              position: { x, y },
              data: { 
                color: '#FF5733',
                containerId,
                username,
                timestamp: Date.now()
              }
            }).catch(console.error);
          }, 16); // ~60fps throttling
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('resize', handleResize);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          clearTimeout(timeoutId);
          clearInterval(cleanupInterval);
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
  }, [containerId, username]);

  return (
    <>
      {Object.values(cursors).map((cursor) => {
        if (!cursor?.position || cursor?.data?.containerId !== containerId) return null;

        const container = document.getElementById(containerId);
        const boundingBox = container?.getBoundingClientRect();
        
        if (!boundingBox) return null;

        // Convert percentage values back to pixels
        const x = cursor.position.x * boundingBox.width;
        const y = cursor.position.y * boundingBox.height;

        return (
          <div
            key={cursor.connectionId}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              transition: 'all 0.1s ease',
              zIndex: 1000
            }}
          >
            <svg
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19209e-06L11.7841 12.3673H5.65376Z"
                fill={cursor.data?.color || '#FF5733'}
                stroke="white"
                strokeWidth="1"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '10px',
                background: cursor.data?.color || '#FF5733',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'white',
                whiteSpace: 'nowrap'
              }}
            >
              {cursor.data?.username || 'Anonymous'}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default LiveCursor;

