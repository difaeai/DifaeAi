# Overview

This is a monorepo containing two distinct applications:

1. **DIFAE AI Security Cloud** - A Next.js-based marketing website and admin platform for an AI-powered CCTV security system that provides real-time threat detection, smart alerts, visual search, and automated reporting.

2. **Universal Camera Bridge** - A production-ready system for bridging RTSP/ONVIF/P2P camera feeds into WebRTC and HLS playback paths, enabling secure camera connections and live streaming.

The repository uses a monorepo structure with npm workspaces and includes shared UI components, AI-powered features using Google's Genkit, and Firebase for backend services.

## Recent Changes

**November 10, 2025 - Replit Migration Completed**
- Successfully migrated DIFAE AI Security Cloud from Vercel to Replit
- Fixed monorepo structure: Main DIFAE app now running from `src/app/` (root Next.js app)
- Updated Next.js dev server to bind to 0.0.0.0:5000 for Replit compatibility
- Replaced custom Tailwind v4 PostCSS package with standard Tailwind v3 configuration
- Fixed TypeScript configuration with proper path mappings for `@/*` imports
- Removed Firebase loading dependency - pages now load immediately with fallback content
- All core pages verified working: Home, About, Agent, Products, Contact, Login, Signup, Admin
- Configured production deployment with autoscale target

**Technical Changes:**
- Updated `package.json` scripts to point to root Next.js app instead of `apps/web`
- Fixed `tsconfig.json` with correct path configuration and included `src` directory
- Replaced `@tailwindcss/postcss` with standard `tailwindcss` in PostCSS config
- Updated `tailwind.config.ts` with proper content paths and shadcn/ui color system
- Modified About, Agent, and Contact pages to load without waiting for Firebase data

**Known Issues:**
- Minor styling issue: Some text appears faded (low contrast) - CSS color variables may need adjustment
- React warning: Duplicate keys in footer component (non-critical)

**Security Notes:**
- ⚠️ Firebase configuration is currently hardcoded in `src/lib/firebase.ts` - should be moved to environment variables (NEXT_PUBLIC_FIREBASE_*) for production
- Server-side Firebase Admin requires `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable (JSON format)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**DIFAE AI Marketing Site (Next.js 14 App Router)**
- Built with Next.js 14 using the App Router pattern
- Server and client components with React Server Components
- Tailwind CSS for styling with custom design tokens
- shadcn/ui component library (Radix UI primitives)
- Firebase Authentication for user management
- Shopping cart functionality with context-based state management
- Responsive design with mobile-first approach

**Camera Bridge Frontend (Vite + React)**
- Standalone React application using Vite for development
- TanStack Query for server state management
- Zustand for local state management
- HLS.js integration for video playback
- Onboarding wizard for camera setup
- WebRTC and HLS fallback player support

**Admin Panel (Next.js)**
- Separate Next.js application for content management
- Shared UI components from the `@difae/ui` package
- Firebase integration for data management

## Backend Architecture

**Bridge API (Fastify + TypeScript)**
- RESTful API built with Fastify
- OpenAPI/Swagger documentation
- JWT-based authentication using RS256
- Device registry and management
- Stream orchestration and playback token issuance
- CORS protection with configurable origins
- SQLite for development, designed for PostgreSQL in production

**Ingest Worker (Python FastAPI)**
- Orchestrates FFmpeg pipelines for video transcoding
- Handles RTSP/ONVIF stream ingestion
- Pushes streams to nginx-rtmp and Janus
- Reports metrics and health status back to Bridge API
- Async processing with asyncio

**Media Stack**
- Janus WebRTC gateway for low-latency streaming
- nginx-rtmp for HLS fallback and RTMP ingest
- Docker Compose orchestration for local development

**AI Features (Google Genkit)**
- Real-time threat detection flows
- Smart theft alerts with object tracking
- Visual search capabilities
- Automated security reporting
- Facial recognition
- Video analysis
- Page assistant chatbot

## Design Patterns

**Monorepo Structure**
- Separate apps for marketing site (`apps/web`), admin panel (`apps/admin`)
- Shared UI package (`packages/ui`) for component reuse
- Custom Tailwind PostCSS package for consistent styling
- npm workspaces for dependency management

**State Management**
- React Context for shopping cart and authentication
- Zustand for camera bridge state
- TanStack Query for server state caching

**Authentication & Authorization**
- Firebase Authentication on frontend
- JWT tokens (RS256) for camera playback authorization
- Short-lived tokens (5-10 minutes TTL)
- Environment-based key management

**Video Streaming Strategy**
- Primary: WebRTC via Janus for low latency
- Fallback: HLS via nginx-rtmp for compatibility
- Token-based access control for streams
- Support for RTSP, ONVIF, and P2P camera types

**Component Architecture**
- Server components for static content and SEO
- Client components for interactive features
- Shared component library with TypeScript
- Radix UI primitives with custom styling

# External Dependencies

## Third-Party Services

**Firebase (Google Cloud)**
- Authentication (email/password, social providers)
- Firestore for database storage (users, orders, cameras, content)
- Cloud Storage for images and media files
- Hosting for Next.js deployment
- Security Rules for data access control

**Google AI (Genkit)**
- Gemini 2.0 Flash model for AI features
- Vertex AI integration
- Real-time threat detection
- Visual search and facial recognition

## Media Infrastructure

**Janus WebRTC Gateway**
- WebSocket communication (default: ws://localhost:8188)
- ICE/STUN for peer connections
- Streaming plugin for video distribution
- Admin API for dynamic mount points

**nginx-rtmp**
- RTMP ingest on port 1935
- HLS output on port 8080
- Live streaming module
- Configurable stream authentication

**FFmpeg**
- Video transcoding and format conversion
- RTSP to RTMP/HLS pipeline
- Frame rate and bitrate monitoring
- Required on host system for bridge agent

## Development & Build Tools

**Package Management**
- npm 10+ with workspaces
- Node.js 20+ runtime
- Python 3.11+ for ingest worker

**Video Playback**
- HLS.js for HTTP Live Streaming
- jsmpeg for MPEG1 streams
- Native browser video APIs
- embla-carousel for media galleries

**UI Components**
- Radix UI for accessible primitives
- Lucide React for icons
- Tailwind CSS for styling
- class-variance-authority for component variants

**Testing & Quality**
- Vitest for unit tests
- Testing Library for component tests
- TypeScript for type safety
- ESLint and Prettier for code quality

## Databases

**Firestore (Production)**
- NoSQL document database
- Collections: users, orders, cameras, incidents, content
- Real-time synchronization
- Offline support

**SQLite (Development)**
- Device registry for camera bridge
- Embedded database for local testing
- Migration path to PostgreSQL planned

## Infrastructure

**Docker**
- Multi-service orchestration via Docker Compose
- PostgreSQL container for bridge metadata
- MediaMTX for test RTSP streams
- nginx-rtmp and Janus containers
- Bridge agent with host networking

**Deployment**
- Firebase Hosting for Next.js
- Vercel-compatible build output
- Environment variable configuration
- TLS/HTTPS required for production

**Security**
- RSA key pairs for JWT signing (development keys in `infra/keys`)
- AES-256 encryption for stored recordings (planned)
- CORS restrictions
- Rate limiting on discovery probes
- Audit logging for security events