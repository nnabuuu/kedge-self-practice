# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a self-practice learning platform designed for middle school students to enhance their studying experience. The system provides:

### Core Educational Features
- **Knowledge Point Organization**: Structured management of educational content and concepts
- **Quiz Input Handling**: Process and parse quiz questions from various sources (DOCX files, manual input)
- **Practice Sessions**: Students can select knowledge ranges and practice strategies to customize their learning experience
- **Adaptive Learning**: Different practice strategies to match student needs

### Technical Stack
- **Nx** monorepo build system (v17.1.3)
- **NestJS** for backend services
- **PostgreSQL** database with Hasura GraphQL
- **Redis** for caching
- **TypeScript** with strict typing
- **OpenAI GPT** integration for intelligent quiz generation

## Project Management Practices

### Linear Integration
When working on features or tasks:
1. **Create Linear issues** for tracking major features
2. **Create sub-issues** for each implementation step/todo item
3. **Update issue status** as work progresses (Todo → In Progress → Done)
4. **Link related documentation** to issues for context

This helps maintain project visibility and progress tracking across the team.

## Core Commands

### Development
```bash
# Start API server (port 8718)
nx run api-server:serve

# Build all packages - ALWAYS RUN THIS AFTER BACKEND CHANGES!
nx run-many --target=build --all

# Build specific package
nx build api-server

# Run tests
nx test api-server
nx run-many --target=test --all

# Lint code
nx lint api-server
nx run-many --target=lint --all

# Format code (using prettier)
npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}"
```

### ⚠️ IMPORTANT: Type Checking After Backend Changes
**ALWAYS run `nx run-many --target=build --all` after modifying any backend code** to ensure all type checks pass across the entire monorepo. This catches type errors that might not be visible in a single package build due to the interdependencies between packages.

### Database Operations
```bash
# Check migration status
hasura migrate status --skip-update-check --endpoint $HASURA_ENDPOINT --admin-secret $HASURA_SECRET

# Apply migrations
hasura migrate apply --endpoint $HASURA_ENDPOINT --admin-secret $HASURA_SECRET

# Create new migration
hasura migrate create <migration_name> --from-server --endpoint $HASURA_ENDPOINT --admin-secret $HASURA_SECRET
```

## Architecture

### Monorepo Structure
```
backend/
├── packages/
│   ├── apps/           # Application entry points
│   │   ├── api-server/ # Main REST API (NestJS)
│   │   └── external-api-e2e/ # E2E tests
│   ├── libs/           # Shared libraries
│   │   ├── auth/       # JWT authentication & guards
│   │   ├── common/     # Shared utilities, logging, error handling
│   │   ├── configs/    # Configuration management
│   │   ├── models/     # TypeScript schemas & validation (Zod)
│   │   ├── persistent/ # Database layer (Slonik)
│   │   ├── quiz/       # Quiz domain logic
│   │   ├── quiz-parser/# Document parsing (DOCX, GPT integration)
│   │   └── knowledge-point/ # Knowledge point management
│   └── dev/            # Development tools
│       ├── database/   # Hasura GraphQL, migrations, seeds
│       └── network/    # Docker network configuration
```

### Package Details

#### Apps (`packages/apps/`)

**api-server**
- Main NestJS application serving REST API for the learning platform
- Port: 8718 (configurable via `API_PORT`)
- Swagger UI available at `/swagger-ui`
- Controllers:
  - `AuthController`: Student/Teacher registration, login, JWT token generation
  - `IndexController`: Health check and basic endpoints
  - `GptController`: GPT integration for intelligent quiz generation
  - `DocxController`: Process teacher-uploaded documents to extract quiz questions
- Uses Zod for request validation
- Global error handling with custom exceptions

**external-api-e2e**
- End-to-end testing suite for API
- Uses Jest and Supertest
- Tests API endpoints integration

#### Libraries (`packages/libs/`)

**auth** (`@kedge/auth`)
- JWT-based authentication using Passport
- User management (create, find, validate)
- Password hashing with PBKDF2
- Role-based guards: `AdminGuard`, `TeacherGuard`, `JwtAuthGuard`
- User roles: Admin (system management), Teacher (content creation), Student (practice)

**common** (`@kedge/common`)
- Shared utilities and helpers
- Pino logging configuration
- Custom error classes and HTTP error mapping
- Global queue management
- Safe utility functions for error handling
- BigInt JSON serialization support

**configs** (`@kedge/configs`)
- Centralized configuration management
- Environment variable validation
- Type-safe configuration access

**models** (`@kedge/models`)
- TypeScript interfaces and Zod schemas
- Domain models: User, Quiz, KnowledgePoint
- Request/Response DTOs
- JSON schema utilities
- Result type for error handling

**persistent** (`@kedge/persistent`)
- Database abstraction layer using Slonik
- PostgreSQL connection pool management
- Custom type parsers for BigInt, Numeric, Float
- Query logging interceptor
- Transaction support

**quiz** (`@kedge/quiz`)
- Quiz domain business logic for student practice
- Quiz CRUD operations (create, read, update, delete)
- Image storage service for quiz attachments (diagrams, figures)
- Quiz repository pattern implementation
- Manages quiz items that students will practice with

**quiz-parser** (`@kedge/quiz-parser`)
- DOCX file parsing to extract quiz questions from teacher documents
- Highlight extraction (teachers can highlight important content)
- GPT integration for intelligent quiz generation from content
- Document processing utilities
- Supports extracting highlighted text with colors for categorization

**knowledge-point** (`@kedge/knowledge-point`)
- Knowledge point management for organizing curriculum
- CRUD operations for educational content
- Repository pattern implementation
- Allows teachers to structure learning topics
- Students can select knowledge ranges for targeted practice

#### Development Tools (`packages/dev/`)

**database**
- PostgreSQL 15.5 on port 7543
- Hasura GraphQL Engine on port 28717
- Database migrations in `schema/migrations/main_db/`
- Seed data in `schema/seeds/main_db/`
- Tables: users, quizzes, knowledge_points
- Docker Compose configuration for local development

**network**
- Docker network configuration (`kedge_network`)
- Shared network for all services

### Key Technologies & Patterns

**Database Layer**:
- Slonik for PostgreSQL with type-safe queries
- Hasura GraphQL Engine for metadata management
- Migrations in `packages/dev/database/schema/migrations/`

**Authentication**:
- JWT-based authentication with Passport
- Custom guards: `AdminGuard`, `TeacherGuard`, `JwtAuthGuard`
- JWT secret configured via `JWT_SECRET` env var

**API Structure**:
- REST endpoints served at `http://localhost:8718/v1/`
- Controllers in `packages/apps/api-server/src/app/controllers/`
- Swagger documentation auto-generated

**Environment Configuration**:
- `.envrc` file contains all environment variables
- Override with `.envrc.override` (gitignored)
- Key variables: `NODE_DATABASE_URL`, `REDIS_HOST`, `API_PORT`, `OPENAI_API_KEY`

**Testing**:
- Jest for unit tests
- Test files alongside source as `*.spec.ts`
- E2E tests in `external-api-e2e` package

## Important Implementation Details

**Quiz Parser Module**:
- Extracts highlights from DOCX files
- Integrates with OpenAI GPT for question generation
- Storage path configured via `QUIZ_STORAGE_PATH`

**Error Handling**:
- Centralized error handling in `@kedge-boilerplate/common`
- Custom API errors with proper HTTP status codes
- Structured logging with Pino

**Database Connections**:
- Connection string: `NODE_DATABASE_URL`
- Redis: `REDIS_HOST:REDIS_PORT` (DB: `REDIS_DB`)
- Hasura: Port `28717` with admin secret

## Frontend Applications

Two React-based frontend proof of concepts are available at the project root:

### **frontend-practice/** - Student Practice Application
**Purpose**: Main application for middle school students to practice quizzes
**Tech Stack**: React + TypeScript + Vite + TailwindCSS + Lucide React

**Key Features:**
- Complete authentication flow (Student/Teacher roles)
- Subject selection (History, Biology) with hierarchical knowledge points
- Practice configuration (question types, count, time limits, shuffle)
- Interactive quiz practice interface with progress tracking
- Results analysis and knowledge point performance tracking
- Practice history with local storage persistence
- Teacher dashboard with basic management features

**Current State:**
- ✅ Fully functional with comprehensive mock data
- ✅ Responsive design with mobile-friendly interface
- ❌ Missing image support for quiz questions
- ❌ Not connected to local backend (uses mock API)

### **frontend-quiz-parser/** - Teacher Quiz Management
**Purpose**: Tool for teachers to upload DOCX files and extract quiz questions
**Tech Stack**: React + TypeScript + Vite + TailwindCSS + XLSX export

**Key Features:**
- DOCX file upload with drag-and-drop interface
- Step-by-step workflow: Upload → Parse → Quiz → Knowledge Point → Export
- AI-powered quiz extraction from highlighted text
- Knowledge point matching with curriculum standards
- Excel export functionality for quiz database
- Progress tracking with visual step indicators

**Current State:**
- ✅ Complete workflow implementation
- ✅ External API integration (api.zhushou.one)
- ❌ Missing image extraction from DOCX files
- ❌ Needs migration to local backend with image support

### **Frontend Integration Requirements**

**Critical Updates Needed:**
1. **API Migration**: Update from external API to local backend endpoints
2. **Image Support**: Implement image handling for DOCX extraction and quiz display
3. **Authentication**: Add JWT token management for API requests
4. **Backend Integration**: Connect to enhanced attachment system

**Key API Endpoint Changes:**
```typescript
// Current (external)
'https://api.zhushou.one/docx/upload'
// Should be
'http://localhost:8718/v1/docx/extract-quiz-with-images'

// New endpoints available
POST /quiz/submit-with-images
GET /attachments/quiz/:year/:month/:filename
GET /attachments/stats
```

**Image Support Requirements:**
- Process `{{img:N}}` placeholders in quiz text
- Display images inline with proper loading states
- Handle authentication for image requests
- Mobile-responsive image scaling
- Error handling for missing/failed images

**Documentation Available:**
- Comprehensive frontend integration guide in `docs/instruction-docx-image-support.md`
- Complete API examples and TypeScript interfaces
- Step-by-step migration instructions

## Development Workflow

1. **Prerequisites**: Install asdf and load tool versions
2. **Environment**: Source `.envrc` to load environment variables
3. **Dependencies**: Run `pnpm install` (uses pnpm package manager)
4. **Database**: Ensure PostgreSQL and Redis are running
5. **Development**: Use `nx serve api-server` for hot-reload development
6. **Frontend**: Run frontend apps with `npm run dev` in respective directories
7. **Testing**: Run tests before committing changes
8. **Building**: Use `nx build` for production builds

## Enhanced Features (Recently Added)

### **Image Processing System**
- **Enhanced DOCX parsing**: Extracts images from DOCX files along with text
- **Secure file storage**: Year/month directory structure with UUID filenames
- **Static file serving**: `/attachments/quiz/` endpoints with JWT authentication
- **Image validation**: File type, size, and security checks
- **Metadata tracking**: Complete attachment information with storage statistics

### **Quiz Management**
- **Multiple submission methods**: Single quiz, batch upload, with images
- **Enhanced storage**: Organized file system with portable URLs
- **Comprehensive validation**: Zod schemas for all quiz data
- **Attachment URLs**: Ready for frontend consumption

### **API Enhancements**
- **Swagger documentation**: Complete API docs at `/swagger-ui`
- **Error handling**: Structured error responses with proper HTTP codes
- **Authentication**: Role-based access control (Admin, Teacher, Student)
- **File management**: Complete attachment lifecycle management