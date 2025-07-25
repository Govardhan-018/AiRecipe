const chat_window = document.getElementById('chat-window');
const chat_input = document.getElementById('user-input');
const chat_submit = document.getElementById('send-btn');
const view_history = document.getElementById('view-history-btn');
const delete_history = document.getElementById('delete-history-btn');
const logout_btn = document.getElementById('logout-btn');
let key = sessionStorage.getItem("key") || '';
let ip, serverURL1, serverURL2, serverURL3

fetchIP();
async function fetchIP() {
    try {
        const response = await fetch("../ip.txt");
        ip = await response.text()
        serverURL1 = `http://${ip}:3069/chat`;
        serverURL2 = `http://${ip}:3069/history`;
        serverURL3 = `http://${ip}:3069/delete`;
    } catch (error) {
        console.error("Could not fetch IP:", error);
    }
}


window.addEventListener("message", (event) => {
    console.log("Received message event:", event.data);
    const receivedData = event.data;
    if (receivedData && receivedData.key) {
        console.log("Key received from message:", receivedData.key);
        key = receivedData.key;
        sessionStorage.setItem("key", key);
        initializePageWithKey();
    }
});

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");
    const navType = performance.getEntriesByType("navigation")[0].type;
    if (navType === "reload") {
        const storedKey = sessionStorage.getItem("key");
        console.log("Page reloaded, stored key:", storedKey);
        if (storedKey) {
            key = storedKey;
            initializePageWithKey();
        } else {
            console.warn("Reload detected, but no key stored.");
        }
    }
})

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = role === 'user' ? 'user-message' : 'bot-message';
    messageDiv.textContent = content;
    chat_window.appendChild(messageDiv);
    chat_window.scrollTop = chat_window.scrollHeight;
}

async function handleSend() {
    if (!key || key.trim() === '') {
        addMessage('bot', 'Please log in first...');
        return;
    }
    const message = chat_input.value.trim();
    if (message === '') return;

    addMessage('user', message);
    chat_input.value = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message loading';
    chat_window.appendChild(messageDiv);
    try {
        const response = await fetch(serverURL1, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, key: key })
        });

        const data = await response.json();
        document.querySelectorAll('.loading').forEach(el => el.remove());
        addMessage('bot', data.reply);
    } catch (error) {
        console.log('Error:', error);
        addMessage('bot', 'Error connecting to the server.');
    }
}

chat_submit.addEventListener('click', handleSend);
chat_input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});
view_history.addEventListener('click', async () => {
    try {
        const response = await fetch(serverURL2, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key })
        });
        const messages = await response.json();

        chat_window.innerHTML = '';

        messages.forEach(msg => {
            addMessage(msg.role, msg.content);
        });
    } catch (err) {
        console.log(err);
        addMessage('bot', 'Failed to load chat history.');
    }
});

delete_history.addEventListener('click', async () => {
    if (!key || key.trim() === '') {
        addMessage('bot', 'No key provided for deletion.');
        return;
    }
    try {
        const response = await fetch(serverURL3, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key })
        });
        const data = await response.json();
        if (data.success) {
            chat_window.innerHTML = '';
            addMessage('bot', 'Chat history deleted successfully.');
        }
    } catch (error) {
        console.log('Error:', error);
        addMessage('bot', 'Error connecting to the server.');
    }
})
logout_btn.addEventListener('click', () => {
    sessionStorage.removeItem("key");
    window.open('../index.html', '_self');
});
function initializePageWithKey() {
    console.log("Initializing page with key:", key);
    if (key && key.trim() !== '') {
        view_history.style.display = 'block';
        delete_history.style.display = 'block';
    } else {
        view_history.style.display = 'none';
        delete_history.style.display = 'none';
    }
}
initializePageWithKey();
