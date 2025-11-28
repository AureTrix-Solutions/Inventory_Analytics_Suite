# Overview

This is a full-stack web application built with React and Express that provides inventory buffer calculation tools. The application features two main calculators: a standard buffer calculator that determines required safety stock levels based on historical demand, and a reverse TRR calculator that determines the maximum affordable lead time given current buffer levels. The calculators use statistical methods including Croston's method for intermittent demand forecasting and normal distribution analysis for service level optimization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript and Vite for fast development and optimized production builds.

**UI Component System**: shadcn/ui components based on Radix UI primitives, providing accessible and customizable UI elements with a consistent design system. The application uses the "new-york" style variant with Tailwind CSS for styling.

**Routing**: wouter for lightweight client-side routing, handling navigation between the home page and 404 not-found page.

**State Management**: TanStack Query (React Query) for server state management with infinite stale time and disabled auto-refetching, indicating a static or infrequently changing data model.

**Charts and Visualization**: Recharts library for rendering demand data visualizations and calculation results.

**Design Tokens**: Custom CSS variables defined in index.css for theming support, including light/dark mode variants and color system based on HSL values.

## Backend Architecture

**Server Framework**: Express.js with TypeScript, providing a RESTful API structure.

**Development Setup**: Custom Vite integration for HMR (Hot Module Replacement) during development, with middleware mode enabling seamless frontend/backend development experience.

**Static File Serving**: Production builds serve the Vite-built frontend from the `dist/public` directory, with fallback routing to index.html for SPA support.

**Build Process**: Custom esbuild configuration that bundles server code with selective dependency bundling (allowlist approach) to optimize cold start times by reducing filesystem syscalls. External dependencies not in the allowlist remain unbundled.

**Storage Layer**: Abstract storage interface (`IStorage`) with in-memory implementation (`MemStorage`) for user management. This abstraction allows easy swapping to database-backed storage without changing business logic.

## Data Storage

**Database ORM**: Drizzle ORM configured for PostgreSQL with schema validation through drizzle-zod.

**Schema Design**: Currently minimal schema with a users table containing id, username, and password fields. The schema uses PostgreSQL-specific features like `gen_random_uuid()` for primary key generation.

**Database Provider**: Configured to use Neon Database serverless PostgreSQL (@neondatabase/serverless), suitable for serverless and edge deployments.

**Migration Strategy**: Schema defined in `shared/schema.ts` with migrations output to `./migrations` directory. Uses `drizzle-kit push` for schema synchronization.

**Current State**: The application has database infrastructure configured but currently uses in-memory storage for the implemented features. The database setup appears to be preparatory for future features requiring persistent storage.

## External Dependencies

**UI Framework**: Extensive use of Radix UI primitives for accessible components (accordion, dialog, dropdown, select, tabs, toast, tooltip, etc.).

**Styling**: Tailwind CSS with custom configuration and postcss for processing. Uses tailwindcss Vite plugin for optimal integration.

**Form Handling**: React Hook Form with @hookform/resolvers for validation, integrated with Zod schemas for type-safe form validation.

**Date Utilities**: date-fns for date manipulation and formatting.

**Charts**: Recharts for data visualization.

**Mathematical Calculations**: Custom implementation of statistical functions (normal distribution CDF/inverse, Croston's method) in `client/src/lib/inventory-math.ts` for inventory buffer calculations.

**Development Tools**: 
- Replit-specific plugins (@replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner, @replit/vite-plugin-runtime-error-modal) for enhanced development experience on Replit platform
- Custom vite-plugin-meta-images for dynamic Open Graph image URL generation based on Replit deployment URLs

**Session Management**: express-session with connect-pg-simple for PostgreSQL-backed sessions (configured but not actively used in current implementation).

**Type Safety**: Comprehensive TypeScript configuration with strict mode enabled, path aliases for clean imports (@/, @shared/, @assets/), and ESNext module system.

## Notable Architectural Decisions

**Monorepo Structure**: Client and server code coexist in the same repository with shared types in a `shared/` directory, enabling type safety across the full stack.

**Bundle Optimization**: Selective server-side dependency bundling reduces the number of modules loaded at runtime, improving cold start performance - critical for serverless deployments.

**Progressive Enhancement**: Database infrastructure is configured but not required for current functionality, allowing the application to run with in-memory storage while being ready for persistent storage when needed.

**Component Composition**: Heavy use of component composition patterns with data slots and variant props for flexible, reusable UI components.

**Calculation Logic**: Statistical calculations are implemented client-side, reducing server load and enabling immediate feedback for users adjusting parameters.