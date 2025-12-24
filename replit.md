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

## Admin Features

### Promo Code System
- **Admin Panel** (`/admin`): Only visible to owners (users with `isOwner=true`)
- **Create Promo Codes**: Generate codes with plan type (pro/ruby/diamond), duration in days, max uses, and bonus credits
- **User Management**: View all users, update their plans, add credits
- **Code Redemption**: Users can redeem codes in Settings page to unlock premium plans for limited time

### Database Tables
- `promo_codes`: Stores promo codes with usage tracking
- `code_redemptions`: Tracks which users redeemed which codes
- `users.planExpiresAt`: Tracks when time-limited plans expire

## Android APK Build (Capacitor)

### Configuration
- **App ID**: `ai.void.music`
- **App Name**: `Void AI`
- **Build Tool**: Capacitor with Gradle
- **Config File**: `capacitor.config.ts`

### Building APKs

#### Option A: Local Build (requires Android SDK + Java)
1. Install Android SDK command-line tools and Java 17
2. Run: `./scripts/build-android.sh` for debug APK
3. Run: `./scripts/build-android.sh release` for release APK
4. APK output: `android/app/build/outputs/apk/`

#### Option B: Cloud Build (GitHub Actions)
1. Push code to GitHub repository
2. Go to Actions tab → "Build Android APK" workflow
3. Click "Run workflow" or push to main branch
4. Download APK artifacts when build completes

### Important Notes
- Before building, update `vite.config.ts` with `base: './'` for proper asset loading
- Release APKs need signing for distribution (see Android keystore docs)
- Debug APKs can be installed directly on Android devices for testing