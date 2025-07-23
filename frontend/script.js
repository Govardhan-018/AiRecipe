const chat_window = document.getElementById('chat-window');
const chat_input = document.getElementById('user-input');
const chat_submit = document.getElementById('send-btn');
const view_history = document.getElementById('view-history-btn');
const serverURL1 = 'http://192.168.1.7:3069/chat'; 
const serverURL2 = 'http://192.168.1.7:3069/history'; 

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

    try {
        const response = await fetch(serverURL1, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }) 
        });

        const data = await response.json(); 
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
    const response = await fetch(serverURL2);
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
