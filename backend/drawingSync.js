const { TLStore } = require('@tldraw/tldraw');

function setupDrawingSync(io) {
  const rooms = new Map();
  const drawingSpace = io.of('/drawing-sync');

  // Add middleware for logging
  drawingSpace.use((socket, next) => {
    console.log('[Drawing] New connection attempt');
    const roomId = socket.handshake.query.roomId;
    if (!roomId) {
      return next(new Error('Room ID is required'));
    }
    socket.roomId = roomId;
    next();
  });

  drawingSpace.on('connection', (socket) => {
    console.log('[Drawing] Client connected');
    let currentRoom = socket.roomId;

    // Create or get room
    const getRoom = (roomId) => {
      if (!rooms.has(roomId)) {
        console.log('[Drawing] Creating new room:', roomId);
        rooms.set(roomId, {
          store: new TLStore(),
          users: new Map(),
          lastActivity: Date.now()
        });
      }
      return rooms.get(roomId);
    };

    socket.on('join-room', ({ roomId, username, userId }) => {
      try {
        currentRoom = roomId;
        socket.join(roomId);
        
        const room = getRoom(roomId);
        room.users.set(socket.id, { username, userId });
        room.lastActivity = Date.now();

        console.log(`[Drawing] ${username} joined room ${roomId}`);
        
        // Send current state
        socket.emit('initialState', room.store.getSnapshot());
        
        // Notify others
        socket.to(roomId).emit('user-joined', {
          id: socket.id,
          username,
          userId
        });
      } catch (error) {
        console.error('[Drawing] Error in join-room:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('request-state', ({ roomId }) => {
      try {
        const room = rooms.get(roomId);
        if (room) {
          socket.emit('initialState', room.store.getSnapshot());
        }
      } catch (error) {
        console.error('[Drawing] Error sending initial state:', error);
      }
    });

    socket.on('drawing-update', (update) => {
      try {
        if (!currentRoom) return;
        
        const room = rooms.get(currentRoom);
        if (!room) return;

        room.lastActivity = Date.now();
        room.store.applyPatch(update);
        
        // Broadcast to others in the room
        socket.to(currentRoom).emit('drawing-update', update);
      } catch (error) {
        console.error('[Drawing] Error processing update:', error);
      }
    });

    socket.on('presence', (presence) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('presence-update', {
        id: socket.id,
        presence
      });
    });

    socket.on('disconnect', () => {
      try {
        if (currentRoom) {
          const room = rooms.get(currentRoom);
          if (room) {
            room.users.delete(socket.id);
            socket.to(currentRoom).emit('user-left', socket.id);
            
            // Clean up empty rooms
            if (room.users.size === 0) {
              console.log('[Drawing] Removing empty room:', currentRoom);
              rooms.delete(currentRoom);
            }
          }
        }
      } catch (error) {
        console.error('[Drawing] Error handling disconnect:', error);
      }
    });
  });

  // Clean up inactive rooms periodically
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (now - room.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
        console.log('[Drawing] Removing inactive room:', roomId);
        rooms.delete(roomId);
      }
    }
  }, 60 * 60 * 1000); // Check every hour

  return drawingSpace;
}

module.exports = setupDrawingSync;
