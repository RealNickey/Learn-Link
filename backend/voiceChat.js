const socketIo = require('socket.io');

// Setup voice chat functionality
function setupVoiceChat(server) {
  // Store connected users and their status
  const socketsStatus = {};
  
  // Initialize socket.io with CORS settings
  const io = socketIo(server, {
    cors: {
      origin: "http://localhost:5173", // Your frontend URL
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    }
  });

  // Create a namespace for voice chat
  const voiceChat = io.of('/voice-chat');

  // Print server information on startup
  console.log('[Voice Chat] Server initialized');
  console.log('[Voice Chat] Users can connect to ws://localhost:3000');

  // Handle socket connections
  io.on("connection", function (socket) {
    const socketId = socket.id;
    socketsStatus[socketId] = {
      username: `User ${socketId.substring(0, 5)}`,
      microphone: false,
      mute: false,
      online: true
    };
    
    console.log(`[Voice Chat] New connection: ${socketId}`);

    // Handle voice data transmission
    socket.on("voice", function (data) {
      // Process audio data
      let newData = data.split(";");
      newData[0] = "data:audio/ogg;";
      newData = newData[0] + newData[1];

      // Get user info for logging
      const username = socketsStatus[socketId]?.username || 'Unknown User';

      // Broadcast to other users who are online and not muted
      let receiverCount = 0;
      for (const id in socketsStatus) {
        if (id !== socketId && 
            !socketsStatus[id].mute && 
            socketsStatus[id].online) {
          socket.broadcast.to(id).emit("send", newData);
          receiverCount++;
        }
      }
      
      // Log transmission (but not too frequently)
      if (Math.random() < 0.01) { // Log only 1% of transmissions to avoid spam
        console.log(`[Voice Chat] ${username} speaking to ${receiverCount} users`);
      }
    });

    // Handle user status updates
    socket.on("userInformation", function (data) {
      // Store previous state to detect changes
      const previousState = {...(socketsStatus[socketId] || {})};
      
      // Update user information
      socketsStatus[socketId] = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      // Log status changes
      if (previousState.username !== data.username) {
        console.log(`[Voice Chat] User renamed: ${previousState.username || 'New user'} → ${data.username}`);
      }
      
      if (previousState.online !== data.online) {
        console.log(`[Voice Chat] User ${data.username} is now ${data.online ? 'online' : 'offline'}`);
      }
      
      if (previousState.microphone !== data.microphone) {
        console.log(`[Voice Chat] User ${data.username} microphone is now ${data.microphone ? 'on' : 'off'}`);
      }
      
      // Send updated user list to all clients
      io.sockets.emit("usersUpdate", socketsStatus);
    });

    // Handle disconnection
    socket.on("disconnect", function () {
      const username = socketsStatus[socketId]?.username || 'Unknown User';
      console.log(`[Voice Chat] Disconnected: ${username} (${socketId})`);
      
      delete socketsStatus[socketId];
      io.sockets.emit("usersUpdate", socketsStatus);
    });
  });

  return io;
}

module.exports = setupVoiceChat;
