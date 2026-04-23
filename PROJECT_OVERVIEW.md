# Personalized AI-Powered Learning Management System (LMS)

This repository contains a state-of-the-art, full-stack educational platform that leverages Artificial Intelligence to provide a personalized learning experience for students, while offering robust management tools for teachers and administrators.

## 🚀 Overview

The project is more than just a chat application; it's a comprehensive ecosystem designed to modernize the learning experience. It combines traditional LMS features with advanced AI capabilities like semantic search, automated topic extraction, and personalized learning assistance.

---

## ✨ Core Features

### 👩‍🎓 Student Experience
- **Personalized AI Learning Assistant**: Each student has access to an AI tutor that understands their learning path, provides explanations, and answers questions in real-time.
- **Interactive Dashboards**: A modern, data-driven dashboard that tracks progress, streaks, and study time.
- **Dynamic Curriculum Navigation**: Navigate through Subjects, Chapters, and Topics with a streamlined, unit-focused interface.
- **Learning Tools**:
  - **Interactive Quizzes**: Test knowledge with immersive, distraction-free evaluation sessions.
  - **Flashcards**: Quick-review tool for memorizing key concepts.
  - **Mindmaps**: Visual representations of topic connections to help with structural understanding.
  - **Integrated Code Compiler**: Write and execute code directly within the platform for technical subjects.
- **Progress Tracking**:
  - **Competency Radar**: A visual radar chart showing strengths and weaknesses across different skills.
  -  **Skill Proficiency**: Detailed tracking of performance over time.
  - **Daily Streaks**: Gamified engagement tracking to encourage consistent learning.

### 👨‍🏫 Teacher Experience
- **Teacher Dashboard**: Monitor class performance, identify struggling students, and manage course content.
- **Content Management**: Organize curriculum into Subjects, Chapters, and Topics.
- **Resource Management**: Upload and manage educational materials for student access.

### 🔑 Administrator Experience
- **Admin Dashboard**: Oversight of all users (Students, Teachers) and platform-wide configurations.
- **User Management**: Secure role-based access control (RBAC) for managing accounts.
- **System Health Monitoring**: Tools to ensure platform stability and performance.

### 🤖 Advanced AI Capabilities
- **Semantic Search**: Search across chat history and educational resources using vector embeddings for context-aware results.
- **Auto-generated Titles**: Chat sessions are automatically named during the conversation based on the context of the first few messages.
- **Topic Extraction**: The system automatically detects and links topics discussed in chat to the official curriculum.
- **Vector Search & RAG**: Uses Retrieval-Augmented Generation (RAG) to ensure the AI assistant provides accurate, contextually relevant information from the learning materials.

---

## 🛠 Technology Stack

### Backend (Python/FastAPI)
- **FastAPI**: High-performance web framework for building the core logic and APIs.
- **MySQL (SQLAlchemy)**: Used for structured relational data (Users, Stats, Quiz results, Notes).
- **Neo4j**: A graph database utilized for complex relationships between users, chat sessions, messages, and topics.
- **JWT Authentication**: Secure, token-based authentication with role-based permissions.
- **LLM Integration**: Powering the AI chat, topic extraction, and title generation.
- **ChromaDB / Vector Storage**: Facilitates semantic search and embedding-based retrieval.

### Frontend (React/Vite)
- **React 19**: Modern UI library for building a responsive and interactive user interface.
- **Vite**: Ultra-fast build tool and development server.
- **Vanilla CSS**: Premium, custom-crafted styles with a focus on rich aesthetics, glassmorphism, and smooth transitions.
- **Axios**: Handling asynchronous API communications.

---

## 📂 Project Structure

```text
├── backend/
│   ├── routes/              # API Endpoints (Auth, Chat, Subjects, etc.)
│   ├── services/            # Business Logic (AI, Vector Search, Topics)
│   ├── models.py            # Database Schemas (SQLAlchemy)
│   ├── schemas.py           # Pydantic schemas
│   └── main.py              # Application Entrypoint
├── frontend-vite/
│   ├── src/
│   │   ├── pages/           # UI Components (Dashboards, Tools, Auth)
│   │   ├── services/        # Frontend API client logic
│   │   └── assets/          # Static media and design tokens
│   └── Dockerfile           # Frontend containerization
└── docker-compose.yml       # Service orchestration (MySQL, Neo4j, App)
```

---

## 🌟 Premium Design Philosophy
The application adheres to a "Visual Excellence" standard, featuring:
- **Rich Aesthetics**: Vibrant colors, sleek dark modes, and modern typography (inter/Roboto).
- **Interactive Elements**: Hover effects, micro-animations, and background blurs (glassmorphism).
- **Responsive Layouts**: Optimized for various screen sizes, ensuring a consistent premium feel.
