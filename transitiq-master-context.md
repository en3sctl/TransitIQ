# TRANSITIQ - ENTERPRISE MASTER ARCHITECTURE & TECH SPECIFICATION (v4.0)
*Confidential System Context for Claude Opus - Lead AI Architect*

## 1. PROJECT MANIFESTO & SYSTEM GOALS
TransitIQ is a highly concurrent, scalable, AI-driven SaaS platform for National Fleet & Bus Ticket Management. We focus on HYPER-AUTOMATION, dynamic rendering, and seamless UX.
- **Frontend Core:** Next.js 14+ (App Router), React, Tailwind CSS, Framer Motion, shadcn/ui.
- **Backend Core:** Next.js API Routes (Serverless) shifting to Edge functions.
- **Database:** PostgreSQL managed via Prisma ORM.
- **State Management:** Zustand (Client-side) & Redis (Server-side distributed locks).
- **Design Rule:** 100% "21st Century" UI. Dark/Light mode natively supported. Zero cluttered layouts.

---

## 2. DIRECTORY STRUCTURE
Strict adherence to this structure is mandatory:
/src
 ├── /app / (customer, admin, api)
 ├── /components / (ui, shared, checkout, dashboard)
 ├── /lib / (prisma.ts, utils.ts, iyzico.ts, automation.ts)
 ├── /store / (useBookingStore.ts)
 ├── /types

---

## 3. CORE DATABASE SCHEMA (PRISMA)
*Gender adjacency rules have been ABOLISHED for higher conversion. The schema reflects a global, restriction-free ticketing model.*

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql", url = env("DATABASE_URL") }

enum Role { ADMIN, DRIVER, USER }
enum SeatStatus { AVAILABLE, LOCKED, SOLD }
enum TicketStatus { ACTIVE, CANCELLED, REFUNDED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  role          Role     @default(USER)
  firstName     String
  lastName      String
  tickets       Ticket[]
}

model Bus {
  id            String   @id @default(cuid())
  plateNumber   String   @unique // Integration with Govt APIs
  makeModel     String
  layoutType    String   // e.g., "2+1", "2+2", "1+1" -> DRIVES DYNAMIC UI GENERATION
  totalSeats    Int      // e.g., 41, 60
  trips         Trip[]
}

model Terminal {
  id            String   @id @default(cuid())
  city          String
  name          String
  lat           Float?
  lng           Float?
  departures    Trip[]   @relation("DepartureTerminal")
  arrivals      Trip[]   @relation("ArrivalTerminal")
}

model Trip {
  id            String   @id @default(cuid())
  busId         String
  bus           Bus      @relation(fields: [busId], references: [id])
  departureTime DateTime
  arrivalTime   DateTime
  basePrice     Float
  tickets       Ticket[]
  seats         SeatMap[]
}

model SeatMap {
  id            String     @id @default(cuid())
  tripId        String
  trip          Trip       @relation(fields: [tripId], references: [id])
  seatNumber    Int
  status        SeatStatus @default(AVAILABLE)
  lockedUntil   DateTime?  // Redis fallback for 10-min checkout lock
  ticket        Ticket?
}

model Ticket {
  id            String       @id @default(cuid())
  pnr           String       @unique // e.g., TX-19283
  tripId        String
  trip          Trip         @relation(fields: [tripId], references: [id])
  seatMapId     String       @unique
  seat          SeatMap      @relation(fields: [seatMapId], references: [id])
  passengerName String
  passengerTc   String
  pricePaid     Float
  status        TicketStatus @default(ACTIVE)
  paymentId     String       // Iyzico Transaction ID
  createdAt     DateTime     @default(now())
}

4. HYPER-AUTOMATION & DYNAMIC LOGIC (CRITICAL)
Rule 1: Dynamic Seat Map Engine (NO HARDCODING)

When rendering the bus on the frontend (Seat Selection or Admin), the layout is 100% mathematically generated based on the Bus.layoutType (e.g., "2+1") and Bus.totalSeats (e.g., 41). The code must automatically calculate rows, aisles, and the back row without manual positioning.
Rule 2: Global Hyper-Automation (Zero Touch Operations)

Every transaction must flow without human intervention:

    Purchase: Iyzico Webhook confirms payment -> Auto-generates PNR -> Marks seat SOLD.

    Delivery: System auto-generates a high-quality PDF ticket -> Auto-emails user (Resend/NodeMailer) -> Auto-SMS user with PNR (Netgsm/Twilio).

    Reminders: Cron jobs automatically trigger a "Journey Reminder" SMS 2 hours before departure.

    Refunds: If a user cancels via UI, the system automatically hits Iyzico Cancel/Refund API and frees the seat in the DB.

Rule 3: Concurrency / Seat Lock Protocol (10-Minute Rule)

Selected seats MUST be locked (lockedUntil = now() + 10 mins) during checkout to prevent double-booking. If payment fails or times out, the seat auto-releases.
5. ZUSTAND STATE MANAGEMENT (Frontend)
TypeScript

interface Passenger { seatNumber: number; tcKimlik: string; firstName: string; lastName: string; }
interface BookingStore {
  selectedTripId: string | null;
  selectedSeats: number[];
  passengers: Passenger[];
  addSeat: (seat: number) => void;
  removeSeat: (seat: number) => void;
  updatePassenger: (seat: number, data: Partial<Passenger>) => void;
}

6. CLAUDE OPUS INSTRUCTIONS

    PROACTIVE DEVELOPMENT: If building a feature, anticipate the automation behind it.

    NO DESTRUCTIVE REWRITES: Respect established UI animations (like the Success Page horizontal tear).

    TYPESCRIPT STRICT: Use explicit typings. No any.

    UI CONSISTENCY: Stick strictly to shadcn/ui enterprise aesthetics.