# Project Context

## Purpose
A self-practice learning platform designed for middle school students to enhance their studying experience. The system provides:
- **Knowledge Point Organization**: Structured management of educational content and concepts
- **Quiz Input Handling**: Process and parse quiz questions from various sources (DOCX files, manual input)
- **Practice Sessions**: Students can select knowledge ranges and practice strategies to customize their learning experience
- **Adaptive Learning**: Different practice strategies to match student needs
- **Teacher Tools**: DOCX parsing and quiz management capabilities for educators

## Tech Stack

### Backend
- **Nx Monorepo** (v17.1.3) - Build system and workspace management
- **NestJS** - Backend framework for REST API
- **TypeScript** - Strict typing throughout codebase
- **PostgreSQL 15.5** - Primary database (port 7543)
- **Hasura GraphQL Engine** - GraphQL layer and metadata management (port 28717)
- **Redis** - Caching layer
- **Slonik** - Type-safe PostgreSQL client
- **Zod** - Runtime schema validation
- **Passport JWT** - Authentication
- **OpenAI GPT** - Intelligent quiz generation
- **Pino** - Structured logging

### Frontend
- **React** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Lucide React** - Icon library

### Package Manager
- **pnpm** - Fast, disk space efficient package manager

### Development Tools
- **Docker Compose** - Local service orchestration
- **Prettier** - Code formatting
- **Jest** - Unit testing
- **Supertest** - E2E API testing
- **asdf** - Runtime version management

## Project Conventions

### Code Style
- **Formatting**: Prettier for all TypeScript, JavaScript, JSON, and Markdown files
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Naming Conventions**:
  - PascalCase for classes, interfaces, types, enums
  - camelCase for variables, functions, methods
  - UPPER_SNAKE_CASE for constants and environment variables
  - kebab-case for file names and package names
- **Import Organization**: Absolute imports using workspace aliases (e.g., `@kedge/auth`)
- **No emojis in code or documentation** unless explicitly requested

### Architecture Patterns
- **Monorepo Structure**: Nx workspace with clear separation between apps and libs
  - `packages/apps/` - Application entry points (api-server)
  - `packages/libs/` - Shared libraries (auth, quiz, persistent, etc.)
  - `packages/dev/` - Development tools and infrastructure
- **Layered Architecture**:
  - Controllers: HTTP request handling and validation
  - Services: Business logic and domain operations
  - Repositories: Data access layer with Slonik
  - Models: Type definitions and Zod schemas
- **Repository Pattern**: Abstract database operations behind repository interfaces
- **Dependency Injection**: NestJS DI container for service management
- **Domain-Driven Design**: Separate domain logic from infrastructure concerns
- **Result Type Pattern**: Use Result<T, E> for error handling instead of exceptions where appropriate

### Testing Strategy
- **Unit Tests**: Jest with `*.spec.ts` files alongside source code
- **E2E Tests**: Supertest in `external-api-e2e` package for API integration testing
- **Test Commands**:
  - `nx test <package>` - Run unit tests for specific package
  - `nx run-many --target=test --all` - Run all tests
- **Pre-commit Requirements**: Run tests before committing changes
- **Type Safety**: Always run `nx run-many --target=build --all` after backend changes to ensure type checking across the monorepo

### Git Workflow
- **Main Branch**: `main` - primary development branch
- **Commit Style**: Conventional commits encouraged
  - feat: New features
  - fix: Bug fixes
  - refactor: Code restructuring
  - chore: Maintenance tasks
- **Pre-commit Checks**: Format code with Prettier before committing
- **Code Review**: Changes should be tested and type-checked before merging

## Domain Context

### Educational Domain
- **Target Audience**: Middle school students (ages 11-15)
- **User Roles**:
  - **Students**: Practice quizzes, track progress, analyze knowledge gaps
  - **Teachers**: Upload materials, create quizzes, manage knowledge points
  - **Admins**: System management and configuration

### Core Entities
- **Knowledge Point**: Hierarchical organization of curriculum topics (subjects, chapters, sections)
- **Quiz**: Practice questions with multiple types (multiple choice, fill-in-blank, etc.)
- **Practice Session**: Student interaction with quizzes, including timing and strategy selection
- **Attachments**: Images and diagrams embedded in quiz questions

### Educational Workflows
1. **Teacher Workflow**: Upload DOCX → Parse highlights → Generate quizzes → Assign to knowledge points
2. **Student Workflow**: Select knowledge range → Configure practice → Complete quizzes → Review results
3. **Content Management**: Organize curriculum → Map questions to topics → Track learning progress

## Important Constraints

### Technical Constraints
- **Type Safety**: Strict TypeScript mode must be maintained across all packages
- **Build Verification**: Must run `nx run-many --target=build --all` after any backend changes
- **Port Allocation**:
  - API Server: 8718
  - PostgreSQL: 7543
  - Hasura GraphQL: 28717
  - Redis: Standard port with configurable DB
- **File Handling**: Image uploads limited by size and type validation
- **Authentication**: JWT-based, no session storage

### Business Constraints
- **Educational Focus**: Content must be appropriate for middle school level
- **Privacy**: Student data protection and secure authentication required
- **Performance**: Quiz loading and practice sessions must be responsive

### Development Constraints
- **Monorepo Discipline**: Changes must respect package boundaries and dependencies
- **Documentation First**: Frontend features require product documentation before implementation
- **No Premature Files**: Only create files when absolutely necessary; prefer editing existing files

## External Dependencies

### Required Services
- **OpenAI API**: GPT integration for intelligent quiz generation from teacher content
  - Configured via `OPENAI_API_KEY` environment variable
  - Used in `@kedge/quiz-parser` package
- **PostgreSQL 15.5**: Primary data store
  - Connection: `NODE_DATABASE_URL`
  - Migrations managed via Hasura
- **Redis**: Caching layer
  - Configuration: `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`
- **Hasura GraphQL Engine**: Metadata and migration management
  - Endpoint configuration via `HASURA_ENDPOINT` and `HASURA_SECRET`

### Development Dependencies
- **Docker & Docker Compose**: Local service orchestration
- **asdf**: Runtime version management for Node.js and other tools
- **pnpm**: Package management (do not use npm or yarn)

### Optional Services
- **External API** (api.zhushou.one): Currently used by frontend-quiz-parser (needs migration to local backend)
