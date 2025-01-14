# Learn-Link Backend

## Description
This is the backend for the Learn-Link application.

## Installation
1. Clone the repository
2. Navigate to the `backend` directory
3. Run `npm install` to install dependencies

## Usage
1. Create a `.env` file in the `backend` directory with the following content:
   ```
   MONGO_URI=your_mongodb_connection_string
   PORT=5000
   ```
2. Run `npm start` to start the server

## Endpoints
- `GET /` - Welcome message
- `GET /users` - Get all users
- `POST /users` - Create a new user
