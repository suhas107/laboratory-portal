<div align="center">
  <h1>🧪 ICAR-IIRR Laboratory Management Portal</h1>
  <p><i>A complete, modern web suite for managing laboratory resources.</i></p>

  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
  ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
  ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
</div>

<br/>

Welcome! This is a robust, highly secure, and modern web application built specifically for the ICAR-Indian Institute of Rice Research to manage People, Projects, Publications, and Inventory.

This guide will walk you through exactly how to open and run this project using **Visual Studio Code (VS Code)**.

---

## 🛠️ Step 1: What You Need First

Before you begin, make sure you have installed:
1. **VS Code**: If you don't have it, download it from [code.visualstudio.com](https://code.visualstudio.com/).
2. **Node.js**: You need version 18 or higher. Download it from [nodejs.org](https://nodejs.org/). (When installing, just click "Next" through all the default options).

---

## 📂 Step 2: Open the Project in VS Code

1. Open **VS Code**.
2. Click on **File** > **Open Folder...** (or Open Directory).
3. Select this folder (the one containing this `README.md` file).

---

## ⚙️ Step 3: Configure Your Settings (Important!)

Before starting the server, you need to set up the Email Configuration so the portal can send out 2FA codes, approvals, and automated alerts.

1. In VS Code, look at the file explorer on the left side.
2. Open the **`server`** folder, and click on the file named **`.env`**.
3. In that file, you will see a section for Email Configuration. Fill in your official ICAR Outlook email and password where instructed.
4. You can also change your starting Admin Username and Password in this file!
5. **Save the file** (`Ctrl + S` or `Cmd + S`).

---

## 🚀 Step 4: Start the Application

The application has two pieces that need to run at the same time: the **Backend (Server)** and the **Frontend (Client)**. 

### Part A: Start the Backend
1. In VS Code, go to the top menu and click **Terminal** > **New Terminal**.
2. A terminal panel will open at the bottom. Type the following commands, pressing **Enter** after each one:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. *Wait a moment. You will see a green message saying "Server running on http://localhost:5000". Leave this terminal open!*

### Part B: Start the Frontend
1. Open a **second** terminal by clicking the **`+`** icon in the terminal panel at the bottom right.
2. In this new terminal window, type:
   ```bash
   cd client
   npm install
   npm run dev
   ```
3. *You will see a message saying "VITE ready".*

---

## 🎉 Step 5: You're Live!

1. Open your web browser (Chrome, Edge, Firefox, etc.).
2. Go to this address: **http://localhost:5173**
3. Log in using the default credentials you set in the `.env` file (by default: `admin` and `admin123`).

> **🚨 CRITICAL FIRST LOGIN STEP:**
> The very first time you log in, you will be forced to scan a QR code to set up **Two-Factor Authentication (2FA)** on your phone. You can use Google Authenticator, Microsoft Authenticator, or Apple Passwords. Do not lose this connection on your phone!

---

## 💡 Troubleshooting

- **"Module not found" error?** Make sure you ran `npm install` inside both the `server` and `client` folders.
- **Can't log in?** Ensure your `.env` file is saved properly and the backend server terminal isn't showing any red errors.

Enjoy your new Laboratory Management Portal!
