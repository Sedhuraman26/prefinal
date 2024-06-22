document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const chatContainer = document.getElementById('chat-container');
    const errorMessage = document.getElementById('error-message');
    const roomList = document.getElementById('rooms');
    const createRoomInput = document.getElementById('new-room-input');
    const createRoomButton = document.getElementById('create-room-button');
    const roomNameElement = document.getElementById('room-name');
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    let socket;
    let username;
    let currentRoom;

    // Login functionality
    document.getElementById('login-button').addEventListener('click', () => {
        const usernameInput = document.getElementById('username-input');
        const usernameValue = usernameInput.value.trim();
        if (usernameValue === '') {
            showError('Please enter a username.');
            return;
        }
        username = usernameValue;
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
        connect();
    });

    // Connect to WebSocket server
    function connect() {
        socket = new WebSocket('ws://localhost:8080');
        socket.addEventListener('open', () => {
            socket.send(JSON.stringify({ type: 'join', username: username }));
        });

        socket.addEventListener('message', event => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'success':
                    updateRoomList(data.rooms);
                    break;
                case 'roomList':
                    updateRoomList(data.rooms);
                    break;
                case 'error':
                    showError(data.message);
                    socket.close();
                    break;
                case 'message':
                    if (data.room === currentRoom) {
                        receiveMessage(data.message, data.username, data.timestamp);
                    }
                    break;
                case 'roomCreated':
                    updateRoomList(data.rooms);
                    break;
            }
        });

        socket.addEventListener('close', () => {
            showError('Connection closed. Please refresh the page.');
        });

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

// Event listener for creating a new room
createRoomButton.addEventListener('click', () => {
    const roomName = createRoomInput.value.trim();
    if (roomName === '') {
        showError('Please enter a room name.');
        return;
    }
    socket.send(JSON.stringify({ type: 'createRoom', roomName: roomName }));
});

// Event listener for selecting a room to join
roomList.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
        const roomName = event.target.textContent.trim();
        joinRoom(roomName);
    }
});

function joinRoom(room) {
    if (currentRoom === room) return; // Prevent rejoining the same room
    socket.send(JSON.stringify({ type: 'joinRoom', room: room }));
    currentRoom = room;
    roomNameElement.textContent = currentRoom;
    updateActiveRoom(room); // Implement this function to update UI when room is selected
}


    // Update room list in the UI
    function updateRoomList(rooms) {
        roomList.innerHTML = '';
        rooms.forEach(room => {
            const li = document.createElement('li');
            li.textContent = room;
            li.setAttribute('data-room', room);
            li.addEventListener('click', () => {
                joinRoom(room);
            });
            roomList.appendChild(li);
        });
    }

    function joinRoom(room) {
        if (currentRoom === room) return; // Prevent rejoining the same room
        socket.send(JSON.stringify({ type: 'joinRoom', room: room }));
        currentRoom = room;
        roomNameElement.textContent = currentRoom;
        updateActiveRoom(room); // Implement this function to update UI when room is selected
    }
    

    // Send a message
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;
        const timestamp = new Date().toLocaleTimeString();
        const messageElement = createMessageElement(messageText, username, timestamp, 'sent');
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        messageInput.value = '';
        socket.send(JSON.stringify({ type: 'message', message: messageText, room: currentRoom, timestamp: timestamp }));
    }

    // Receive a message
    function receiveMessage(text, user, timestamp) {
        const messageElement = createMessageElement(text, user, timestamp, 'received');
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Create message element with formatting
    function createMessageElement(text, user, timestamp, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.innerHTML = `${user}: ${formatMessage(text)} <span class="meta">${timestamp}</span>`;
        return messageElement;
    }

    // Format message for bold, italics, and links
    function formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
            .replace(/\*(.*?)\*/g, '<i>$1</i>')    // Italics
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>'); // Links
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}
})

