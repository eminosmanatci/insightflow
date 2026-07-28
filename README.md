# 🚀 InsightFlow - Enterprise Analytics Platform
[![InsightFlow CI](https://github.com/eminosmanatci/insightflow/actions/workflows/ci.yml/badge.svg)](https://github.com/eminosmanatci/insightflow/actions/workflows/ci.yml)
InsightFlow is a modern, end-to-end Enterprise Analytics Platform designed to ingest, process, and analyze scattered business data. It transforms raw CSV data into actionable business intelligence using a robust ETL pipeline, SQL-based analytics, and an integrated AI Insight Engine (powered by Llama-3.1).

![InsightFlow Dashboard](https://via.placeholder.com/800x400.png?text=InsightFlow+Dashboard+Screenshot)

## 🏗️ Architecture & Tech Stack

This project is built with a focus on clean architecture, asynchronous processing, and scalability.

**Backend & Data Engineering:**

- **FastAPI:** High-performance async REST API.
- **PostgreSQL & SQLAlchemy:** Relational database and ORM for robust data modeling.
- **Pandas:** Data manipulation, cleaning, and normalization.
- **Passlib (Bcrypt) & JWT:** Secure authentication and role-based access.

**Frontend:**

- **React & Vite:** Lightning-fast, modern SPA.
- **Tailwind CSS:** Highly customizable, utility-first UI design.
- **Recharts:** Dynamic and responsive data visualization.

**AI Integration:**

- **Groq API (Llama-3.1):** High-speed LLM integration for automated business insights and anomaly detection.

**DevOps:**

- **Docker & Docker Compose:** Fully containerized environment for seamless deployment.

## ✨ Key Features (Phase 1 - MVP)

- **Secure Authentication:** JWT-based login and registration system.
- **Automated Data Pipeline:** Upload CSV datasets via the UI, processed in the background, and structured into the PostgreSQL database.
- **Analytics Engine:** Real-time calculation of key performance indicators (KPIs) and regional sales distributions using optimized SQL queries.
- **AI Insight Engine:** Automatically interprets dashboard metrics and generates strategic, natural language business summaries for C-level executives.
- **Modern Dashboard:** Clean, responsive, and data-dense UI tailored for enterprise usability.

## 🚀 Getting Started

You can spin up the entire platform (Database, Backend, and Frontend) with a single command using Docker.

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- A free API key from [Groq](https://console.groq.com/keys) for the AI Insight Engine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/eminosmanatci/insightflow.git](https://github.com/eminosmanatci/insightflow.git)
   cd insightflow
   ```
Configure Environment Variables:
Open backend/app/core/config.py and replace GROQ_API_KEY with your actual key.

Run the application:

Bash
docker-compose up -d --build
Access the platform:

Frontend Dashboard: http://localhost:5173

Backend API Docs (Swagger): http://localhost:8000/docs

🗺️ Roadmap (Upcoming Features)
[ ] Phase 2: Integrate Celery & Redis for heavy asynchronous task queues.

[ ] Phase 2: Implement advanced Role-Based Access Control (RBAC).

[ ] Phase 3: Interactive AI Chat Assistant ("Why did sales drop in July?").
