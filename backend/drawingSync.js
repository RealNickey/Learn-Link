const { TLStore } = require('@tldraw/tldraw');

function setupDrawingSync(io) {
  const rooms = new Map();

  const drawingSpace = io.of('/drawing-sync');

  drawingSpace.on('connection', (socket) => {
    let currentRoom = null;

    socket.on('join-room', ({ roomId, username }) => {
      currentRoom = roomId;
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          store: new TLStore(),
          users: new Map(),
        });
      }

      const room = rooms.get(roomId);
      room.users.set(socket.id, { username });

      // Send initial state to the new user
      socket.emit('initialState', room.store.getSnapshot());
      
      // Broadcast user joined
      socket.to(roomId).emit('user-joined', { id: socket.id, username });
    });

    socket.on('drawing-update', (update) => {
      if (!currentRoom) return;
      
      const room = rooms.get(currentRoom);
      if (!room) return;

      room.store.applyPatch(update);
      socket.to(currentRoom).emit('drawing-update', update);
    });

    socket.on('cursor-update', (cursor) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('cursor-update', {
        id: socket.id,
        cursor,
      });
    });

    socket.on('disconnect', () => {
      if (currentRoom) {
        const room = rooms.get(currentRoom);
        if (room) {
          room.users.delete(socket.id);
          socket.to(currentRoom).emit('user-left', socket.id);
          
          if (room.users.size === 0) {
            rooms.delete(currentRoom);
          }
        }
      }
    });
  });

  return drawingSpace;
}

module.exports = setupDrawingSync;
