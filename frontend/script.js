const chat_window = document.getElementById('chat-window');
const chat_input = document.getElementById('user-input');
const chat_submit = document.getElementById('send-btn');
const view_history = document.getElementById('view-history-btn');
const delete_history = document.getElementById('delete-history-btn');
const logout_btn = document.getElementById('logout-btn');
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


function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = role === 'user' ? 'user-message' : 'bot-message';
    messageDiv.textContent = content;
    chat_window.appendChild(messageDiv);
    chat_window.scrollTop = chat_window.scrollHeight;
}

async function handleSend() {
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
            body: JSON.stringify({ message: message }),
            credentials: 'include'
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
            credentials: 'include'
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
    try {
        const response = await fetch(serverURL3, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
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
logout_btn.addEventListener('click', async () => {
    await fetch(`http://${ip}:3069/logout`, {
        method: 'POST',
        credentials: 'include'
    });
    window.location.href = `http://${ip}:3000/index.html`;
});
