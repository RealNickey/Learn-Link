import React, { useEffect, useState, useRef } from 'react';
import AblySpaces from '@ably/spaces';
import * as Ably from 'ably';

const CursorUtils = {
  // Convert absolute coordinates to relative (0-1) coordinates
  toRelativePosition: (x, y, container) => {
    const rect = container.getBoundingClientRect();
    return {
      x: x / rect.width,
      y: y / rect.height
    };
  },

  // Convert relative coordinates back to absolute for the current screen
  toAbsolutePosition: (relX, relY, container) => {
    const rect = container.getBoundingClientRect();
    const zoom = window.visualViewport?.scale || 1;
    const dpr = window.devicePixelRatio || 1;

    return {
      x: relX * rect.width * zoom / dpr,
      y: relY * rect.height * zoom / dpr
    };
  }
};

const LiveCursor = ({ containerId = 'dashboard-container', username = 'Anonymous' }) => {
  const [cursors, setCursors] = useState({});
  const clientRef = useRef(null);
  const spaceRef = useRef(null);
  const containerRef = useRef(null);

  // Track window resize for cursor position updates
  useEffect(() => {
    const updateCursorPositions = () => {
      if (!containerRef.current) return;

      setCursors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key].position) {
            const abs = CursorUtils.toAbsolutePosition(
              updated[key].position.relX,
              updated[key].position.relY,
              containerRef.current
            );
            updated[key].screenPosition = abs;
          }
        });
        return updated;
      });
    };

    const debouncedUpdate = debounce(updateCursorPositions, 100);
    window.addEventListener('resize', debouncedUpdate);
    return () => window.removeEventListener('resize', debouncedUpdate);
  }, []);

  useEffect(() => {
    containerRef.current = document.getElementById(containerId);
    if (!containerRef.current) return;

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
          if (!containerRef.current) return;

          const absolutePos = cursorUpdate.position ? 
            CursorUtils.toAbsolutePosition(
              cursorUpdate.position.relX,
              cursorUpdate.position.relY,
              containerRef.current
            ) : null;

          setCursors(prev => ({
            ...prev,
            [cursorUpdate.connectionId]: {
              ...cursorUpdate,
              screenPosition: absolutePos
            }
          }));
        });

        // Track user's cursor with debouncing
        let timeoutId;
        const handleMouseMove = (event) => {
          if (!spaceRef.current || !containerRef.current) return;

          const { clientX, clientY } = event;
          const container = containerRef.current;
          const boundingBox = container.getBoundingClientRect();
          
          if (!boundingBox) return;

          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            // Calculate relative position (0-1)
            const x = clientX - boundingBox.left;
            const y = clientY - boundingBox.top;
            const relativePos = CursorUtils.toRelativePosition(x, y, container);

            // Send normalized coordinates
            spaceRef.current.cursors.set({
              position: {
                relX: relativePos.x,
                relY: relativePos.y,
                timestamp: Date.now()
              },
              data: { 
                color: '#FF5733',
                containerId,
                username
              }
            }).catch(console.error);
          }, 16); // ~60fps
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
  }, [containerId, username]); // Add username to dependency array

  return (
    <>
      {Object.values(cursors).map((cursor) => (
        cursor?.screenPosition && cursor?.data?.containerId === containerId && (
          <div
            key={cursor.connectionId}
            style={{
              position: 'fixed',
              left: cursor.screenPosition.x,
              top: cursor.screenPosition.y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              transition: 'transform 0.1s ease, left 0.1s ease, top 0.1s ease',
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
        )
      ))}
    </>
  );
};

// Utility function for debouncing
const debounce = (fn, ms) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
};

export default LiveCursor;

