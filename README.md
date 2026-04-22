# MindSense Pro - Docker Deployment

This guide explains how to quickly run the full MindSense Pro stack (Frontend + Backend + AI) using Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

## Project Structure (Services)

- `front`: Vite + React app, exposed on port `3000`.
- `back`: Node.js + Express API, exposed on port `5020`.
- `ai`: FastAPI + ML inference service, exposed on port `8000`.

## Environment Setup

Before starting containers, make sure these files exist and are valid.

### 1) Backend environment (`back/.env`)

`docker-compose.yml` reads backend secrets from `back/.env`.

Example:

```env
PORT=5020
MONGO_URI="your_mongodb_connection_string"
JWT_SECRET="your_secret_key"
JWT_EXPIRES_IN=90d
EMAIL_USERNAME="your_email@gmail.com"
EMAIL_PASSWORD="your_email_app_password"
```

### 2) AI environment (`ai/.env`)

The AI service needs a Groq API key:

```env
GROQ_API_KEY=your_groq_api_key
```

Important: use `KEY=value` format (no spaces around `=`).

### 3) Required AI knowledge file

The AI service expects this file at startup:

- `ai/Rag/protocols.pdf`

If this file is missing, the AI container will fail to start.

## Running the Application

From the repo root (where `docker-compose.yml` lives), run:

```bash
docker compose up --build -d
```

- `--build`: builds fresh images for `front`, `back`, and `ai`.
- `-d`: runs containers in detached mode.

## Accessing the Apps

After containers are healthy:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5020](http://localhost:5020)
- AI API: [http://localhost:8000](http://localhost:8000)

## Useful Commands

### See live logs

```bash
docker compose logs -f
```

Or for a specific service:

```bash
docker compose logs -f front
docker compose logs -f back
docker compose logs -f ai
```

### Stop running containers

```bash
docker compose stop
```

### Remove containers and network

```bash
docker compose down
```

### Rebuild one service only

```bash
docker compose up --build -d front
docker compose up --build -d back
docker compose up --build -d ai
```

## Internal Service Wiring

- `back` calls AI through Docker network using `http://ai:8000`.
- `front` is built with `VITE_API_BASE_URL=http://localhost:5020/api`, so browser requests target host port `5020`.

## Troubleshooting

- If `ai` exits quickly, verify:
  - `ai/.env` has a valid `GROQ_API_KEY`.
  - `ai/Rag/protocols.pdf` exists.
- If `back` cannot connect to DB, verify `MONGO_URI` in `back/.env`.
- If frontend loads but API calls fail, check backend logs:
  - `docker compose logs -f back`
