# Kedge Boilerplate

- We use [Nx](./README_NX.md) as our build system.

## Workflow development
- `nx run api-server:serve` to start api-server, endpoint exposed at http://localhost:8718/v1/

## Development
To manually update database, run:

hasura migrate status --skip-update-check --endpoint $HASURA_ENDPOINT --admin-secret $HASURA_SECRET


## Environment Configuration

### Setting up environment variables
1. The `.envrc` file contains safe default values for local development
2. For production or environment-specific credentials:
   - Copy `.envrc.override.example` to `.envrc.override`
   - Update `.envrc.override` with your actual credentials
   - **IMPORTANT**: `.envrc.override` is gitignored and should NEVER be committed

```bash
cp .envrc.override.example .envrc.override
# Edit .envrc.override with your credentials
```

## Prerequisite

### Install asdf
1. install asdf
https://asdf-vm.com/guide/getting-started.html

2. install asdf plugins
```
cat .tool-versions | awk '{print $1}' | xargs -n 1 asdf plugin add
```

### Build all
nx run-many --target=build --all

## Production Deployment

### Build and Start with PM2

```bash
# 1. Go to backend directory
cd backend

# 2. Install dependencies
pnpm install

# 3. Build for production
npx nx build api-server --configuration=production

# 4. Source environment variables (generates .env file)
source .envrc

# 5. Start with PM2
pm2 start ecosystem.config.js --env production

# 6. Save PM2 process list (survives reboot)
pm2 save
```

### PM2 Commands

```bash
pm2 list                        # View status
pm2 logs kedge-api-server       # View logs
pm2 restart kedge-api-server    # Restart
pm2 stop kedge-api-server       # Stop
pm2 delete kedge-api-server     # Delete
```

### Redeploy after code changes

```bash
cd backend
git pull
pnpm install
npx nx build api-server --configuration=production
pm2 restart kedge-api-server
```

### Start from scratch

```bash
cd backend
git pull
pnpm install
npx nx build api-server --configuration=production
source .envrc
pm2 delete kedge-api-server 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
```


