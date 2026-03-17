# 🚌 TransitIQ

> **Next-Generation Enterprise Logistics & Fleet Management SaaS**

TransitIQ is a comprehensive, scalable, and highly detailed fleet management platform designed for modern transportation companies. It handles everything from granular vehicle specifications and station management to dynamic route planning and role-based access control.

---

## ✨ Key Features

* **🏢 Enterprise-Grade Architecture:** Built with a scalable microservices-ready approach using NestJS and a robust PostgreSQL relational model.
* **🗺️ Dynamic Route & Station Engine:** Complex multi-stop scheduling. Manage physical terminals (stations) and link them seamlessly with geographical intelligence.
* **🚌 Advanced Fleet Management:** Go beyond basic vehicle tracking. Record chassis numbers, insurance dates, real-time status, and exact seating configurations.
* **🛡️ Granular Security (RBAC):** Built-in Role-Based Access Control (Super Admin, Company Admin, Operator, Driver) to ensure operations remain secure.
* **🎟️ Smart Booking System:** Transaction-safe booking engine preventing overbooking, complete with PNR generation and audit logging.
* **🐳 100% Dockerized:** One-click local deployment with Docker Compose, eliminating "it works on my machine" issues forever.

---

## 🛠️ Tech Stack

**Frontend:**
* Next.js (App Router)
* React & TypeScript
* Tailwind CSS & Shadcn/UI (For premium, accessible design)
* Next-Themes (Fluid Dark/Light Mode)

**Backend:**
* NestJS (Robust modular architecture)
* Prisma ORM (Type-safe database queries)
* PostgreSQL (NeonDB ready)
* JWT Authentication

**Infrastructure:**
* Docker & Docker Compose

---

## 🚀 Quick Start (Docker - Recommended)

The easiest way to get TransitIQ running is via Docker. Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/TransitIQ.git](https://github.com/yourusername/TransitIQ.git)
   cd TransitIQ

2. **Set up Environment Variables:**
Create a .env file in the root directory (Check .env.example for required keys):
  DATABASE_URL="postgresql://user:password@db:5432/transitiq?schema=public"
  JWT_SECRET="your_super_secret_key"

3. **Spin up the containers:**
    ```bash
    docker compose up --build

4. **Initialize the Database:**
In a new terminal window, push the database schema to the running PostgreSQL container:
    ```bash
    docker compose exec backend npx prisma db push

5. **Access the application:**
    ```bash
    Frontend: http://localhost:3001
    Backend API: http://localhost:3000

💻 Local Development (Without Docker)

If you prefer to run the application natively:

1. **Database:**
Ensure you have a PostgreSQL instance running and update your .env file with the correct DATABASE_URL.

2. **Backend:**
    ```bash
    cd backend # or root depending on your structure
    npm install
    npx prisma db push
    npm run start:dev

3. **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev

🏗️ Upcoming Features (Roadmap)

    [ ] Interactive Seat Selection UI for B2C Booking
    [ ] Live Fleet Tracking via WebSockets
    [ ] AI-Powered Dynamic Pricing Engine
    [ ] Driver Mobile Dashboard

Built with passion and vision for the future of transit.
