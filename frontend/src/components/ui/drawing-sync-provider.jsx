import { useCallback, useEffect, useState } from 'react';
import { track } from '@tldraw/tldraw';
import io from 'socket.io-client';

export function DrawingSyncProvider({ roomId, editor, user }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!editor || !roomId) return;

    const socket = io('/drawing-sync', {
      query: { roomId },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Drawing sync connected');
      socket.emit('join-room', { roomId, username: user?.name || 'Anonymous' });
    });

    socket.on('initialState', (state) => {
      if (state) editor.store.loadSnapshot(state);
    });

    socket.on('drawing-update', (update) => {
      editor.store.applyPatch(update);
    });

    socket.on('cursor-update', (cursor) => {
      editor.updateInstancePresence({ cursor });
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [editor, roomId, user]);

  const handleStoreChange = useCallback(
    track((update) => {
      if (!socket?.connected) return;
      socket.emit('drawing-update', update);
    }),
    [socket]
  );

  useEffect(() => {
    if (!editor || !socket) return;

    const unsubscribe = editor.store.listen(handleStoreChange);
    return () => unsubscribe();
  }, [editor, socket, handleStoreChange]);

  return null;
}
