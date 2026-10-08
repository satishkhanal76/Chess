# ♟️ Chess

A JavaScript implementation of chess built with modular, extensible game logic and a browser-based interface.

The project implements the core rules of chess as a reusable game engine rather than tying the rules directly to the user interface. The same engine can be used for local games in the browser or integrated into a multiplayer application.

## 🎮 Play

Live: https://satishkhanal76.github.io/Chess/

The application currently provides:

- **Classic Chess**
- **Two Queen** variant
- **Local games**
- **Online games** when used with the multiplayer server

The online functionality is used by the separate [ChessMultiplayer](https://github.com/satishkhanal76/ChessMultiplayer) project.

## ✨ Features

- Complete piece movement and capture logic
- Check and checkmate detection
- Stalemate detection
- Dead-position detection
- Threefold-repetition detection
- Castling
- En passant
- Pawn promotion
- Move history
- Undo / redo through a command-based move system
- Multiple board configurations
- Extensible game variants
- Local browser gameplay
- Socket.IO-based online gameplay

## 🧠 Engine First

The most important design decision in this project is the separation between the **game engine** and the **user interface**.

The rules of chess are implemented by the classes under `js/classes/`. The browser UI interacts with that engine instead of implementing its own copy of the rules.

This allows the same engine to be used in different environments:

```text
                         Chess Engine
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
          Local Browser              Multiplayer
                 │                         │
              Game UI                 Node.js Server
                                           │
                                      Socket.IO
```

This is also what allows the engine to live independently from the multiplayer application.

## 🧩 Extensible Architecture

The engine is organized around several independent concepts:

- **`Game`** coordinates the game lifecycle.
- **`Board`** owns the current board state and provides board-level validation.
- **`Piece`** and its subclasses implement piece-specific movement behavior.
- **Commands** represent individual moves and special moves.
- **Validators** determine whether a game has ended.
- **Variants** determine the board configuration and validators used by a game.
- **Board sets** define how pieces are initially placed.

Because these responsibilities are separated, adding a new game variant does not require rewriting the core `Game` class.

For a deeper explanation, see:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/variants.md`](docs/variants.md)

## 📁 Project Structure

```text
Chess/
├── css/
├── js/
│   ├── classes/
│   │   ├── board-sets/
│   │   ├── commands/
│   │   ├── pieces/
│   │   ├── players/
│   │   ├── sockets/
│   │   ├── utilities/
│   │   ├── validators/
│   │   ├── variants/
│   │   ├── Board.js
│   │   ├── FileRank.js
│   │   ├── FileRankFactory.js
│   │   ├── Game.js
│   │   ├── Listeners.js
│   │   └── Move.js
│   │
│   ├── GUI/
│   ├── Client.js
│   ├── ClientGame.js
│   ├── LocalGame.js
│   ├── OnlineGame.js
│   └── main.js
│
├── index.html
└── README.md
```

## 🚀 Running Locally

This is a browser-based ES module project and does not require a build system.

Clone the repository:

```bash
git clone https://github.com/satishkhanal76/Chess.git
cd Chess
```

Because the project uses JavaScript modules, serve the repository through a local web server rather than opening `index.html` directly with `file://`.

For example, with VS Code, the **Live Server** extension can be used.

Then open:

```text
index.html
```

through the local server.

## 🌐 Using the Engine in Another Project

The chess engine is intentionally kept separate from the browser-specific multiplayer infrastructure.

The [ChessMultiplayer](https://github.com/satishkhanal76/ChessMultiplayer) repository includes this repository as a Git submodule and uses the same engine for its server-side game state.

This means there is one implementation of the chess rules rather than separate client and server versions.

In a multiplayer game:

```text
Client
  │
  │ Move request
  ▼
Server
  │
  │ Game.movePiece(...)
  ▼
Chess Engine
  │
  ├── Invalid → reject
  │
  └── Valid → update state
                 │
                 ▼
              broadcast
```

The server therefore acts as the authoritative game state while still relying on the same engine used for local gameplay.

## 📚 Documentation

### [Architecture](docs/architecture.md)

Explains the internal class structure, responsibilities, move lifecycle, command system, validation system, and client/engine separation.

### [Variants](docs/variants.md)

Documents the implemented variants, their board configurations, and how the variant system can be extended.

## 🛠️ Future Development

The architecture is intended to make experimentation with new rules and game modes straightforward.

Potential directions include:

- Additional chess variants
- New game validators
- Alternative starting positions
- AI players
- Additional client interfaces
- Persistent game history
- More multiplayer functionality

These can be developed around the existing engine without coupling new functionality directly to the browser UI.

## 👤 Author

**Satish Khanal**

[GitHub](https://github.com/satishkhanal76)