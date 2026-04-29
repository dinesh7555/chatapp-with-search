<<<<<<< HEAD
# AI Chat Application

A full-stack web application for interactive AI-powered conversations with chat history management, topic extraction, and embedding-based search capabilities.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Real-time Chat Interface**: Interactive chat with AI responses
- **Chat History**: Persistent storage of conversations
- **Topic Extraction**: Automatic topic detection using LLM
- **Vector Embeddings**: Semantic search across chat messages
- **Chat Management**: Create, retrieve, and manage multiple chat sessions
- **Auto-generated Titles**: Automatic chat session titles based on first 3 messages

## Architecture

The application is built with a microservices architecture using Docker Compose:

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL (relational data)
- **Graph Database**: Neo4j (chat relationships and topics)
- **Vector Storage**: Vector embeddings for semantic search
- **Authentication**: JWT-based auth with password hashing

### Frontend
- **Framework**: React 19
- **UI Components**: Custom CSS styling
- **API Client**: Axios for backend communication
- **State Management**: React hooks

### Services
```
├── backend/
│   ├── .env                 # Backend env variables (local)
│   ├── .env.example         # Backend env template
│   ├── .env.docker          # Backend env for Docker
│   ├── main.py              # FastAPI app initialization
│   ├── auth.py              # Authentication logic
│   ├── database.py          # MySQL connection
│   ├── neo4j_db.py          # Neo4j connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── routes/
│   │   ├── user.py          # Authentication endpoints
│   │   └── chat.py          # Chat endpoints
│   └── services/
│       ├── chat_service.py  # Chat session & message logic
│       ├── llm_service.py   # LLM response generation
│       ├── vector_service.py # Embedding & search
│       ├── topic_service.py # Topic extraction
│       └── title_service.py # Chat title generation
│
├── frontend-vite/
│   ├── .env                 # Frontend env variables (local)
│   ├── .env.example         # Frontend env template
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── README.md
│   ├── vite.config.js
│   ├── public/
│   │   └── robots.txt
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── pages/
│       │   ├── Auth.css
│       │   ├── Auth.jsx
│       │   ├── Chat.css
│       │   ├── Chat.jsx
│       │   └── ChatSidebar.jsx
│       └── services/
│           └── api.js
│
├── .env                     # Root env variables (Docker Compose)
├── .env.example             # Root env template
├── docker-compose.yml
├── README.md
└── package.json
   # AI Chat — Repository Overview

   This repository contains a full-stack AI chat application: a FastAPI backend that manages users, chat sessions, embeddings, and topics; and a React frontend (Vite) for an interactive chat UI. The project is configured to run locally or via Docker Compose.

   ## Quick Links
   - Frontend (Vite): [frontend-vite](frontend-vite)
   - Backend: [backend](backend)
   - Compose config: [docker-compose.yml](docker-compose.yml)

   ## Quick Start — Local (dev)

   1. Backend

      ```bash
      cd backend
      python -m venv .venv
      source .venv/bin/activate
      pip install -r requirements.txt
      # set env vars (see backend/.env.docker for examples) then:
      uvicorn main:app --reload --host 0.0.0.0 --port 8000
      ```

   2. Frontend (Vite)

      ```bash
      cd frontend-vite
      npm install
      npm run dev
      ```

   3. Open

      - Frontend (dev server): http://localhost:5173 (Vite default)
      - Backend API: http://localhost:8000
      - API docs: http://localhost:8000/docs

   ## Quick Start — Docker (recommended)

   1. Copy or edit environment variables in `backend/.env.docker` and `frontend-vite/.env` as needed.

   2. Build and run

      ```bash
      docker compose up --build
      ```

   3. Open

      - Frontend: http://localhost:3000
      - Backend: http://localhost:8000
      - Neo4j Browser: http://localhost:7474

   Notes: MySQL is exposed on 3306 by default in the compose file. Adjust firewall or host bindings if necessary.

   ## Project Structure

   Top-level folders and files:

   ```
   ai-chat-docker/
   ├── backend/           # FastAPI backend (Python)
   ├── frontend-vite/     # React + Vite frontend
   ├── docker-compose.yml # Docker Compose orchestration
   └── README.md          # This file
   ```

   Backend important files and folders:

   - [backend/main.py](backend/main.py): FastAPI app entrypoint; includes route registration and middleware.
   - [backend/auth.py](backend/auth.py): Authentication helpers and JWT logic.
   - [backend/database.py](backend/database.py): MySQL / SQLAlchemy configuration.
   - [backend/neo4j_db.py](backend/neo4j_db.py): Neo4j driver setup and helpers.
   - [backend/models.py](backend/models.py): SQLAlchemy models for users, chats, messages.
   - [backend/schemas.py](backend/schemas.py): Pydantic request/response schemas.
   - [backend/create_tables.py](backend/create_tables.py): Script to create/initialize database tables.
   - [backend/routes/user.py](backend/routes/user.py): User auth and profile endpoints.
   - [backend/routes/chat.py](backend/routes/chat.py): Chat-related endpoints (create, send message, history).
   - [backend/services/llm_service.py](backend/services/llm_service.py): Calls to the language model for responses and analysis.
   - [backend/services/chat_service.py](backend/services/chat_service.py): Chat/session business logic.
   - [backend/services/vector_service.py](backend/services/vector_service.py): Embedding generation and vector search helpers.
   - [backend/services/topic_service.py](backend/services/topic_service.py): Topic extraction and linking logic.
   - [backend/services/title_service.py](backend/services/title_service.py): Auto-generate chat titles.
   - [backend/requirements.txt](backend/requirements.txt): Python dependencies for the backend.

   Frontend (Vite) important files and folders:

   - [frontend-vite/.env](frontend-vite/.env): Frontend environment variables.
   - [frontend-vite/.gitignore](frontend-vite/.gitignore)
   - [frontend-vite/Dockerfile](frontend-vite/Dockerfile)
   - [frontend-vite/eslint.config.js](frontend-vite/eslint.config.js)
   - [frontend-vite/index.html](frontend-vite/index.html): App HTML shell.
   - [frontend-vite/nginx.conf](frontend-vite/nginx.conf)
   - [frontend-vite/package.json](frontend-vite/package.json)
   - [frontend-vite/README.md](frontend-vite/README.md)
   - [frontend-vite/vite.config.js](frontend-vite/vite.config.js)
   - [frontend-vite/public/robots.txt](frontend-vite/public/robots.txt)

   Source folder (`frontend-vite/src`):

   - [frontend-vite/src/main.jsx](frontend-vite/src/main.jsx): React entrypoint.
   - [frontend-vite/src/App.jsx](frontend-vite/src/App.jsx): Root app component.
   - [frontend-vite/src/App.css](frontend-vite/src/App.css)
   - [frontend-vite/src/index.css](frontend-vite/src/index.css)
   - [frontend-vite/src/assets/](frontend-vite/src/assets): Static assets.

   Pages:

   - [frontend-vite/src/pages/Auth.jsx](frontend-vite/src/pages/Auth.jsx) and [frontend-vite/src/pages/Auth.css](frontend-vite/src/pages/Auth.css)
   - [frontend-vite/src/pages/Chat.jsx](frontend-vite/src/pages/Chat.jsx) and [frontend-vite/src/pages/Chat.css](frontend-vite/src/pages/Chat.css)
   - [frontend-vite/src/pages/ChatSidebar.jsx](frontend-vite/src/pages/ChatSidebar.jsx)

   Services:

   - [frontend-vite/src/services/api.js](frontend-vite/src/services/api.js): API client and helpers.

   Other files:

   - [docker-compose.yml](docker-compose.yml): Describes services: mysql, neo4j, backend, frontend.
   - [frontend-vite/Dockerfile](frontend-vite/Dockerfile) and [backend/Dockerfile](backend/Dockerfile): Container build steps.

   ## Environment variables

   ### Setup

   Three `.env.example` files are provided as templates:

   - [.env.example](.env.example): Docker Compose-level vars (MySQL, Neo4j passwords, service ports).
   - [backend/.env.example](backend/.env.example): Backend config (database, Neo4j, JWT, LLM, CORS).
   - [frontend-vite/.env.example](frontend-vite/.env.example): Frontend config (API URL, feature flags).

   **For local dev:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend-vite/.env.example frontend-vite/.env
   # Edit the .env files with your local credentials
   ```

   **For Docker:**
   ```bash
   cp .env.example .env
   # Edit .env with Docker service credentials
   ```

   ### Common Variables

   - `DATABASE_URL` — e.g. mysql+mysqlconnector://root:password@mysql:3306/chatapp
   - `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` — Neo4j connection
   - `SECRET_KEY`, `ALGORITHM` — JWT settings
   - `VITE_API_URL` — Frontend API endpoint (e.g. http://localhost:8000)

   ## How the app works (high level)

   1. A user authenticates via the backend (JWT-based flows implemented in `backend/auth.py`).
   2. Chat sessions are created and messages are stored in MySQL (`backend/models.py`).
   3. Neo4j stores relationships (users → chats → messages → topics) to enable graph queries (`backend/neo4j_db.py`).
   4. Messages are sent to an LLM via `backend/services/llm_service.py` for AI responses, topic extraction, and title generation.
   5. Embeddings are generated in `backend/services/vector_service.py` for semantic search across messages.

   ## Running locally vs Docker

   - Local: run the backend with Uvicorn and the frontend with Vite dev server. Use local MySQL/Neo4j instances or cloud equivalents and set `DATABASE_URL`/`NEO4J_*` accordingly.
   - Docker: `docker compose up --build` will create MySQL and Neo4j containers and wire the backend and frontend together using the compose network.

   ## Common Commands

   Backend (local):

   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn main:app --reload
   ```

   Docker Compose:

   ```bash
   docker compose up --build
   docker compose down
   docker compose logs -f backend
   ```

   Frontend (Vite):

   ```bash
   cd frontend-vite
   npm install
   npm run dev
   ```

   ## Troubleshooting

   - If containers fail to start, inspect logs: `docker compose logs -f`.
   - Ensure ports 3000, 8000, 7474, 7687, and 3306 are available and not blocked by firewall.
   - Check credentials in `backend/.env.docker`.

   ## Notes & Next Steps

   - The README focuses on the current repo layout and quick start guidance. If you want, I can also:
     - Add a short developer guide for adding endpoints and components,
     - Provide example `.env` files with placeholders,
     - Add a healthcheck / readiness docs for production readiness.

   ---

   Last updated: January 2026
