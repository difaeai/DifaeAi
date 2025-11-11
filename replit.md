# Overview

This monorepo houses two primary applications: **BERRETO Security Cloud**, a Next.js-based marketing and admin platform for an AI-powered CCTV security system with full e-commerce capabilities, and **Universal Camera Bridge**, a production-ready system for converting RTSP/ONVIF/P2P camera feeds into WebRTC and HLS for secure, live streaming. The project leverages AI features via Google Genkit and Firebase for backend services. BERRETO aims to provide real-time threat detection, smart alerts, visual search, and automated reporting, positioning itself as a leader in predictive security.

# Recent Changes

**November 11, 2025**: Enhanced camera setup wizard with Bridge Creation Wizard. Step 3 now presents two clear connection method options (Manual IP vs Camera Bridge) at the start. Added a 3-step wizard that auto-generates secure bridge configuration values (Bridge ID, Name, API Key using Web Crypto API), provides Docker/npm installation commands, and auto-fills form fields. The wizard is always accessible (can be reopened to regenerate values), all fields are editable, and Bridge URL includes quick-preset buttons. This significantly improves UX for non-technical users confused about where to find bridge values.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The **BERRETO Marketing Site** and **Admin Panel** are built with Next.js 14 (App Router), utilizing React Server Components, Tailwind CSS, and shadcn/ui. Firebase Authentication manages user access. The **Universal Camera Bridge** features a standalone React/Vite application with HLS.js for video playback, TanStack Query, and Zustand for state management.

## Backend Architecture

The **Bridge API** is a Fastify/TypeScript RESTful API handling device management, stream orchestration, and JWT-based authentication, backed by SQLite (development) and PostgreSQL (production). An **Ingest Worker** (Python FastAPI) orchestrates FFmpeg pipelines for RTSP/ONVIF stream ingestion to nginx-rtmp and Janus.

## AI Features

Integrated via Google Genkit, AI capabilities include real-time threat detection, smart theft alerts, visual search, automated security reporting, facial recognition, video analysis, and a page assistant chatbot, powered by Gemini 2.0 Flash.

## Design Patterns

The project uses a monorepo structure with npm workspaces, sharing a `@difae/ui` package and a custom Tailwind PostCSS package. State management varies, using React Context for global app state, Zustand for camera bridge, and TanStack Query for server state. Authentication relies on Firebase for frontend users and JWT (RS256) for camera stream authorization. Video streaming prioritizes WebRTC (Janus) for low latency, with HLS (nginx-rtmp) as a fallback, supporting RTSP, ONVIF, and P2P cameras.

# External Dependencies

## Third-Party Services

**Firebase (Google Cloud)**: Used for Authentication, Firestore (database for users, orders, cameras), Cloud Storage (images, media), and Hosting.
**Google AI (Genkit)**: Integrates Gemini 2.0 Flash and Vertex AI for all AI-powered features.

## Media Infrastructure

**Janus WebRTC Gateway**: For low-latency streaming via WebSockets and ICE/STUN.
**nginx-rtmp**: Provides RTMP ingest and HLS output for live streaming.
**FFmpeg**: Essential for video transcoding and stream conversion (RTSP to RTMP/HLS).

## Development & Build Tools

**Package Management**: npm 10+ with workspaces, Node.js 20+, Python 3.11+.
**Video Playback**: HLS.js, jsmpeg, native browser APIs, embla-carousel.
**UI Components**: Radix UI, Lucide React, Tailwind CSS, class-variance-authority.
**Testing & Quality**: Vitest, Testing Library, TypeScript, ESLint, Prettier.

## Databases

**Firestore**: Primary NoSQL document database for production.
**SQLite**: Used for development of the camera bridge device registry, with a planned migration to PostgreSQL.

## Infrastructure

**Docker**: Orchestrates multi-service environments (PostgreSQL, MediaMTX, nginx-rtmp, Janus) via Docker Compose.
**Deployment**: Firebase Hosting for Next.js applications, with Vercel-compatible build output.
**Security**: Utilizes RSA key pairs for JWT signing, planned AES-256 encryption for recordings, CORS restrictions, and audit logging.