import { useCallback, useEffect, useState, useRef } from 'react';
import { track } from '@tldraw/tldraw';
import io from 'socket.io-client';

export function DrawingSyncProvider({ roomId, editor, user }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!editor || !roomId) return;

    // Use the full URL to connect to the WebSocket server
    const socketUrl = window.location.origin;
    socketRef.current = io(`${socketUrl}/drawing-sync`, {
      query: { roomId },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Drawing] Connected to sync server');
      setIsConnected(true);
      
      // Join room with user info
      socket.emit('join-room', { 
        roomId,
        username: user?.name || 'Anonymous',
        userId: user?.sub || 'anonymous'
      });

      // Request initial state
      socket.emit('request-state', { roomId });
    });

    socket.on('connect_error', (error) => {
      console.error('[Drawing] Connection error:', error);
      setIsConnected(false);
    });

    socket.on('initialState', (state) => {
      if (state && editor) {
        console.log('[Drawing] Received initial state');
        editor.store.loadSnapshot(state);
      }
    });

    socket.on('drawing-update', (update) => {
      if (editor && update) {
        console.log('[Drawing] Received update');
        editor.store.applyPatch(update);
      }
    });

    // Handle presence updates
    const interval = setInterval(() => {
      if (socket.connected && editor) {
        const presence = {
          cursor: editor.inputs.currentScreenPoint,
          selection: editor.selectedShapeIds,
          userName: user?.name || 'Anonymous',
        };
        socket.emit('presence', presence);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [editor, roomId, user]);

  // Send updates when the drawing changes
  useEffect(() => {
    if (!editor || !socketRef.current) return;

    const handleChange = (update) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit('drawing-update', update);
    };

    const unsubscribe = editor.store.listen(handleChange);
    return () => unsubscribe();
  }, [editor]);

  return null;
}
