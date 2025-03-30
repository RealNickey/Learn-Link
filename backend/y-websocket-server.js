#!/usr/bin/env node

const WebSocket = require('ws')
const http = require('http')
const { setupWSConnection } = require('y-websocket/bin/utils')

const port = process.env.PORT || 1234

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('Yjs WebSocket server running\n')
})

const wss = new WebSocket.Server({ server })

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true })
})

server.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`)
})

// Export for potential use with other servers
module.exports = { server, wss }
