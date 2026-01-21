# uwuuwu-araara - Random Video Chat Application

A full-stack random video chat application featuring text, audio, and video capabilities. Built with Next.js, Node.js, Socket.io, and WebRTC.

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS, Socket.io Client, Simple Peer (WebRTC)
- **Backend:** Node.js, Express, Socket.io, Redis, Prisma
- **Database:** PostgreSQL (via Supabase)
- **DevOps:** Docker, Docker Compose

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (Recommended)
- Redis (if running manually without Docker)

## Getting Started

### 1. Environment Setup

**Server:**

1. Navigate to the `server` directory: `cd server`
2. Create a `.env` file from the example: `cp .env.example .env`
3. Update `.env` with your credentials:
   - `DATABASE_URL` (Required: Your Supabase/Postgres connection string)
   - `REDIS_HOST`: Set to `redis` if using Docker, or `localhost` if running manually.

**Client:**

1. Navigate to the `client` directory: `cd client`
2. Create a `.env` file from the example: `cp .env.example .env`
3. Ensure `NEXT_PUBLIC_SOCKET_URL` points to your backend (default: `http://localhost:5001` or `http://localhost:5000`).

### 2. Running the Application

#### Option A: Using Docker (Recommended for Backend)

This method runs the Backend and Redis in containers, leaving you to run the Client locally for easy development.

1. **Start Backend & Redis:**
   From the project root:

   ```bash
   docker-compose up --build
   ```

   _The backend will be available at `http://localhost:5001`._

2. **Start Frontend:**
   Open a new terminal, navigate to `client`, and run:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   _The frontend will be available at `http://localhost:3000`._

#### Option B: Manual Setup (No Docker)

Requires local Redis installation.

1. **Start Redis:**
   Ensure your local Redis server is running (usually on port 6379).

2. **Start Backend:**

   ```bash
   cd server
   npm install
   npx prisma generate
   npm run dev
   ```

3. **Start Frontend:**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Project Structure

- `/client` - Next.js Frontend application
- `/server` - Node.js Express Backend with Socket.io
- `docker-compose.yml` - Docker configuration for Backend and Redis services
