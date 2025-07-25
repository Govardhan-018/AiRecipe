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
        const encryptedData = customEncrypt(email, password, 42);
        try {
            const response = await fetch(loginURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: encryptedData })
            });
            const result = await response.json();
            if (result.success) {
                const newWindow = window.open("./frontend/index.html");
                if (newWindow) {
                    newWindow.addEventListener("load", () => {
                        newWindow.postMessage({ key: encryptedData }, "*");
                    });
                } else {
                    alert("Popup blocked. Please allow popups for this site.");
                }
            }
        } catch (error) {
            console.error("Login failed:", error, email, pass);
            alert("Login failed. Please try again.");
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }

    })
}
function customEncrypt(email, password, key = 7) {
    const combined = `${email}::${password}`;
    let encrypted = '';

    for (let i = 0; i < combined.length; i++) {
        let charCode = combined.charCodeAt(i);
        charCode = (charCode + key + i) % 256;
        encrypted += String.fromCharCode(charCode);
    }

    return btoa(encrypted);
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
        const encryptedData = customEncrypt(email, password, 42);
        try {
            const response = await fetch(signupURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: encryptedData })
            });
            const result = await response.json();
            if (result.success) {
                alert("Signup successful! You can now log in.");

                const newWindow = window.open("./frontend/index.html", '_self');
                if (newWindow) {
                    newWindow.addEventListener("load", () => {
                        newWindow.postMessage({ key: encryptedData }, "*");
                    });
                } else {
                    alert("Popup blocked. Please allow popups for this site.");
                }
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