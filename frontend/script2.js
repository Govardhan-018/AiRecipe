const loginForm = document.getElementById('login');
const signupForm = document.getElementById('signin');
const container = document.getElementById('container');
const scrollDown = document.getElementById('scroll-down');
let ip, loginURL, signupURL;
fetchIP();
async function fetchIP() {
    try {
        const response = await fetch("../ip.txt");
        ip = await response.text()
        loginURL = `http://${ip}:3069/login`;
        signupURL = `http://${ip}:3069/signup`;
    } catch (error) {
        console.error("Could not fetch IP:", error);
    }
}

function login() {
    container.innerHTML = `<h1>Login</h1>
    <form id="loginForm">
        <div class="form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit" class="bt">Log In</button>
        </div>
    </form>`
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const response = await fetch(loginURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password }),
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = "./frontend/index.html";
            }
        } catch (error) {
            alert("Login failed. Please try again.");
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }

    })
}
function signup() {
    container.innerHTML = `<h1>Sign Up</h1>
    <form id="signupForm">
      <div class="form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit" class="bt">Sign Up</button>
      </div>
    </form>`
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            const response = await fetch(signupURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password }),
                credentials: 'include'  
            });
            const result = await response.json();
            if (result.success) {
                alert("Signup successful! You can now log in.");
                window.location.href = "./frontend/index.html";
            } else {
                alert("Popup blocked. Please allow popups for this site.");
            }
        } catch (error) {
            console.error("Signin failed:", error, email, password);
            alert("Signin failed. Please try again.");
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }
    })
}
scrollDown.addEventListener('click', () => {
    const infoSection = document.querySelector('.info');
    if (infoSection) {
        infoSection.scrollIntoView({ behavior: 'smooth' });
    }
});
loginForm.addEventListener('click', login);
signupForm.addEventListener('click', signup);