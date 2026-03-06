<div align="center">

# ₹ MUDRA
### Personal Finance Manager

*Because money disappears faster than expected — and Excel sheets are not fun.*

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

</div>

---

## What is MUDRA?

MUDRA is a personal finance management web application built to bring **clarity, structure, and visibility** to your everyday finances.

Most people's money situation looks something like this — expenses scattered across five different apps, forgotten subscriptions silently draining accounts, no clear picture of where the month went. MUDRA was built to fix exactly that.

It gives you one clean, unified place to:
- See all your account balances
- Track every transaction
- Set and monitor budgets
- Work toward financial goals
- Manage recurring expenses

The name *MUDRA* is a deliberate choice — it means gesture, currency, and intention all at once. Managing money should feel intentional, not chaotic.

---

## The Problem This Solves

> **Before MUDRA, money is chaos. After MUDRA, money works for you.**

Most people face three core financial problems:

| Problem | Reality |
|---|---|
| 💸 **Money Chaos** | Expenses scattered across apps, wallets, UPI, cash — impossible to track |
| 🔍 **No Financial Clarity** | Most people genuinely don't know where their money went each month |
| 🧠 **Mental Accounting** | Trying to remember expenses in your head instead of recording them |

MUDRA addresses all three with a structured, visual, easy-to-use dashboard that requires no financial expertise to operate.

---

## Features & Pages

### 🏠 Landing Page
The first thing a visitor sees — a full-screen interactive hero section with **50+ scattered Indian currency notes** (₹10 to ₹2000) physically reacting to cursor movement. As the user scrolls, the notes animate into neat denomination stacks, visually symbolising the transformation MUDRA brings. Below the hero sits a features section and the login/signup form.

### 📊 Dashboard
The central hub. Displays a high-level overview of the user's complete financial picture — total balances, recent transactions, budget progress, and active goals — all in one glance.

### 🏦 Accounts
Manage all financial accounts in one place. Add bank accounts, wallets, or cash holdings. See individual balances clearly without switching between apps.

### 💳 Transactions
A complete log of every income and expense entry. Add transactions manually, categorise them, and understand your spending patterns over time.

### 📅 Budgets
Set monthly spending limits by category. MUDRA tracks how much of each budget has been used and how much remains — helping users spend with awareness rather than impulse.

### 🎯 Goals
Define financial goals (emergency fund, trip savings, gadget purchase) and track progress toward them. Visualise how close you are to achieving each target.

### 🔁 Recurring
Track subscriptions, EMIs, and fixed monthly expenses that repeat automatically. Never be surprised by a charge you forgot about.

### 👤 About
A dedicated page introducing the developer, the motivation behind MUDRA, and contact information.

---

## Workflow Diagrams

### 1 — User Authentication Flow

```
User visits MUDRA
        │
        ▼
  ┌─────────────────────┐
  │   Landing Page      │
  │  (Hero + Features)  │
  └─────────┬───────────┘
            │ scrolls down
            ▼
  ┌─────────────────────┐
  │   Login / Sign Up   │
  └──────┬──────┬───────┘
         │      │
    Sign Up   Sign In
         │      │
         ▼      ▼
  ┌─────────────────────┐
  │  Supabase Auth      │◄─── Google OAuth (redirect flow)
  └──────────┬──────────┘
             │ on success
             ▼
  ┌─────────────────────┐      ┌──────────────────────┐
  │  Email Confirmation │      │  Google Sheets Log   │
  │  (if email signup)  │      │  (name, email,       │
  └──────────┬──────────┘      │   login time,        │
             │ confirmed        │   provider)          │
             ▼                 └──────────────────────┘
  ┌─────────────────────┐
  │     Dashboard       │
  └─────────────────────┘
```

### 2 — Data Flow (User → App → Database)

```
User Action (add transaction, set budget, etc.)
            │
            ▼
  ┌─────────────────────┐
  │   React Component   │
  │   (form / input)    │
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────┐
  │   Supabase Client   │
  │   (supabaseClient.js│
  └──────────┬──────────┘
             │
             ▼
  ┌─────────────────────────────────┐
  │         Supabase Backend        │
  │                                 │
  │  ┌──────────┐  ┌─────────────┐ │
  │  │   Auth   │  │  PostgreSQL │ │
  │  │  (users) │  │  Database   │ │
  │  └──────────┘  └─────────────┘ │
  │         Row Level Security      │
  │    (each user sees only         │
  │         their own data)         │
  └─────────────────────────────────┘
             │
             ▼
  Data returned → React state updated → UI re-renders
```

### 3 — Hero Scroll Animation Flow

```
Page Load
    │
    ▼
50 currency notes initialised
at random positions across viewport
    │
    ▼
┌──────────────────────────┐
│   requestAnimationFrame  │◄─────────────────┐
│   loop running at 60fps  │                  │
└────────────┬─────────────┘                  │
             │                                │
    ┌────────▼────────┐              ┌────────┴────────┐
    │  Cursor nearby? │──── YES ────►│  Apply repulsion│
    └────────┬────────┘              │  force to note  │
             │ NO                    └─────────────────┘
             ▼
    ┌─────────────────┐
    │  Scroll detected│
    └────────┬────────┘
             │
    scroll progress 0 → 1
             │
             ▼
    ┌─────────────────────────────┐
    │  Interpolate note position  │
    │  from: random scatter       │
    │  to:   denomination stacks  │
    │  (₹10, ₹20, ₹50, ₹100...)  │
    └─────────────────────────────┘
             │
             ▼
    Notes form neat stacks
    → Features section appears
    → Login section below
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite | UI framework and dev server |
| **Styling** | Tailwind CSS + Inline styles | Layout and component design |
| **Auth** | Supabase Auth | Email/password + Google OAuth |
| **Database** | Supabase (PostgreSQL) | All user financial data |
| **Security** | Row Level Security (RLS) | Each user sees only their own data |
| **Deployment** | Vercel | Hosting and CI/CD |
| **Analytics** | Google Sheets + Apps Script | Developer-side user login tracking |
| **AI Assistance** | Claude (Anthropic) | UI design and implementation support |

---

## Project Structure

```
finance-app/
├── public/
│   └── khushi.jpg               # Developer photo (About page)
├── src/
│   ├── components/
│   │   └── Layout.jsx           # Sidebar navigation shell
│   ├── context/
│   │   └── AuthContext.jsx      # Auth state + Supabase calls
│   ├── lib/
│   │   └── supabaseClient.js    # Supabase initialisation
│   ├── pages/
│   │   ├── Landing.jsx          # Hero + Features + Login wrapper
│   │   ├── Login.jsx            # Auth form (sign in / sign up)
│   │   ├── Dashboard.jsx        # Overview page
│   │   ├── Accounts.jsx         # Account management
│   │   ├── Transactions.jsx     # Transaction log
│   │   ├── Budgets.jsx          # Budget tracker
│   │   ├── Goals.jsx            # Savings goals
│   │   ├── Recurring.jsx        # Recurring expenses
│   │   └── About.jsx            # Developer info + contact
│   ├── App.jsx                  # Route definitions
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── .env                         # Supabase keys (not committed)
```

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js 18+
- A Supabase account
- A Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/khushishahs02/mudra-finance.git   # update with your actual repo URL
cd mudra-finance/finance-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
npm run dev
# App runs at http://localhost:5173
```

---

## Supabase Setup

The app requires the following tables in your Supabase project:

| Table | Key Columns |
|---|---|
| `users` | `id`, `name`, `email`, `created_at` |
| `accounts` | `id`, `user_id`, `name`, `balance`, `type` |
| `transactions` | `id`, `user_id`, `amount`, `category`, `date`, `note` |
| `budgets` | `id`, `user_id`, `category`, `limit`, `month` |
| `goals` | `id`, `user_id`, `name`, `target`, `saved` |
| `recurring` | `id`, `user_id`, `name`, `amount`, `frequency` |

Enable **Row Level Security** on all tables and create policies so users can only access rows where `user_id = auth.uid()`.

---

## Deployment

The app is built for deployment on **Vercel** (deployment in progress).

**When ready to deploy:**

```bash
# Step 1 — Push your code to GitHub first
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/khushishahs02/your-repo.git
git push -u origin main

# Step 2 — Install Vercel CLI
npm i -g vercel

# Step 3 — Deploy
vercel
```

**Then add these environment variables in the Vercel dashboard:**

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

> ⚠️ Never commit your `.env` file to GitHub. Add it to `.gitignore`.

---

## About the Developer

**Khushi Shah**
*Creator of MUDRA*

Khushi is an 18-year-old developer who built MUDRA as her first full-stack web application. The idea came from a personal frustration — money was disappearing without explanation, and every existing finance app felt either too complex or too generic.

MUDRA is her answer to that problem.

📧 [khushishahs.2006@gmail.com](mailto:khushishahs.2006@gmail.com)
🐙 [github.com/khushishahs02](https://github.com/khushishahs02)

---

## A Note from Khushi

*In her own words:*

---

I started this project primarily to gain hands-on experience — and I honestly did not know much about Claude when I began.

By the end of it, Claude became the best AI tool I have ever used. It solved my problems effortlessly, explained things clearly, and never made me feel lost. Through building MUDRA, I learned so many things I had never touched before:

- Working with **Supabase** for authentication and databases
- Understanding **API keys** and how to connect services securely
- Connecting a live app to **Google Sheets** via Apps Script
- Deploying a website live on the internet using **Vercel**
- Understanding **OAuth** and how Google sign-in works under the hood
- Building **physics-based animations** with requestAnimationFrame
- Designing a complete **multi-page React application** from scratch

Honestly, I am a different person after making this app.

The idea and design are completely mine. The UI design and implementation were built with the help of Claude AI — but every decision about what to build, how it should look, and what problem it should solve came from me.

If MUDRA helps even one person understand their money better, the mission is successful.

*— Khushi Shah*

---

## Contact & Feedback

I'd love to hear from you — whether it's a bug report, a feature idea, or just a note saying the app helped you.

| Channel | Link |
|---|---|
| 📧 Email | [khushishahs.2006@gmail.com](mailto:khushishahs.2006@gmail.com) |
| 🐙 GitHub | [github.com/khushishahs02](https://github.com/khushishahs02) |
| 🐛 Bug Reports | Open an issue on GitHub once the repo is public |

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

*Built with curiosity · Powered by coffee · Debugged at 2AM*

**₹ MUDRA — Because your finances deserve order.**

</div>