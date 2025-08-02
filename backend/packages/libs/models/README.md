# Kedge Boilerplate

- We use Nx as our build system.

## Structure

All libraries are located at /packages/libs:
- auth:
- models: all zod defined data model including database
- persistent: database related

All database related SQL are located at /packages/dev/database/schema/migrations
To add new database schema, define the schema in a new migration file (the timestamp should increase)


## How to contribute:

## Workflow development
- `nx run api-server:serve` to start api-server, endpoint exposed at http://localhost:8716/api/v1/

## Development

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


