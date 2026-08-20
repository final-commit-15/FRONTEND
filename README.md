# 🚀 AgentForge Frontend

> **Modern AI Agent Orchestration Platform — Frontend**
>
> AgentForge Frontend is a production-ready React application that provides a beautiful dashboard for managing AI agents, tasks, executions, analytics, integrations, permissions, and system settings. It communicates with the AgentForge Backend through REST APIs and WebSockets to provide real-time monitoring and control.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38BDF8?logo=tailwindcss)
![React Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Overview

AgentForge is a modular AI agent management platform consisting of multiple repositories. This repository contains the **Frontend Dashboard**, responsible for the complete user interface and real-time interaction layer.

The frontend allows users to:

- 🤖 Manage AI agents.
- 📋 Create and organize tasks.
- ⚡ Monitor execution runs live.
- 📊 Visualize analytics and system health.
- 🔗 Connect external integrations.
- 🔐 Manage permissions and user settings.
- 📡 Receive live execution updates through WebSockets.

---

# ✨ Features

## Dashboard

- Live platform overview.
- Agent statistics.
- Execution metrics.
- Success rate visualization.
- System health widgets.
- Recent activity feed.

## Agents

- View all registered AI agents.
- Search and filter agents.
- Create new agents.
- Edit configurations.
- Enable/disable agents.
- View detailed capabilities and permissions.

## Tasks

- Create tasks.
- Assign tasks to agents.
- Search and filter tasks.
- View task details.
- Track task status.

## Executions

- Live execution monitoring.
- Retry failed executions.
- Cancel queued/running executions.
- Execution timeline.
- Execution logs viewer.
- Real-time WebSocket updates.

## Analytics

- Success rate charts.
- Agent usage analytics.
- Execution activity trends.
- Task activity metrics.
- Platform performance insights.

## Activity

- Platform-wide activity feed.
- User actions.
- Execution history.
- Agent events.

## Integrations

- GitHub.
- Slack.
- Discord.
- Google Drive.
- Notion.
- Jira.
- Gmail.
- Microsoft 365.
- Webhooks.
- Sync health monitoring.

## Permissions

- Agent tool permissions.
- Permission matrix.
- Role-based access preparation.

## Settings

- User preferences.
- Notifications.
- Security.
- System configuration.

---

# 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State Management | Zustand |
| Server State | TanStack React Query |
| Forms | React Hook Form |
| Validation | Zod |
| HTTP Client | Axios |
| Icons | Lucide React |
| Charts | Recharts |
| WebSocket | Native WebSocket API |
| Notifications | Custom Toast System |

---

# 📁 Project Structure

```text
agentforge-frontend/
│
├── public/
│
├── src/
│   ├── api/                  # API clients
│   ├── assets/
│   ├── components/
│   │   ├── agents/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── executions/
│   │   ├── layout/
│   │   ├── settings/
│   │   ├── tasks/
│   │   └── ui/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── router/
│   ├── store/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

# 🎨 Application Pages

| Route | Description |
|--------|-------------|
| `/login` | User authentication |
| `/register` | User registration |
| `/dashboard` | Platform overview |
| `/agents` | Agent management |
| `/agents/new` | Create agent |
| `/agents/:id` | Agent details |
| `/tasks` | Task management |
| `/tasks/new` | Create task |
| `/tasks/:id` | Task details |
| `/executions` | Execution monitoring |
| `/executions/:id` | Execution details |
| `/analytics` | Analytics dashboard |
| `/activity` | Activity timeline |
| `/integrations` | External integrations |
| `/permissions` | Permission management |
| `/settings` | User & system settings |

---

# 🔐 Authentication Flow

AgentForge uses **JWT-based authentication**.

## Flow

1. User logs in.
2. Backend returns Access Token and Refresh Token.
3. Tokens are stored securely in the frontend auth store.
4. Axios automatically attaches the access token.
5. `/auth/me` validates the current user.
6. Protected routes require authentication.
7. Logout clears tokens and cached queries.

### Supported Endpoints

```http
POST /api/v1/auth/login
POST /api/v1/auth/register
GET  /api/v1/auth/me
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

---

# 🌐 Backend Integration

The frontend communicates exclusively with the **AgentForge Backend**.

## REST API Modules

```text
/api/v1/auth
/api/v1/agents
/api/v1/tasks
/api/v1/executions
/api/v1/analytics
/api/v1/activity
/api/v1/integrations
/api/v1/settings
/api/v1/permissions
```

All requests are made using Axios with centralized interceptors.

---

# 📡 Real-Time Updates

AgentForge uses WebSockets for live execution monitoring.

## WebSocket Channels

| Endpoint | Purpose |
|----------|---------|
| `/ws/executions` | Execution list updates |
| `/ws/executions/{id}` | Individual execution updates |

Real-time events include:

- Execution queued.
- Running.
- Completed.
- Failed.
- Cancelled.
- Log streaming.

---

# 🧩 Integrations Supported

| Integration | Status |
|-------------|--------|
| GitHub | OAuth |
| Slack | OAuth |
| Discord | OAuth/Webhook |
| Google Drive | OAuth |
| Notion | OAuth |
| Jira | OAuth |
| Gmail | OAuth |
| Microsoft 365 | OAuth |
| Webhooks | Incoming & Outgoing |

Features include:

- Connect/Disconnect.
- Sync status.
- Last synced timestamp.
- Enable/Disable sync.
- Webhook management.
- Sync health.

---

# 📊 State Management

AgentForge separates **client state** and **server state**.

## Zustand

Used for:

- Authentication.
- User preferences.
- UI state.
- Theme.

## React Query

Used for:

- Agents.
- Tasks.
- Executions.
- Analytics.
- Integrations.
- Activity.
- Settings.

Benefits:

- Automatic caching.
- Background refetching.
- Mutation invalidation.
- Optimistic updates.
- Retry handling.

---

# 🎯 UI Components

Reusable UI library includes:

- Button
- Input
- Select
- Badge
- Card
- Skeleton
- Empty State
- Error State
- Toast
- Modal
- Page Header
- Loading Indicators

Designed with TailwindCSS and a consistent design system.

---

# 📈 Analytics Dashboard

Analytics provides:

- Execution Success Rate.
- Active Agents.
- Agent Usage.
- Execution Volume.
- Daily Activity.
- Average Duration.
- Platform Health Metrics.

Built using **Recharts**.

---

# ⚙️ Environment Variables

Create a `.env` file.

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000
VITE_APP_NAME=AgentForge
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 22+
- npm or pnpm
- AgentForge Backend running

## Installation

```bash
git clone https://github.com/your-org/agentforge-frontend.git

cd agentforge-frontend

npm install
```

## Run Development Server

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

# 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |

---

# 🧪 Frontend Architecture

```text
User
   │
   ▼
React Pages
   │
   ▼
Reusable Components
   │
   ▼
React Query Hooks
   │
   ▼
API Layer (Axios)
   │
   ▼
AgentForge Backend
   │
   ▼
Database + Celery + Redis
```

---

# 🔄 Data Flow

```text
Login
   │
   ▼
JWT Authentication
   │
   ▼
Protected Routes
   │
   ▼
REST API + WebSockets
   │
   ▼
Live Dashboard Updates
```

---

# 🎨 Design Principles

- Dark-first interface.
- Responsive layout.
- Modular components.
- Accessible controls.
- Loading skeletons.
- Error boundaries.
- Empty states.
- Live updates without refresh.

---

# 📦 Repository Relationships

AgentForge consists of eight repositories.

| Repository | Purpose |
|------------|---------|
| `agentforge-frontend` | React dashboard (this repository) |
| `agentforge-backend` | FastAPI backend |
| `agentforge-agents` | AI agent implementations |
| `agentforge-ai-services` | AI model orchestration |
| `agentforge-integrations` | OAuth & third-party integrations |
| `agentforge-shared` | Shared models and utilities |
| `agentforge-infra` | Docker, Redis, PostgreSQL, deployment |
| `agentforge-docs` | Documentation |

---

# 📌 Current Status

### Completed Frontend Modules

- Authentication UI
- Dashboard
- Agents
- Tasks
- Executions
- Execution Details
- Analytics
- Activity
- Integrations UI
- Permissions
- Settings
- Responsive Layout
- WebSocket Client
- React Query Integration
- Toast System

### Backend Integration Status

- Authentication API integration
- Agent API integration
- Task API integration
- Execution API integration
- Analytics API integration
- Activity API integration
- Integrations API integration
- WebSocket execution updates

---

# 🤝 Contributing

1. Create a feature branch.
2. Follow the project folder structure.
3. Keep components reusable.
4. Run lint and type-check before committing.
5. Open a Pull Request.

---

# 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**AgentForge Frontend** — *AI Agent Management Dashboard built with React, TypeScript, Vite, Tailwind CSS, React Query, and WebSockets.*

</div>
