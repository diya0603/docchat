# DocChat

A full-stack RAG (Retrieval-Augmented Generation) application that lets users upload PDF documents and ask questions about them using natural language. Built with LangChain agents, ChromaDB, FastAPI, and Next.js.

## Features

- Upload PDF documents and chat with them instantly
- Real-time streaming AI responses (token-by-token, like ChatGPT)
- Per-document conversation history persisted across sessions
- Secure multi-user authentication with JWT
- Document-scoped vector retrieval — queries never leak across documents
- PDF upload progress tracking

## Tech Stack

**Backend**
- FastAPI (Python) — REST API and SSE streaming
- LangChain + LangGraph — ReAct agent and RAG pipeline
- ChromaDB — vector store for semantic search
- PostgreSQL (Neon) — user, document, and conversation persistence
- SQLAlchemy ORM — database models and session management
- JWT (python-jose) + bcrypt (passlib) — authentication

**Frontend**
- Next.js 15 + TypeScript — React framework
- Tailwind CSS — styling
- js-cookie — JWT token management

**Infrastructure**
- Docker Compose — containerized local development

## Architecture

```
Next.js Frontend
      ↓ HTTP + JWT
FastAPI Backend
      ↓              ↓
PostgreSQL        ChromaDB
(users, docs,     (vector embeddings,
conversations,     scoped by document_id)
messages)
```

The frontend and backend are completely decoupled services — Next.js communicates with FastAPI over HTTP, passing JWT tokens for authentication on every request.

## How It Works

1. User uploads a PDF → backend chunks it, embeds it, stores in ChromaDB tagged with a `document_id`
2. User asks a question → LangChain ReAct agent decides when to call the retrieval tool
3. Retrieval tool does similarity search in ChromaDB, filtered to the specific document
4. Agent uses retrieved chunks as context to generate a grounded answer
5. Answer streams back to the frontend via SSE (Server-Sent Events)
6. Full conversation history is persisted in PostgreSQL and reloaded on return visits

## Running Locally

### Prerequisites
- Docker and Docker Compose
- A [Neon](https://neon.tech) PostgreSQL database
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- A [LangSmith](https://smith.langchain.com) API key (optional, for tracing)

### Setup

1. Clone the repository
```bash
git clone https://github.com/diya0603/docchat.git
cd docchat
```

2. Create `RAG Implementation/.env`:
```
DATABASE_URL=your_neon_postgres_url
GOOGLE_API_KEY=your_gemini_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
JWT_SECRET=your_random_secret_key
CHROMA_HOST=chromadb
CHROMA_PORT=8000
```

3. Create `rag-app-frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Start everything with Docker Compose:
```bash
docker-compose up --build
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
docchat/
├── RAG Implementation/     # FastAPI backend
│   ├── main.py             # API endpoints
│   ├── rag.py              # LangChain RAG pipeline
│   ├── models.py           # SQLAlchemy models
│   ├── database.py         # DB connection and session
│   ├── auth_utils.py       # JWT and password hashing
│   └── Dockerfile
├── rag-app-frontend/       # Next.js frontend
│   ├── app/
│   │   ├── components/     # Header, PageContainer
│   │   ├── chat/[id]/      # Chat page (dynamic route)
│   │   ├── documents/      # Document list
│   │   ├── upload/         # PDF upload
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   └── Dockerfile
└── docker-compose.yml
```
