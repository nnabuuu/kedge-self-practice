# Kedge Self-Practice Learning Platform

A comprehensive learning platform designed for middle school students to enhance their studying experience through intelligent quiz generation, practice sessions, and progress tracking.

## 🎯 Features

- **Smart Quiz Generation**: Extract quizzes from DOCX files with AI-powered question generation
- **Knowledge Point Management**: Organize curriculum with hierarchical topic structure
- **Adaptive Practice Sessions**: Multiple strategies including random, sequential, and weakness-focused
- **Progress Tracking**: Detailed analytics and performance metrics
- **Multi-Role Support**: Student, Teacher, and Admin roles with appropriate permissions
- **Image Support**: Handle diagrams and figures in quiz questions

## 🏗️ Architecture

```
├── backend/                 # Nx monorepo backend (NestJS + PostgreSQL + Hasura)
├── frontend-practice/       # Student practice application (React + Vite)
├── frontend-quiz-parser/    # Teacher quiz management (React + Vite)
└── docs/                    # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PostgreSQL client (optional, for direct DB access)
- asdf (recommended for version management)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/kedge-self-practice.git
cd kedge-self-practice

# Install tool versions (if using asdf)
asdf install

# Backend setup
cd backend
pnpm install
source .envrc  # Load environment variables

# Start infrastructure (PostgreSQL + Hasura)
dev-network up     # Create Docker network
dev-database up    # Start database and Hasura

# Run database migrations
cd packages/dev/database/schema
../bin/cli-hasura-darwin-arm64-2.35.1 migrate apply \
  --database-name main_db \
  --endpoint http://localhost:28717 \
  --admin-secret 9AgJckEMHPRgrasj7Ey8jR

# Start backend API server
nx serve api-server  # Runs on http://localhost:8718
```

## 💻 Development

### Backend Development

```bash
cd backend

# Start all services
dev-database up     # PostgreSQL (7543) + Hasura (28717)
nx serve api-server # API server (8718)

# Run commands
nx build api-server        # Build the application
nx test api-server         # Run tests
nx lint api-server         # Lint code
nx run-many --target=build --all  # Build all packages

# Database operations
hasura console  # Open Hasura console at http://localhost:28717
```

### Frontend Development

```bash
# Student Practice App
cd frontend-practice
npm install
npm run dev  # http://localhost:5173

# Teacher Quiz Parser
cd frontend-quiz-parser
npm install
npm run dev  # http://localhost:5174
```

### Environment Variables

Create `.envrc.override` in the backend directory:

```bash
# Database
export NODE_DATABASE_URL="postgres://postgres:postgres@127.0.0.1:7543/kedge_db"

# Hasura
export HASURA_ENDPOINT="http://localhost:28717"
export HASURA_GRAPHQL_ADMIN_SECRET="9AgJckEMHPRgrasj7Ey8jR"

# API Configuration
export API_PORT=8718
export JWT_SECRET="your-secret-key"

# Redis (if using)
export REDIS_HOST=localhost
export REDIS_PORT=6379

# OpenAI (for quiz generation)
export OPENAI_API_KEY="your-openai-api-key"
```

## 📦 Project Structure

### Backend Packages

| Package | Description | Port |
|---------|-------------|------|
| `api-server` | Main REST API (NestJS) | 8718 |
| `auth` | JWT authentication & guards | - |
| `common` | Shared utilities & error handling | - |
| `configs` | Configuration management | - |
| `models` | TypeScript schemas (Zod) | - |
| `persistent` | Database layer (Slonik) | - |
| `quiz` | Quiz domain logic | - |
| `quiz-parser` | DOCX parsing & GPT integration | - |
| `knowledge-point` | Knowledge point management | - |
| `database` | Hasura GraphQL & migrations | 28717 |

### API Endpoints

- **Auth**: `/api/v1/auth/*` - Registration, login, JWT tokens
- **Quiz**: `/api/v1/quiz/*` - Quiz CRUD, submission with images
- **Docx**: `/api/v1/docx/*` - Document upload and parsing
- **GPT**: `/api/v1/gpt/*` - AI-powered quiz generation
- **Attachments**: `/attachments/quiz/*` - Image serving

Swagger documentation: `http://localhost:8718/swagger-ui`

## 🚢 Deployment

### Local Deployment

```bash
cd backend

# Build all packages
nx run-many --target=build --all

# Start services
docker-compose -f packages/dev/database/docker-compose.yaml up -d
nx serve api-server --prod
```

### Remote/Integration Deployment

1. **Configure environment** in `.envrc.override`:
```bash
export NODE_DATABASE_URL="postgres://user:pass@host:port/database"
export HASURA_ENDPOINT="http://hasura-host:port"
export HASURA_SECRET="admin-secret"
```

2. **Run migrations**:
```bash
./tools/bin/migrate-remote integration
```

3. **Deploy API**:
```bash
nx build api-server
# Deploy dist/packages/apps/api-server to your server
```

### Docker Deployment

```bash
# Build Docker image
docker build -f packages/apps/api-server/Dockerfile -t kedge-api .

# Run container
docker run -p 8718:8718 \
  -e NODE_DATABASE_URL="..." \
  -e JWT_SECRET="..." \
  kedge-api
```

### PM2 Deployment (Production)

For production deployment with PM2 process manager:

```bash
# 1. Install PM2 globally (if not installed)
npm install -g pm2

# 2. Navigate to backend directory
cd /home/zjsnxc/kedge-self-practice/backend

# 3. Build the application
npx nx build api-server

# 4. Merge environment files (.envrc + .envrc.override = .env)
./merge-env.sh

# 5. Load environment variables and start with PM2
export $(cat .env | grep -v '^#' | xargs)
pm2 start dist/packages/apps/api-server/main.js \
  --name cyez-kedge-self-practice \
  --time

# 6. Save PM2 configuration for auto-restart on reboot
pm2 save
pm2 startup

# View logs
pm2 logs cyez-kedge-self-practice

# Other PM2 commands
pm2 list                              # List all processes
pm2 restart cyez-kedge-self-practice  # Restart the app
pm2 stop cyez-kedge-self-practice     # Stop the app
pm2 delete cyez-kedge-self-practice   # Remove from PM2
pm2 monit                             # Monitor resources
```

**Quick update and restart:**
```bash
cd /home/zjsnxc/kedge-self-practice
git pull
cd backend
npx nx build api-server
pm2 restart cyez-kedge-self-practice
```

## 🗄️ Database Management

### Migrations

```bash
# Check migration status
hasura migrate status --database-name main_db

# Create new migration
hasura migrate create <migration_name> --database-name main_db

# Apply migrations
hasura migrate apply --database-name main_db

# Rollback migration
hasura migrate apply --down 1 --database-name main_db
```

### Database Schema

- `kedge_practice.users` - User accounts and authentication
- `kedge_practice.knowledge_points` - Curriculum structure
- `kedge_practice.quizzes` - Quiz questions with image support
- `kedge_practice.practice_sessions` - Student practice tracking
- `kedge_practice.practice_questions` - Individual question attempts

## 🔧 Troubleshooting

### Common Issues

**1. Hasura migrations not running**
```bash
# Ensure Hasura is running and accessible
curl http://localhost:28717/healthz

# Check Hasura logs
docker logs $(docker ps -q -f name=hasura)

# Manually apply migrations
cd backend/packages/dev/database/schema
../bin/cli-hasura-darwin-arm64-2.35.1 migrate apply \
  --database-name main_db \
  --endpoint http://localhost:28717 \
  --admin-secret 9AgJckEMHPRgrasj7Ey8jR
```

**2. Database connection issues**
```bash
# Test PostgreSQL connection
psql postgres://postgres:postgres@localhost:7543/kedge_db

# Check Docker containers
docker ps
docker-compose -f backend/packages/dev/database/docker-compose.yaml logs
```

**3. Port conflicts**
```bash
# Check port usage
lsof -i :8718  # API server
lsof -i :7543  # PostgreSQL
lsof -i :28717 # Hasura

# Change ports in .envrc.override if needed
```

**4. Missing dependencies**
```bash
# Clear and reinstall
cd backend
rm -rf node_modules
pnpm install

# Clear Nx cache
nx reset
```

## 🧪 Testing

```bash
# Unit tests
nx test api-server
nx run-many --target=test --all

# E2E tests
nx e2e external-api-e2e

# Test with coverage
nx test api-server --coverage
```

## 📚 Documentation

- [Frontend Integration Guide](docs/instruction-docx-image-support.md) - Image support implementation
- [Deployment Guide](DEPLOYMENT-GUIDE.md) - Detailed deployment instructions
- [API Documentation](http://localhost:8718/swagger-ui) - Interactive API docs
- [CLAUDE.md](backend/CLAUDE.md) - AI assistant instructions

## 🛠️ Development Tools

### Nx Commands
```bash
nx list                    # List available plugins
nx graph                   # Visualize project dependencies
nx affected:build          # Build affected projects
nx migrate latest          # Update Nx workspace
```

### Hasura Console
Access at `http://localhost:28717/console` for:
- GraphQL playground
- Database schema viewer
- Migration management
- Metadata configuration

### VS Code Extensions
Recommended extensions:
- Nx Console
- Prisma
- GraphQL
- Docker
- PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For issues and questions:
- Check [Troubleshooting](#-troubleshooting) section
- Review existing [GitHub Issues](https://github.com/your-org/kedge-self-practice/issues)
- Contact the development team

## 🔐 Security

- JWT authentication for all API endpoints
- Role-based access control (Student, Teacher, Admin)
- Secure file upload with validation
- Environment-based configuration
- No hardcoded secrets

---

Built with ❤️ for enhancing middle school education