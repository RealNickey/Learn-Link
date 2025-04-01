import React, { useMemo, useEffect, useState } from "react";
import { Tldraw, defaultShapeUtils, defaultBindingUtils } from "@tldraw/tldraw";
import { useSync } from "@tldraw/sync";
import { io } from "socket.io-client";

const Whiteboard = ({ roomId }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit("join-room", roomId);
    }
  }, [socket, roomId]);

  const store = useSync({
    uri: `ws://localhost:5000/${roomId}`,
    shapeUtils: useMemo(() => [...defaultShapeUtils], []),
    bindingUtils: useMemo(() => [...defaultBindingUtils], []),
  });

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Tldraw
        store={store}
        shapeUtils={defaultShapeUtils}
        bindingUtils={defaultBindingUtils}
      />
    </div>
  );
};

export default Whiteboard;
