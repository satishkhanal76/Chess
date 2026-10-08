# Architecture

The Chess engine is structured around a central `Game` object and several focused subsystems.

The main design goal is to keep **game state, rules, move execution, game-ending conditions, variants, and presentation** separate from one another.

## Overview

```text
                         ┌─────────────────┐
                         │     Client      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   ClientGame    │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │      Game       │
                         └───────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
          ┌────────┐       ┌──────────┐      ┌────────────┐
          │ Board  │       │  Turns   │      │ Validators │
          └────┬───┘       └──────────┘      └────────────┘
               │
        ┌──────┼─────────┐
        │      │         │
        ▼      ▼         ▼
      Pieces Commands  Positions
```

The browser UI sits outside the core engine.

For multiplayer, `OnlineGame` adds Socket.IO communication around the same `Game` object rather than replacing the engine with a separate implementation.

---

## Core Game

### `Game`

`Game` is the primary orchestration class.

It owns:

- The active variant
- The board
- The turn handler
- Players
- Game validators
- Move event listeners
- Game-over state
- Winner state

When a game is constructed, it asks its variant to create/populate the board and provide the validators that should apply to that game.

```text
Game
├── Variant
├── Board
├── TurnHandler
├── Players
├── GameValidators
└── MoveListeners
```

### Moving a Piece

A move passes through the `Game` object rather than modifying the board directly.

The general flow is:

```text
Move
 │
 ▼
Game.movePiece()
 │
 ├── Find source piece
 ├── Verify player turn
 ├── Determine command type
 ├── Create command
 ├── Validate command
 ├── Execute command
 ├── Store command
 ├── Advance turn
 ├── Validate game state
 └── Emit move event
```

This makes `Game` the coordinator of the overall move lifecycle.

---

# Board

### `Board`

`Board` represents the current physical state of the game.

It maintains a two-dimensional grid whose dimensions are supplied when the board is created.

The default board is 8×8, while variants can provide different dimensions.

The board is responsible for operations such as:

- Placing pieces
- Removing pieces
- Moving pieces
- Finding pieces
- Finding piece positions
- Querying pieces by type or colour
- Finding all valid moves
- Checking whether a king is in check
- Checking whether a piece is under attack
- Checking checkmate conditions
- Producing a position string used by repetition detection

The board also owns the `CommandHandler` used to track executed moves.

---

## Move Validation

The board delegates move validation to `MoveValidator`.

At a high level, a piece first generates its available movement positions.

The board then filters those moves against the state of the board.

One important part of this process is protecting the king from moves that would leave it in check.

```text
Piece
 │
 │ available movement
 ▼
Board
 │
 │ legal-position filtering
 ▼
MoveValidator
 │
 ▼
Valid moves
```

`Board.willMovePutKingInCheck()` temporarily applies a move, checks whether the relevant king becomes attacked, and then restores the original board state.

This allows legal moves to be determined without permanently modifying the board.

---

# Pieces

Pieces are represented by `Piece` and specialized subclasses:

```text
Piece
├── King
├── Queen
├── Rook
├── Bishop
├── Knight
└── Pawn
```

The base `Piece` class stores common information such as:

- Piece type
- Colour
- Display character
- FEN character
- Movement functions
- Whether the piece has moved

Each piece can expose available moves through the same interface.

The movement implementation can therefore be used by the board without needing to know the concrete piece type.

## `PieceFactory`

`PieceFactory` centralizes piece creation.

It maps piece metadata to the corresponding class and supports creating pieces from:

- A piece type and colour
- A FEN character

This is particularly useful for board-set construction because starting positions can be represented as strings rather than manually constructing every piece.

---

# Positions

`FileRank` and `FileRankFactory` provide the coordinate abstraction used by the engine.

Rather than passing raw board indexes throughout the application, game operations use `FileRank` objects to represent board positions.

The factory provides reusable position objects for coordinates.

Board dimensions are therefore handled separately from the higher-level game and piece APIs.

---

# Players and Turns

`Player` is intentionally small. It represents a participant through its colour.

`TurnHandler` manages which player is currently allowed to move.

The default client game creates:

```text
Player(WHITE)
Player(BLACK)
```

and adds both to the game.

`Game` uses the turn handler to ensure that a move is being made by the player whose turn it is.

---

# Commands

Moves are implemented using a command hierarchy.

```text
Command
├── MoveCommand
├── CastleCommand
├── EnPassantCommand
└── PromotionCommand
```

The base `Command` defines the common lifecycle:

```text
validate()
   │
   ▼
execute()
   │
   ▼
undo()
   │
   ▼
redo()
```

Each command knows how to apply and reverse its own state changes.

## Why Commands?

A move can involve more than simply moving one piece.

For example:

- A normal move may capture another piece.
- Castling moves both the king and rook.
- En passant moves a pawn while removing a different pawn from the destination square.
- Promotion replaces the pawn with another piece.

Representing these as separate commands keeps the special-case logic localized.

### Normal Move

`MoveCommand` validates the requested board move and moves the piece. If another piece occupies the destination, it records the captured piece as an affected piece.

### Castling

`CastleCommand` moves both the king and rook.

It verifies conditions including:

- The king has not moved.
- The king is not currently under attack.
- The rook has not moved.
- The path is available.
- The relevant path squares are not under attack.

### En Passant

`EnPassantCommand` handles the special capture position separately from the destination square.

### Promotion

`PromotionCommand` replaces the pawn with the requested promotion piece and records the resulting piece changes.

---

# Command History

`CommandHandler` maintains a command timeline.

It tracks:

- The complete command list
- The current position in the timeline
- The furthest command in the timeline

This provides the basis for undo and redo.

```text
Command 1 → Command 2 → Command 3 → Command 4
                              ▲
                         current state
```

Undo moves the current position backwards through the timeline.

Redo moves it forwards.

The command system also allows a new command to be introduced after an undo, handling the existing future commands appropriately.

---

# Game Validators

Game-ending conditions are implemented as separate validator objects.

The base `GameValidator` defines a common interface and result state.

Current validator types include:

```text
CheckmateValidator
StalemateValidator
DeadPositionValidator
ThreeFoldRepitionValidator
```

The `Game` class does not hard-code these rules.

Instead, it asks the active variant for its validators:

```javascript
this.#gameValidators = this.#variant.getGameValidators(this);
```

The game then runs the validators after a move.

This is one of the key extension points in the architecture.

---

## Checkmate

`CheckmateValidator` determines whether either player has been checkmated by using the board's checkmate calculation.

If only one player remains without a checkmate condition, that player is recorded as the winner.

## Stalemate

`StalemateValidator` checks the current player.

A stalemate occurs when:

- The current player's king is not in check.
- The current player has no legal moves.

## Dead Position

`DeadPositionValidator` currently handles several insufficient-material situations:

- King vs. King
- King + Bishop vs. King
- King + Knight vs. King
- King + Bishop vs. King + Bishop when both bishops are confined to the same colour of square

## Threefold Repetition

`ThreeFoldRepitionValidator` records the board position after moves and counts occurrences of the current position.

When the same position has occurred at least three times, the validator marks the game as over.

The current position representation is generated by `Board.getPositionAsString()`.

---

# Variants

Variants are responsible for providing the initial board configuration and the validators associated with a game.

The current implementation uses `ClassicalVariant` as the base variant and derives custom variants from it.

```text
ClassicalVariant
├── TwoQueenVariant
└── FourOFourVariant
```

A variant can override board creation while inheriting the rest of the game behavior.

For more detail, see [`variants.md`](variants.md).

---

# Board Sets

Board sets separate **where pieces start** from the rest of the game engine.

`ClassicalSet` contains the standard starting position as a FEN-like string:

```text
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
```

It parses the position and uses `PieceFactory` to create the corresponding pieces.

`CustomSet` extends `ClassicalSet` and allows a different position string to be supplied.

This makes custom starting positions possible without changing `Board` or `Game`.

---

# Client Architecture

The browser-facing portion of the project introduces another layer around the engine.

```text
Client
 │
 ├── LocalGame
 │      │
 │      └── ClientGame
 │              │
 │              └── Game
 │
 └── OnlineGame
        │
        ├── Socket.IO
        │
        └── ClientGame
               │
               └── Game
```

## `Client`

`Client` selects:

- Local or online game
- Game variant
- Socket
- Room ID

It creates the appropriate `LocalGame` or `OnlineGame` object.

## `ClientGame`

`ClientGame` connects a selected variant to a `Game` and `GameGUI`.

It also creates the two players.

`LocalGame` currently inherits this behavior without adding additional game logic.

## `OnlineGame`

`OnlineGame` extends `ClientGame` with Socket.IO behavior.

It listens for server-created games and incoming moves.

When a local move occurs, it listens to the engine's move event and sends the move to the server.

Incoming moves from the server are converted back into `Move` objects and passed through the same `Game.movePiece()` path.

This is important because the online client does not need a second move implementation.

---

# Multiplayer Integration

The standalone engine can therefore be embedded into the multiplayer project.

The multiplayer repository contains the `Chess` project as a Git submodule.

The server can create a `Game` using the same variants and game rules used by the browser.

The resulting architecture is:

```text
                  Chess Engine
                       │
             ┌─────────┴─────────┐
             │                   │
        Browser Client      Multiplayer Server
             │                   │
         Game / GUI            Game
             │                   │
             └─────────┬─────────┘
                       │
                  Same Rules
```

The multiplayer server can therefore act as the authoritative source of game state without creating a separate chess implementation.

---

# Extending the Engine

The architecture provides several natural extension points.

### New Piece

Create a new `Piece` subclass and add it to `PieceFactory`.

### New Move Type

Create a new `Command` subclass and add the appropriate command selection logic to `Game`.

### New Game-End Rule

Create a `GameValidator` subclass and add it to the relevant variant.

### New Starting Position

Create a `CustomSet` with a different position string.

### New Variant

Create a variant that configures its board and validators.

This allows new rules to be added without turning `Game` into a collection of variant-specific conditionals.

---

# Design Summary

The core architectural principle is separation of responsibility:

```text
Game
  └── coordinates the game

Board
  └── owns board state and board-level rule calculations

Piece
  └── owns piece-specific movement behavior

Command
  └── owns a move's state transition

CommandHandler
  └── owns move history

GameValidator
  └── owns game-ending conditions

Variant
  └── configures a particular game

ClientGame
  └── connects the engine to a client

OnlineGame
  └── adds multiplayer communication
```

This keeps the core engine independent of the browser interface and allows it to be reused by other applications, including the multiplayer server.