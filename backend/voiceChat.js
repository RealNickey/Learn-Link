const socketIo = require('socket.io');

// Setup voice chat functionality
function setupVoiceChat(server) {
  // Store connected users and their status
  const socketsStatus = {};
  
  // Initialize socket.io with CORS settings
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // Your frontend URL
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    }
  });

  // Handle socket connections
  io.on("connection", function (socket) {
    const socketId = socket.id;
    socketsStatus[socketId] = {};
    
    console.log(`[Voice Chat] New connection: ${socketId}`);

    // Handle voice data transmission
    socket.on("voice", function (data) {
      // Process audio data
      let newData = data.split(";");
      newData[0] = "data:audio/ogg;";
      newData = newData[0] + newData[1];

      // Broadcast to other users who are online and not muted
      for (const id in socketsStatus) {
        if (id !== socketId && 
            !socketsStatus[id].mute && 
            socketsStatus[id].online) {
          socket.broadcast.to(id).emit("send", newData);
        }
      }
    });

    // Handle user status updates
    socket.on("userInformation", function (data) {
      socketsStatus[socketId] = data;
      console.log(`[Voice Chat] User updated: ${data.username} (mic: ${data.microphone}, mute: ${data.mute}, online: ${data.online})`);
      io.sockets.emit("usersUpdate", socketsStatus);
    });

    // Handle disconnection
    socket.on("disconnect", function () {
      console.log(`[Voice Chat] Disconnected: ${socketId}`);
      delete socketsStatus[socketId];
      io.sockets.emit("usersUpdate", socketsStatus);
    });
  });

  return io;
}

module.exports = setupVoiceChat;
