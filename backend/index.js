import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pg from 'pg';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = 3069;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'AI_RESP',
    password: 'gova123',
    port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

function customDecrypt(encryptedBase64, key = 7) {
    const encrypted = Buffer.from(encryptedBase64, 'base64').toString('binary');
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
        let charCode = encrypted.charCodeAt(i);
        charCode = (charCode - key - i + 256) % 256;
        decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
}

// Returns chat history for a user if key is valid
app.post('/history', async (req, res) => {
    const key = req.body.key;
    if (!key || key.trim() === '') {
        return res.status(400).json({ error: 'Empty key not allowed' });
    }
    let op = customDecrypt(key, 42);
    let [email, pass] = op.split("::");
    if (!email || !pass) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    try {
        const result = await pool.query('SELECT * FROM messages WHERE email = $1', [email]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load history' });
    }
})

// Registers a new user
app.post('/signup', async (req, res) => {
    const data = req.body.data;
    if (!data || data.trim() === '') {
        return res.status(400).json({ error: 'Empty data not allowed' });
    }
    let op = customDecrypt(data, 42);
    let [email, pass] = op.split("::");
    if (!email || !pass) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    try {
        await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, pass]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to sign up' });
    }
});

app.post('/delete', async (req, res) => {
    const key = req.body.key;
    if (!key || key.trim() === '') {
        return res.status(400).json({ error: 'Empty key not allowed' });
    }
    let op = customDecrypt(key, 42);
    let [email, pass] = op.split("::");
    if (!email || !pass) {
        return res.status(400).json({ error: 'Invalid key format' });
    }
    try {
        await pool.query('DELETE FROM messages WHERE email = $1', [email]);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to delete history' });
    }
});

    // Authenticates a user
    app.post('/login', async (req, res) => {
        const data = req.body.data;
        if (!data || data.trim() === '') {
            return res.status(400).json({ error: 'Empty data not allowed' });
        }
        let op = customDecrypt(data, 42);
        let [email, pass] = op.split("::");
        if (!email || !pass) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        try {
            const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, pass]);
            if (result.rows.length > 0) {
                res.status(200).json({ success: true });
            } else {
                res.status(401).json({ error: 'Invalid email or password' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to log in' });
        }
    });

    // Handles chat messages and OpenRouter API integration
    app.post('/chat', async (req, res) => {
        const userMessage = req.body.message;
        const key = req.body.key;

        if (!key || key.trim() === '') {
            return res.status(400).json({ error: 'Empty key not allowed' });
        }

        let decrypted = customDecrypt(key, 42);
        let [email, pass] = decrypted.split("::");

        if (!email || !pass) {
            return res.status(400).json({ error: 'Invalid key format' });
        }

        if (!userMessage || userMessage.trim() === '') {
            return res.status(400).json({ error: 'Empty message not allowed' });
        }

        const message = userMessage.trim();
        let botReply = '';
        let chat_history = [];

        try {
            const result = await pool.query(
                'SELECT role, content FROM messages WHERE email = $1 ORDER BY id ASC',
                [email]
            );
            chat_history = result.rows.map(row => ({
                role: row.role === 'bot' ? 'assistant' : row.role,
                content: row.content
            }));
            chat_history.push({ role: "user", content: message });
        } catch (err) {
            console.error('Error fetching chat history:', err);
        }

        try {
            const apiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "mistralai/mistral-7b-instruct",
                    messages: chat_history,
                }),
            });

            const data = await apiRes.json();

            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid response from OpenRouter');
            }

            botReply = data.choices[0].message.content;

            await pool.query('INSERT INTO messages (role, content, email) VALUES ($1, $2, $3)', ['user', userMessage, email]);
            await pool.query('INSERT INTO messages (role, content, email) VALUES ($1, $2, $3)', ['bot', botReply, email]);

            res.status(200).json({ reply: botReply });

        } catch (err) {
            console.error('Error in chat flow:', err);
            res.status(500).json({ reply: 'Error processing your request.' });
        }
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
