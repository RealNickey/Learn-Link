# Learn Link Collaborative Whiteboard

A real-time collaborative whiteboard application built with tldraw and socket.io.

## Features

- Real-time collaborative drawing
- Multiple rooms support
- Persistent storage of drawings
- Default shape tools (rectangles, arrows, etc.)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In a new terminal, start the frontend development server:
```bash
cd frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## How to Use

1. The application will automatically connect to the default room
2. Use the drawing tools on the left sidebar to create shapes and drawings
3. All changes will be synchronized in real-time with other users in the same room
4. Drawings are automatically saved every 2 seconds

## Technologies Used

- Frontend:
  - React
  - tldraw
  - socket.io-client
  - @tldraw/sync

- Backend:
  - Node.js
  - Express
  - socket.io
  - @tldraw/sync-core
  - @tldraw/tlschema