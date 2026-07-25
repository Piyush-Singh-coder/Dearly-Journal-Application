# Dearly — A Modern Journaling Application

Dearly is an elegant, full-stack, real-time collaborative journaling application designed for individuals and teams. It provides a secure, distraction-free environment to capture thoughts, store memories, and co-write experiences seamlessly.

Built with a focus on minimalism, speed, and privacy, Dearly supports rich text editing, intelligent media management, mood tracking, and real-time collaboration.

---

## 🚀 Key Features

- **Personal & Team Notebooks**
  - Maintain private thoughts in isolated personal notebooks or share moments in collaborative team spaces.
  - Role-based access control using secure invitation links and email-based tokens.

- **Real-Time Collaboration**
  - Experience seamless, Google Docs-style real-time collaboration powered by **CRDTs (Conflict-free Replicated Data Types)**.
  - See active cursors, text highlights, and live presence of co-authors in team entries.

- **Rich Text Editing Environment**
  - Distraction-free content editor equipped with block-level formatting, markdown shortcuts, task lists, and inline styling.
  - Automated dynamic saving ensures no stroke of inspiration is ever lost.

- **Intelligent Media Attachments**
  - Seamlessly embed images and natively record/playback high-quality voice notes within journal entries.
  - Asynchronous background uploads handled through edge-optimized storage buckets.

- **Community Feed & Engagement**
  - Optionally share selected entries to a global, anonymized community feed.
  - Engage with others securely through non-intrusive reactions (❤️, 🔥, etc.) and nested threaded comments.

- **Beautiful, Responsive UI/UX**
  - Aesthetic design language utilizing smooth transitions, glassmorphism, responsive masonry layouts, and dark/light mode integration.
  - Fluid mobile-first execution, making edge-to-edge journaling a joy on smaller screens.

---

## 🛠 Technology Stack

Dearly leverages a modern, decoupled architecture splitting a lightweight JavaScript API from a highly reactive Single Page Application.

### Frontend
- **Framework:** React 18 (Vite)
- **State Management:** Zustand (for global application state), React Router DOM (for client-side routing)
- **Styling:** Tailwind CSS, Framer Motion (for fluid animations and layout transitions), Lucide React (for iconography)
- **Editor Engine:** Tiptap (Headless, prose-mirror based WYSIWYG editor integration with Yjs extensions)
- **Real-time Sync:** Yjs (for client-side CRDT state resolution), y-websocket

### Backend
- **Runtime:** Node.js, Express.js
- **Database ORM:** Prisma
- **Database Engine:** PostgreSQL (AWS RDS or Supabase)
- **File Storage:** AWS S3 (S3 SDK v3 for media/audio attachments)
- **Real-time Server:** Socket.io & Hocuspocus (WebSocket connections on AWS EC2)
- **Deployment:** AWS Amplify (Frontend), AWS EC2 (Backend), AWS S3 (Storage), AWS RDS (Database). See [AWS Deployment Guide](file:///c:/Users/pmiay/OneDrive/Documents/Dearly-JournalApplication/AWS_DEPLOYMENT_GUIDE.md).

---

## 📂 Project Structure

The repository is structured as a monolithic repository containing two primary environments:

```
├── backend/
│   ├── prisma/             # Prisma schema, migrations, and database seeders
│   ├── scripts/            # Database initialization and mock-data seed scripts
│   ├── src/
│   │   ├── controllers/    # Express route handlers containing business logic
│   │   ├── lib/            # Shared utilities (Supabase clients, Mailer config)
│   │   ├── middlewares/    # Authentication guards and request sanitizers
│   │   ├── routes/         # Express API routing definitions
│   │   └── server.js       # Main application entry point & Hocuspocus initialization
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/         # Static assets (Logos, placeholders)
    │   ├── components/     # Reusable React components (Modals, cards, UI elements)
    │   ├── hooks/          # Custom React hooks (e.g., useDebounce, useAutoSave)
    │   ├── layouts/        # Page wrappers and shared UI shells
    │   ├── lib/            # Frontend services (Axios instances, Socket integrations)
    │   ├── pages/          # Primary application views
    │   └── store/          # Zustand global state slices
    └── package.json
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL
- Supabase Project (for Authentication, Storage, and PostgreSQL hosting)
- Resend or SMTP Provider (for email services)

### 1. Clone the repository
```bash
git clone https://github.com/Piyush-Singh-coder/Dearly-Journal-Application.git
cd Dearly-Journal-Application
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=3000

# Prisma Database Configuration
DATABASE_URL="postgresql://[USER]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://[USER]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# JWT Config
JWT_SECRET="your_secure_jwt_secret"
JWT_EXPIRES_IN="7d"

# Supabase Credentials (from Project API Settings)
SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Email Configuration
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="..."
EMAIL_PASS="..."
FRONTEND_URL="http://localhost:5173"
```

Push the database schema and generate the Prisma Client:
```bash
npx prisma generate
npx prisma db push
```

*(Optional)* Seed the database with demo content:
```bash
node scripts/seed.js
```

Start the local API and WebSocket server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal session, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL="http://localhost:3000/api"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
```

Start the Vite development server:
```bash
npm run dev
```

The application will now be running at `http://localhost:5173`.

---

## 🛡️ License & Copyright
Built by [Piyush Singh](https://github.com/Piyush-Singh-coder). This project is intended for portfolio demonstration and open-source learning.
