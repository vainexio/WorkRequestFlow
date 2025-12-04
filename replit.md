# WorkQuest - Work Request Management System

## Overview

WorkQuest is a full-stack work request management application designed for facility maintenance and operations. The system enables employees to submit work requests, technicians to manage and complete assigned tasks, and managers to oversee operations, approve requests, and track asset maintenance.

The application features role-based access control with three distinct user types (employee, technician, manager), comprehensive asset tracking with maintenance history, preventive maintenance scheduling, and detailed service reporting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. The design system uses a "new-york" style variant with CSS variables for theming.

**State Management**: TanStack Query (React Query) for server state management and data fetching. Authentication state is managed through a custom `AuthContext` provider.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**Form Handling**: React Hook Form with Zod for schema validation, integrated through `@hookform/resolvers`.

**Key Design Decisions**:
- Component-based architecture with reusable UI primitives
- Type-safe forms using Zod schemas
- Optimistic updates and background refetching via React Query
- Role-based component rendering for different dashboard experiences

### Backend Architecture

**Runtime**: Node.js with Express.js framework.

**Database**: MongoDB with Mongoose ODM for data modeling and validation.

**Session Management**: Express-session with MongoDB session store (`connect-mongodb-session`) for persistent user sessions.

**Authentication**: Session-based authentication without bcrypt - passwords are stored in plain text (suitable for development/demo purposes only).

**API Design**: RESTful API endpoints organized by resource type (auth, requests, assets, reports, etc.).

**Data Models**:
- **User**: Manages authentication and role-based access (employee, technician, manager)
- **WorkRequest**: Tracks maintenance requests from submission through resolution
- **Asset**: Manages equipment/machinery with maintenance history and health scoring
- **ServiceReport**: Detailed documentation of completed work with parts, labor, and findings
- **PreventiveMaintenance**: Scheduled maintenance tasks with frequency-based triggers

**Key Design Decisions**:
- Mongoose schemas for data validation and structure enforcement
- Session-based auth chosen for simplicity and built-in CSRF protection
- Embedded documents for related data (e.g., maintenance history within assets)
- Status-based workflows for request lifecycle management

### Build System

**Development**: 
- Vite dev server for frontend with HMR
- tsx for running TypeScript backend code directly
- Separate dev scripts for client and server

**Production**:
- Vite builds the React app to static assets
- esbuild bundles the server code with selective dependency bundling
- Build script coordinates both frontend and backend compilation
- Static file serving from Express for the production bundle

**Custom Plugins**:
- `vite-plugin-meta-images`: Updates OpenGraph meta tags with Replit deployment URLs
- Replit-specific plugins for development tooling (cartographer, dev banner)

### Code Organization

```
client/
  src/
    components/     # Reusable UI components
    pages/          # Route-level components per user role
    lib/            # Utilities, hooks, and data fetching
    hooks/          # Custom React hooks

server/
  models/          # Mongoose data models
  routes.ts        # API endpoint definitions
  db.ts            # Database connection
  index.ts         # Express app configuration

shared/
  schema.ts        # Shared type definitions (partially used, contains Drizzle schemas)
```

## External Dependencies

### Database
- **MongoDB Atlas**: Cloud-hosted MongoDB instance (connection via MONGODB_URI environment variable)
- **Mongoose**: ODM for MongoDB with schema validation

### UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Icon library for UI elements

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development server and build tool
- **esbuild**: Fast JavaScript bundler for production server code

### Session & State
- **express-session**: Session middleware
- **connect-mongodb-session**: MongoDB session store
- **TanStack Query**: Async state management for React

### Form Validation
- **Zod**: Runtime type validation
- **React Hook Form**: Form state management

### Environment Variables
The application requires the following environment variables:
- **MONGODB_URI**: MongoDB connection string (required)
- **SESSION_SECRET**: Secret key for session encryption (required)
- **PORT**: Server port (optional, defaults to 5000)

### Notes
- The `shared/schema.ts` file contains Drizzle ORM schemas for PostgreSQL, but the application currently uses MongoDB/Mongoose exclusively
- Frontend types are defined in `client/src/lib/types.ts`
- Authentication uses plain text passwords (appropriate for development only - password hashing should be implemented for production)