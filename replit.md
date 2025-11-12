# Overview

This monorepo houses two primary applications: **BERRETO Security Cloud**, a Next.js-based marketing and admin platform for an AI-powered CCTV security system with full e-commerce capabilities, and **Universal Camera Bridge**, a production-ready system for converting RTSP/ONVIF/P2P camera feeds into WebRTC and HLS for secure, live streaming. The project leverages AI features via Google Genkit and Firebase for backend services. BERRETO aims to provide real-time threat detection, smart alerts, visual search, and automated reporting, positioning itself as a leader in predictive security.

# Recent Changes

**November 12, 2025**:
- **Implemented Ezviz Cloud API integration** for worldwide camera access (like the Ezviz mobile app):
  - **Three-Way Connection Method**: Camera wizard now supports Manual IP Entry, Camera Bridge, AND Ezviz Cloud connection options
  - **Reverse-Engineered Ezviz API**: Created `/api/ezviz/auth` (login + device list) and `/api/ezviz/stream` (HLS stream URL) endpoints using reverse-engineered Ezviz Cloud API (similar to pyEzviz/Home Assistant approach)
  - **Refactored State Management**: Migrated from boolean `useBridge` to `connectionMethod` enum ("manual" | "bridge" | "ezviz") for cleaner three-way selection logic
  - **Step 3 Enhancements**: Added Ezviz Cloud login form (email/password/region), device picker showing all user's cameras with online/offline status, and session management with 24-hour expiry tracking
  - **Step 4 HLS Player**: Integrated HLS.js for live preview of Ezviz cloud streams, supporting both browser-native HLS (Safari) and HLS.js for other browsers
  - **Worldwide Access**: Ezviz cameras now accessible from anywhere via cloud, eliminating local network requirements

**November 11, 2025**: 
- Enhanced camera setup wizard with Bridge Creation Wizard. Step 3 presents two connection method options (Manual IP vs Camera Bridge).
- Added 3-step Bridge Creation Wizard that auto-generates secure configuration values (Bridge ID, Name, API Key using Web Crypto API).
- **Implemented automatic camera discovery system** (`/api/camera/discover`) with intelligent pre-flight checks:
  - **Network Compatibility Detection**: Uses ipaddr.js to detect if camera is on private network (192.168.x.x, 10.x.x.x) and if server can reach it
  - **Fast-Fail Pre-Flight Checks**: TCP connectivity test (2s timeout) before expensive RTSP probing
  - **45-Second Global Timeout**: Prevents 9+ minute hangs, returns helpful error messages
  - **Smart Error Messages**: Distinguishes between "cloud/local network mismatch", "camera unreachable", and "RTSP not supported"
  - Tests multiple ports (554, 8554, 8000, 80, 88, 7447, 10554) and common RTSP paths for Ezviz, Hikvision, and generic IP cameras
- Manual IP Entry mode auto-detects port and RTSP path from IP + credentials, eliminating guesswork for non-technical users.

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

The project uses a monorepo structure with npm workspaces, sharing a `@difae/ui` package and a custom Tailwind PostCSS package. State management varies, using React Context for global app state, Zustand for camera bridge, and TanStack Query for server state. Authentication relies on Firebase for frontend users and JWT (RS256) for camera stream authorization. Video streaming prioritizes WebRTC (Janus) for low latency, with HLS (nginx-rtmp and Ezviz Cloud HLS) as a fallback, supporting RTSP, ONVIF, P2P cameras, and cloud-based Ezviz cameras.

# External Dependencies

## Third-Party Services

**Firebase (Google Cloud)**: Used for Authentication, Firestore (database for users, orders, cameras), Cloud Storage (images, media), and Hosting.
**Google AI (Genkit)**: Integrates Gemini 2.0 Flash and Vertex AI for all AI-powered features.
**Ezviz Cloud API**: Reverse-engineered API integration for worldwide Ezviz camera access via HLS streams (similar to pyEzviz/Home Assistant approach).

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