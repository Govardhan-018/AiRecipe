# 🍳 AI Recipe Maker

**AI Recipe Maker** is an intelligent web application that helps users generate cooking recipes using AI. It features secure user authentication, chat history management, and AI-powered suggestions based on ingredients or dish names.

---

## 🚀 Features

- 🔐 User authentication (Signup / Login)
- 🤖 AI-powered recipe suggestions (via OpenRouter API)
- 💬 Interactive chat interface
- 🕓 View and delete **chat history**
- 📦 Encrypted session-based user identity
- 💾 PostgreSQL-based message and user data storage

---

## 🖥️ Preview

![AI Recipe Maker Screenshot](./screenshots/)

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **AI Integration**: OpenRouter API (Mistral 7B model)

---

## 📁 Folder Structure

```
ai-recipe-maker/
│
├── frontend/             # Frontend files
│   ├── index.html        # Chat interface
│   ├── style.css         # Chat page styles
│   ├── style2.css        # Landing page styles
│   ├── script.js         # Chat logic
│   ├── script2.js        # Landing/login/signup logic
│   ├── images/           # Icons (e.g., arrow_upward, arrow_downward)
│
├── index.html            # Landing page (Welcome, login/signup)
├── backend/               # Backend files
│   └── index.js          # Express server with API routes
├   └──.env                  # Environment variables (API keys)
├── README.md             # This file
```

---

## 🧠 AI Flow Overview

- **User Message** → Chat UI  
- **Chat Request** → Server (`/chat`)  
- **OpenRouter API** → Generates recipe based on history  
- **Bot Reply** → Saved in DB and displayed to user  

---

## 🔐 Authentication

- Custom encryption used for email/password with a secret key  
- Encrypted session key passed via `postMessage` for secure frontend-backend communication  
- PostgreSQL used to store registered users and chat history  

---

## 📦 API Endpoints

| Endpoint     | Method | Purpose                          |
|--------------|--------|----------------------------------|
| `/signup`    | POST   | Register new user                |
| `/login`     | POST   | Authenticate existing user       |
| `/chat`      | POST   | Process user message with AI     |
| `/history`   | POST   | Fetch chat history               |
| `/delete`    | POST   | Delete chat history              |

---

## 🧪 Future Improvements

- 🍫 Add dark mode for better night experience  
- 📱 Make mobile-responsive chat UI  
- 📧 Email-based password reset  
- 📈 Dashboard with usage analytics  
- 🧠 Add support for multiple AI models  

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Govardhan-018/AiRecipe.git
cd AiRecipe/backend/
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up `.env` file

Create a `.env` file in the `backend/` folder with:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```
Open [openrouter](https://openrouter.ai/settings/keys) and get your key and create a .env file and past it like above.

### 4. Start the backend server

```bash
node index.js
```

### 5. Open the frontend

Navigate to the `index.html` in a browser or use a local server like Live Server.

---

## 🧾 Database Schema

You have to make changes in backend/index.js in database, you have to give your psql ligin info and also create a database and give its name. For all this install pgadmin.
You need two tables:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    email TEXT REFERENCES users(email)
);
```

---

## 👨‍💻 Author

Created by [Govardhan Hegde](https://github.com/Govardhan-018)

---
