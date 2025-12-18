# Void AI - AI Music Generation Platform

## Overview

Void AI is a web-based AI music generation platform that allows users to create studio-quality music tracks using AI. The application integrates with the KIE AI API to generate music based on text prompts, custom lyrics, and style preferences. Users can explore trending tracks, manage their music library, and play generated content through an integrated audio player.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **Styling**: Tailwind CSS v4 with CSS variables for theming, dark mode by default
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build**: esbuild for server bundling with selective dependency bundling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Tables**: 
  - `users` - User accounts with username/password
  - `tracks` - Generated music tracks with metadata (taskId, title, prompt, style, lyrics, audioUrl, imageUrl, duration, status)
- **Migrations**: Managed via `drizzle-kit push` command

### Project Structure
```
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/   # React components including UI primitives
│   │   ├── pages/        # Route page components (Home, Create, Library, Explore)
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and query client
├── server/           # Backend Express application
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database access layer
│   └── db.ts         # Database connection
├── shared/           # Shared code between client and server
│   └── schema.ts     # Drizzle schema and Zod validation
└── migrations/       # Database migrations
```

### Key Design Patterns
- **Shared Schema**: Database schemas and Zod validation schemas are defined in `shared/schema.ts` and used by both frontend and backend
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts database operations
- **API Request Helper**: `apiRequest` function in `client/src/lib/queryClient.ts` standardizes API calls
- **Path Aliases**: `@/` maps to client/src, `@shared/` maps to shared directory

## External Dependencies

### AI Music Generation
- **KIE AI API**: External service for AI music generation
  - Base URL: `https://api.kie.ai/api/v1`
  - Authentication: Bearer token via `KIE_API_KEY` environment variable
  - Endpoints used: `/generate` for music creation, `/query` for status polling

### Database
- **PostgreSQL**: Primary database
  - Connection via `DATABASE_URL` environment variable
  - Uses `pg` package for connection pooling

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-zod`: Database ORM and schema validation
- `@tanstack/react-query`: Async state management
- `wouter`: Client-side routing
- `zod`: Runtime type validation
- Radix UI primitives: Accessible UI component foundations
- `tailwindcss`: Utility-first CSS framework

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `KIE_API_KEY`: API key for KIE AI music generation service