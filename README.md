# 🧪 AI Test Intelligence Platform

An AI-powered QA automation platform that turns raw software requirements into functional test cases, automation scripts, test data, API collections, and stakeholder-ready reports — with full user accounts, project management, and history tracking.

Built as a full-stack application: **React (Vite + Tailwind)** frontend, **Flask (Python)** backend, **SQLite** database, and **Groq (Llama 3.3 70B)** for AI generation.

---

## 📸 Screenshots

> Add screenshots here after taking them from your running app. Suggested shots:
> - Login / Signup screen
> - Dashboard with a module open (e.g. Requirement Analyzer with results)
> - Test Case Generator output
> - Test History page
> - Light mode vs dark mode side-by-side

```
docs/screenshots/login.png
docs/screenshots/dashboard.png
docs/screenshots/testcases.png
docs/screenshots/history.png
docs/screenshots/theme-toggle.png
```

---

## ✨ Features

### AI-Powered Modules
| Module | Description |
|---|---|
| 🧠 Requirement Analyzer | Upload a PDF/DOCX/TXT requirement doc → extracts structured, numbered requirements |
| ✅ Test Case Generator | Generates Functional, Positive, Negative & Boundary test cases from requirements |
| 🔌 API Test Generator | Generates a downloadable Postman Collection (v2.1) with test scripts |
| 🌐 Selenium Script Generator | Generates a Python `unittest` + Selenium automation script |
| 🎭 Playwright Script Generator | Generates a Python Pytest + Playwright automation script |
| 🧬 Test Data Generator | Generates valid, invalid, boundary & edge-case test data as structured JSON |
| 🔧 Self-Healing Locators | Compares old vs new HTML and suggests fixed locators for broken selectors |
| 📊 AI Report Generator | Generates a professional Markdown/PDF test execution summary report |

### Platform Features
- 🔐 **Login & Signup** — secure authentication with hashed passwords and server-side sessions
- 📁 **Project Management** — create projects and tie generated artifacts to them
- 🕒 **Test History** — every generation is saved per-user and viewable later
- 📄 **PDF Export** — download AI Report Generator output as a formatted PDF
- 🔍 **Search & Filter** — search saved test cases by keyword and category
- 🌗 **Dark / Light Mode** — full theme toggle across the entire UI
- 👤 **User Profile** — view account details (username, email, member since)
- 📜 **Activity Logs** — audit trail of the last 50 actions on the account
- ⚙️ **CI/CD Pipeline** — GitHub Actions runs backend + frontend checks on every push

---

## 🛠️ Tech Stack

**Frontend**
- React 18 (Vite)
- Tailwind CSS
- Fetch API for backend communication

**Backend**
- Python 3 + Flask
- Flask-CORS (credentialed cross-origin requests)
- SQLite (via Python's built-in `sqlite3`)
- Groq API (`llama-3.3-70b-versatile`) for AI generation
- Werkzeug (password hashing)
- PyPDF2 / python-docx (file text extraction)
- ReportLab (PDF generation)

**DevOps**
- Git + GitHub
- GitHub Actions (CI pipeline: Python syntax + import check, frontend build check)

---

## 📁 Project Structure

```
AI-Test-Intelligence/
│
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI pipeline
│
├── backend/
│   ├── app.py                    # Flask app: all API routes
│   ├── database.py                # SQLite connection + schema + activity logging
│   ├── requirements.txt          # Python dependencies
│   ├── uploads/                  # Temporary storage for uploaded files
│   ├── .env                      # GROQ_API_KEY, FLASK_SECRET_KEY (not committed)
│   └── venv/                     # Python virtual environment (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main React app (auth gate + dashboard + all modules)
│   │   ├── App.css
│   │   ├── index.css             # Tailwind + custom fonts
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── node_modules/              (not committed)
│
├── database/
│   └── qa.db                     # SQLite database file (not committed)
│
├── docs/
│   └── screenshots/               # App screenshots for this README
│
├── tests/
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema

SQLite database (`database/qa.db`), created automatically on first run.

| Table | Purpose |
|---|---|
| `users` | Account credentials (hashed passwords), username, email |
| `projects` | User-created projects for organizing generated artifacts |
| `uploaded_requirements` | Saved Requirement Analyzer results |
| `generated_testcases` | Saved Test Case Generator results |
| `selenium_scripts` | Saved Selenium Script Generator results |
| `playwright_scripts` | Saved Playwright Script Generator results |
| `test_data` | Saved Test Data Generator results |
| `reports` | Saved AI Report Generator results |
| `activity_logs` | Audit trail of user actions (login, generate, download, etc.) |

---

## 🚀 Getting Started

### Prerequisites
- [Python 3.12+](https://www.python.org/downloads/)
- [Node.js LTS](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A free [Groq API key](https://console.groq.com/keys)

### 1. Clone the repository
```bash
git clone https://github.com/patilneha72710/AI-Test-Intelligence.git
cd AI-Test-Intelligence
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
GROQ_API_KEY=your_groq_api_key_here
FLASK_SECRET_KEY=any_random_secret_string
```

Run the backend:
```bash
python app.py
```
Backend runs at **http://127.0.0.1:5000**

### 3. Frontend setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at **http://localhost:5173**

### 4. Use the app
Open **http://localhost:5173**, sign up for an account, and start generating.

---

## 🔑 Environment Variables

| Variable | Location | Description |
|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | API key from [console.groq.com](https://console.groq.com/keys) — used for all AI generation |
| `FLASK_SECRET_KEY` | `backend/.env` | Secret key Flask uses to sign session cookies |

⚠️ Never commit `.env` to Git — it's excluded via `.gitignore`.

---

## 📡 API Overview

All endpoints are prefixed with `http://127.0.0.1:5000`. Authenticated endpoints require a valid session cookie (obtained via `/api/login` or `/api/signup`).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/signup` | Create a new account |
| POST | `/api/login` | Log in |
| POST | `/api/logout` | Log out |
| GET | `/api/me` | Check current session |
| GET | `/api/profile` | Get account details |
| POST | `/api/analyze-requirements` | Extract requirements from a file |
| POST | `/api/generate-testcases` | Generate test cases from a file |
| POST | `/api/generate-api-tests` | Generate a Postman collection |
| POST | `/api/generate-selenium` | Generate a Selenium script |
| POST | `/api/generate-playwright` | Generate a Playwright script |
| POST | `/api/generate-testdata` | Generate test data |
| POST | `/api/heal-locators` | Detect/heal broken locators |
| POST | `/api/generate-report` | Generate a test execution report |
| POST | `/api/download-report-pdf` | Download a report as PDF |
| GET | `/api/history` | Get all saved generations for the user |
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create a new project |
| GET | `/api/activity-logs` | Get recent account activity |
| GET | `/api/search-testcases` | Search/filter saved test cases |

---

## 🧭 Roadmap / Development Phases

- [x] Phase 1 — Project setup & environment
- [x] Phase 2 — AI Requirement Analyzer
- [x] Phase 3 — AI Test Case Generator
- [x] Phase 4 — API Test Case Generator (Postman)
- [x] Phase 5 — Selenium Script Generator
- [x] Phase 6 — Playwright Script Generator
- [x] Phase 7 — Test Data Generator
- [x] Phase 8 — Self-Healing Locator Detection
- [x] Phase 9 — AI Report Generator
- [x] Phase 10 — GitHub Actions CI/CD
- [x] Login & Signup (SQLite + hashed passwords + sessions)
- [x] Test History (per-user, per-module)
- [x] Download Reports as PDF
- [x] Project Management
- [x] Dark / Light Mode
- [x] User Profile
- [x] Activity Logs
- [ ] Search & Filter Test Cases *(in progress)*
- [ ] Docker deployment
- [ ] Jira integration

---

## 🧑‍💻 Author

**Neha Patil**
GitHub: [@patilneha72710](https://github.com/patilneha72710)

---

## 📄 License

This project is open source and available for personal and educational use.