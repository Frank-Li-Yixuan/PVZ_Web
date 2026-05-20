# Sprout & Steel V0.1

Phase 0 bootstrap for a web-based 2-player cooperative 2.5D plant-defense and gun-hero tower defense game.

This milestone only establishes the runnable monorepo foundation. Gameplay, multiplayer rooms, movement, plants, enemies, gunplay, waves, boss logic, final art, and final audio are intentionally out of scope for Phase 0.

## Stack

- Client: Phaser 3, TypeScript, Vite
- Server: Node.js, TypeScript, Socket.IO
- Shared: TypeScript package for common version/config/types
- Tests: Vitest

## Install

```bash
npm install
```

## Run

Start the client:

```bash
npm run dev:client
```

Client URL:

```text
http://127.0.0.1:5173
```

Start the server:

```bash
npm run dev:server
```

Server health URL:

```text
http://127.0.0.1:3001/health
```

## Validate

```bash
npm run typecheck
npm run test
npm run build
```

## Project Layout

```text
client/   Phaser/Vite client
server/   Node/Socket.IO server
shared/   Shared TypeScript constants and types
assets/   Art/audio pipeline folders and tracking docs
docs/     V0.1 design documents
tests/    Vitest tests
```

## Phase 0 Scope Boundary

Implemented:

- Project package setup and baseline scripts
- Phaser placeholder title screen
- Socket.IO-capable server startup and health endpoint
- Shared package with project runtime defaults
- Assets/docs folder preservation
- README install/run instructions

Not implemented yet:

- Multiplayer room logic
- Game loop
- Player movement
- Planting, enemies, gunplay, waves, boss, evolution, victory/defeat
- Final art/audio downloads
