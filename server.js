const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Map to store rooms and their clients
let rooms = new Map();

wss.on('connection', function connection(ws) {
    console.log('Client connected.');

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'join':
                handleJoin(ws, data.username);
                break;
            case 'createRoom':
                handleCreateRoom(ws, data.roomName);
                break;
            case 'joinRoom':
                handleJoinRoom(ws, data.room);
                break;
            case 'message':
                handleMessage(ws, data.message, data.room, data.timestamp);
                break;
            default:
                break;
        }
    });
    
    ws.on('message', function incoming(message) {
        console.log('Received:', message);
        // Handle message logic
    });

    ws.on('close', function close() {
        console.log('Client disconnected.');
        cleanupClosedRooms();
        updateRoomList();
    });
});

function handleJoin(ws, username) {
    ws.username = username;
    sendToClient(ws, { type: 'success', rooms: Array.from(rooms.keys()) });
    updateRoomList();
}

function handleCreateRoom(ws, roomName) {
    if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
        sendToAllClients({ type: 'roomCreated', rooms: Array.from(rooms.keys()) });
        updateRoomList();
    } else {
        sendToClient(ws, { type: 'error', message: 'Room name already exists.' });
    }
}


function handleJoinRoom(ws, room) {
    if (rooms.has(room)) {
        ws.room = room;
        rooms.get(room).add(ws);
        sendToClient(ws, { type: 'roomList', rooms: Array.from(rooms.keys()) });
    } else {
        sendToClient(ws, { type: 'error', message: 'Room does not exist.' });
    }
}


function handleMessage(ws, message, room, timestamp) {
    if (ws.room && rooms.get(ws.room)) {
        sendToRoom(ws.room, { type: 'message', message: message, username: ws.username, room: ws.room, timestamp: timestamp });
    }
}

function sendToClient(ws, data) {
    ws.send(JSON.stringify(data));
}

function sendToAllClients(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function sendToRoom(room, data) {
    if (rooms.has(room)) {
        rooms.get(room).forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}

function updateRoomList() {
    sendToAllClients({ type: 'roomList', rooms: Array.from(rooms.keys()) });
}

function cleanupClosedRooms() {
    rooms.forEach((clients, room) => {
        clients.forEach(client => {
            if (client.readyState === WebSocket.CLOSED) {
                clients.delete(client);
            }
        });
        if (clients.size === 0) {
            rooms.delete(room);
        }
    });
}
