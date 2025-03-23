const socketIo = require("socket.io");

function setupVoiceChat(server) {
  const socketsStatus = {};
  const connectedUsers = new Map(); // Track connected users and their voice status

  const io = socketIo(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://learn-link.vercel.app",
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
      credentials: true,
    },
  });

  io.on("connection", function (socket) {
    const socketId = socket.id;
    socketsStatus[socketId] = {
      username: `User ${socketId.substring(0, 5)}`,
      microphone: false,
      mute: false,
      online: true,
      voiceConnected: false // Track voice connection status
    };

    console.log(`[Voice Chat] New connection: ${socketId}`);

    // Handle voice connection status
    socket.on("voiceConnected", () => {
      if (socketsStatus[socketId]) {
        socketsStatus[socketId].voiceConnected = true;
        connectedUsers.set(socketId, true);
        console.log(`[Voice Chat] User ${socketId} voice connected`);
      }
    });

    // Handle voice data transmission
    socket.on("voice", function (data) {
      let newData = data.split(";");
      newData[0] = "data:audio/ogg;";
      newData = newData[0] + newData[1];

      const username = socketsStatus[socketId]?.username || "Unknown User";
      let receiverCount = 0;
      
      for (const id in socketsStatus) {
        if (id !== socketId && !socketsStatus[id].mute && socketsStatus[id].online) {
          socket.broadcast.to(id).emit("send", newData);
          receiverCount++;
        }
      }

      if (Math.random() < 0.01) {
        console.log(`[Voice Chat] ${username} speaking to ${receiverCount} users`);
      }
    });

    // Handle file sharing - only for voice-connected users
    socket.on("fileUploaded", function (fileData) {
      if (!socketsStatus[socketId]?.voiceConnected) {
        socket.emit("fileUploadError", { 
          error: "Must be connected to voice chat to share files" 
        });
        return;
      }

      const username = socketsStatus[socketId]?.username || "Unknown User";
      console.log(`[File Sync] ${username} shared a file: ${fileData.name}`);
      
      // Add sender information to file data
      const enrichedFileData = {
        ...fileData,
        sharedBy: username,
        sharedAt: new Date().toISOString(),
        socketId: socketId
      };
      
      // Broadcast only to voice-connected users
      for (const [id, connected] of connectedUsers.entries()) {
        if (connected && id !== socketId) {
          io.to(id).emit("newFile", enrichedFileData);
        }
      }
    });

    // Handle user status updates
    socket.on("userInformation", function (data) {
      const previousState = { ...(socketsStatus[socketId] || {}) };
      socketsStatus[socketId] = {
        ...data,
        voiceConnected: socketsStatus[socketId]?.voiceConnected || false,
        lastUpdated: new Date().toISOString(),
      };

      if (previousState.username !== data.username) {
        console.log(`[Voice Chat] User renamed: ${previousState.username || "New user"} → ${data.username}`);
      }

      io.sockets.emit("usersUpdate", socketsStatus);
    });

    // Handle disconnection
    socket.on("disconnect", function () {
      const username = socketsStatus[socketId]?.username || "Unknown User";
      console.log(`[Voice Chat] Disconnected: ${username} (${socketId})`);
      
      delete socketsStatus[socketId];
      connectedUsers.delete(socketId);
      io.sockets.emit("usersUpdate", socketsStatus);
    });
  });

  return io;
}

module.exports = setupVoiceChat;
