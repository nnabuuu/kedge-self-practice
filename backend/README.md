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


