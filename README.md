<div align="center">

# 🧪 ICAR-IIRR Laboratory Management Portal

**A full-stack portal for managing a research lab's people, projects, publications and inventory, with dashboards, reports and automated alerts.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

</div>

---

## ✨ Features

| Area | What it does |
| --- | --- |
| 🔐 **Authentication** | JWT login with bcrypt-hashed passwords and **TOTP two-factor auth** (QR setup for Google / Microsoft Authenticator), enforced on first login |
| 👥 **Roles & approvals** | `admin` and `viewer` roles; new sign-ups wait for admin approval in **User Management** |
| 📋 **Four modules** | Full CRUD for **People**, **Projects**, **Publications** and **Inventory** with searchable data tables |
| 📊 **Dashboard** | Summary stat cards and Chart.js charts across all modules |
| 📑 **Reports** | Export any module to **Excel (.xlsx)** or **Word (.docx)** |
| ⏰ **Automated alerts** | Daily 8 AM job emails the admin about projects closing within 30 days and inventory items with fewer than 10 in stock |
| 🌗 **Theming** | Light and dark mode |

## 🛠️ Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite, React Router, Chart.js, Axios, react-hot-toast |
| Backend | Node.js, Express, better-sqlite3, JWT, bcryptjs, otplib / speakeasy, node-cron, Nodemailer |
| Exports | ExcelJS, docx |

## 🚀 Getting started

Requires **Node.js 18+**.

**1. Clone**

```bash
git clone https://github.com/suhas107/laboratory-portal.git
cd laboratory-portal
```

**2. Start the backend**

```bash
cd server
cp .env.example .env      # Windows: copy .env.example .env
npm install
npm run dev               # http://localhost:5000
```

**3. Start the frontend** (in a second terminal)

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

**4. Log in** at http://localhost:5173 with the admin credentials from `.env` (default `admin` / `admin123`). On first login you'll be asked to scan a QR code to set up 2FA.

### Environment variables (`server/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `JWT_SECRET` | Secret for signing login tokens |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, `ADMIN_EMAIL` | First admin account, created on startup |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Mail server for 2FA, approval and alert emails. If left blank, a free [Ethereal](https://ethereal.email) test inbox is used |

## 📁 Project structure

```
laboratory-portal/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/     # Navbar, Sidebar, DataTable, Modal, StatCard
│       ├── context/        # Auth and theme providers
│       ├── pages/          # Dashboard, People, Projects, Publications, Inventory, Reports, Users
│       └── services/api.js
└── server/                 # Express API
    ├── db/schema.sql       # SQLite schema
    ├── middleware/auth.js  # JWT + admin guard
    ├── routes/             # auth, dashboard, people, projects, publications, inventory, reports
    └── services/           # email + daily cron alerts
```

## 🧯 Troubleshooting

- **"Module not found"**: run `npm install` in both `server` and `client`.
- **Can't log in**: check that `server/.env` exists and the backend terminal shows no errors.

## 📄 License

[MIT](LICENSE)
