const socketIo = require("socket.io");

// Setup voice chat functionality
function setupVoiceChat(server) {
  // Store connected users and their status
  const socketsStatus = {};
  // Store shared files
  const sharedFiles = [];

  // Initialize socket.io with CORS settings
  const io = socketIo(server, {
    cors: {
      origin: "*", // Allow all origins
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Origin",
        "X-Requested-With",
        "Accept",
        "Authorization",
      ],
      credentials: true,
    },
  });

  // Create a namespace for voice chat
  const voiceChat = io.of("/voice-chat");

  // Print server information on startup
  console.log("[Voice Chat] Server initialized");
  console.log("[Voice Chat] Users can connect via websockets");
  console.log("[Voice Chat] File sharing enabled");

  // Handle socket connections
  io.on("connection", function (socket) {
    const socketId = socket.id;
    socketsStatus[socketId] = {
      username: `User ${socketId.substring(0, 5)}`,
      microphone: false,
      mute: false,
      online: true,
    };

    console.log(`[Voice Chat] New connection: ${socketId}`);

    // Handle file sharing when a user connects to voice chat
    socket.on("voice-chat-connect", function (fileData) {
      if (fileData && fileData.url) {
        // Add file to shared files array
        const sharedFileData = {
          ...fileData,
          sharedBy: socketId,
          sharedByUsername: socketsStatus[socketId]?.username || "Unknown User",
          sharedAt: new Date().toISOString(),
        };

        sharedFiles.push(sharedFileData);

        console.log(
          `[Voice Chat] File shared by ${socketsStatus[socketId]?.username}: ${fileData.originalName}`
        );

        // Broadcast the file to all connected clients EXCEPT the sender
        Object.keys(socketsStatus).forEach((clientSocketId) => {
          if (clientSocketId !== socketId) {
            // Send only to other users, not back to the sender
            io.to(clientSocketId).emit("filesShared", [sharedFileData]);
          }
        });
      }
    });

    // Handle voice data transmission
    socket.on("voice", function (data) {
      // Process audio data
      let newData = data.split(";");
      newData[0] = "data:audio/ogg;";
      newData = newData[0] + newData[1];

      // Get user info for logging
      const username = socketsStatus[socketId]?.username || "Unknown User";

      // Broadcast to other users who are online and not muted
      let receiverCount = 0;
      for (const id in socketsStatus) {
        if (
          id !== socketId &&
          !socketsStatus[id].mute &&
          socketsStatus[id].online
        ) {
          socket.broadcast.to(id).emit("send", newData);
          receiverCount++;
        }
      }

      // Log transmission (but not too frequently)
      if (Math.random() < 0.01) {
        // Log only 1% of transmissions to avoid spam
        console.log(
          `[Voice Chat] ${username} speaking to ${receiverCount} users`
        );
      }
    });

    // Handle user status updates
    socket.on("userInformation", function (data) {
      // Store previous state to detect changes
      const previousState = { ...(socketsStatus[socketId] || {}) };

      // Update user information
      socketsStatus[socketId] = {
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      // Log status changes
      if (previousState.username !== data.username) {
        console.log(
          `[Voice Chat] User renamed: ${
            previousState.username || "New user"
          } → ${data.username}`
        );
      }

      if (previousState.online !== data.online) {
        console.log(
          `[Voice Chat] User ${data.username} is now ${
            data.online ? "online" : "offline"
          }`
        );
      }

      if (previousState.microphone !== data.microphone) {
        console.log(
          `[Voice Chat] User ${data.username} microphone is now ${
            data.microphone ? "on" : "off"
          }`
        );
      }

      // Send updated user list to all clients
      io.sockets.emit("usersUpdate", socketsStatus);
    });

    // Handle disconnection
    socket.on("disconnect", function () {
      const username = socketsStatus[socketId]?.username || "Unknown User";
      console.log(`[Voice Chat] Disconnected: ${username} (${socketId})`);

      delete socketsStatus[socketId];
      io.sockets.emit("usersUpdate", socketsStatus);
    });
  });

  return io;
}

module.exports = setupVoiceChat;
