import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pg from 'pg';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import pkg from 'passport-local';
const { Strategy: LocalStatergy } = pkg;
import passport from 'passport';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(cors({
    origin:true,
    credentials: true
}));

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Returns chat history for a user if key is valid
app.post('/history', async (req, res) => {
    const email = req.user.email;
    try {
        const result = await pool.query('SELECT * FROM messages WHERE email = $1', [email]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load history' });
    }
})

// Registers a new user
app.post('/signup', async (req, res) => {
    const email = req.body.email;
    let pass = req.body.password;
    if (!email || !pass) {
        return res.status(400).json({ error: 'Invalid data format' });
    }
    try {
        pass = await bcrypt.hash(pass, 10);
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        } else {
            await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, pass]);
            res.status(200).json({ success: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to sign up' });
    }
});

app.post('/delete', async (req, res) => {
    const email = req.user.email;
    try {
        await pool.query('DELETE FROM messages WHERE email = $1', [email]);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete history' });
    }
});

// Authenticates a user
app.post('/login', async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err)
        if (!user) return res.status(401).json({ error: info.message || 'Authentication failed' });

        req.logIn(user, (err) => {
            if (err) return next(err);
            res.status(200).json({ success: true, email: user.email });
        });
    })(req, res, next);
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// Handles chat messages and OpenRouter API integration
app.post('/chat', isAuthenticated, async (req, res) => {
    const userMessage = req.body.message;
    const email = req.user.email;

    if (!userMessage || userMessage.trim() === '' || !email) {
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
        chat_history.push({ role: "developer", content: "if above last question or prompt from user is not related to cooking or food then reply sorry i cant help " });
    } catch (err) {
        console.error('Error fetching chat history:', err);
        return res.status(500).json({ reply: 'Error fetching chat history.' });
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

app.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to log out' });
        }
        res.status(200).json({ success: true });
    });
});

passport.use(new LocalStatergy({
    usernameField: 'email',
    passwordField: 'password',
}, async (email, password, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return done(null, false, { message: 'User not found' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);

    } catch (err) {
        return done(err);
    }
}))
passport.serializeUser((user, done) => {
    done(null, user.email);
});
passport.deserializeUser(async (email, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return done(null, false);
        }
        done(null, result.rows[0]);
    } catch (err) {
        done(err);
    }
});

app.listen(PORT, async () => {
    const localIP = await getLocalIPAddress();
    fs.writeFileSync(path.join(__dirname, '../ip.txt'), localIP)
    console.log("Server is host on " + localIP + "/" + PORT)
});
