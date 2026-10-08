# Game Variants

The game engine supports multiple board configurations through the `Variant` layer.

A variant determines how a `Game` is initialized, including:

- Board dimensions
- Starting piece placement
- Game-ending validators
- Variant identity

The project currently contains two playable chess configurations and one special-purpose configuration used by the portfolio website:

```text
ClassicalVariant
└── TwoQueenVariant

FourOFourVariant
└── Special 404-page configuration
```

---

# Classic

`ClassicalVariant` is the standard chess configuration.

## Board

The board is:

```text
8 × 8
```

The standard starting position is represented by:

```text
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
```

This position is provided by `ClassicalSet`.

`ClassicalSet` parses the position and uses `PieceFactory` to construct the appropriate pieces.

## Validators

Classic games use the standard set of game-ending validators:

- Checkmate
- Stalemate
- Dead position
- Threefold repetition

## Pieces

Each side starts with:

- 1 King
- 1 Queen
- 2 Rooks
- 2 Bishops
- 2 Knights
- 8 Pawns

---

# Two Queen

`TwoQueenVariant` is a custom chess variant built by extending `ClassicalVariant`.

Rather than creating another chess engine specifically for the variant, it changes the board configuration while reusing the existing game, piece, move, and validation systems.

## Board

The board is:

```text
9 × 8
```

The starting position is:

```text
rnbqkqbnr/ppppppppp/8/8/8/8/PPPPPPPPP/RNBQKQBNR
```

This gives each side:

- 1 King
- 2 Queens
- 2 Rooks
- 2 Bishops
- 2 Knights
- 9 Pawns

The additional file allows the extra queen and pawn to fit into the starting position.

## Implementation

The variant provides a 9×8 board and a custom starting position while inheriting the rest of the standard game behavior.

Conceptually:

```text
ClassicalVariant
       │
       ▼
TwoQueenVariant
       │
       ├── 9 × 8 board
       ├── Custom starting position
       └── Standard game mechanics
```

This is an example of the engine's extensibility: a new variant can modify the parts that differ without duplicating the underlying chess implementation.

---

# FourOFour

`FourOFourVariant` is **not a chess variant intended for normal gameplay**.

It is a small easter egg / special-purpose configuration created for the author's personal portfolio website.

It is used as the visual representation of a **404 Not Found page**.

## The Idea

The board is intentionally missing both kings.

```text
404
```

Normally, a chess position has two kings.

Here, they are gone.

The idea is:

> **You're lost. Your kings are lost too.**

Instead of displaying a conventional 404 page, the portfolio can use the chess engine itself to create a small visual joke around the concept of being lost.

## Position

The configuration uses an otherwise familiar chess starting position with the two kings removed:

```text
rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR
```

The missing kings are intentional.

## Why It Lives in the Chess Engine

Although it is not a conventional game mode, `FourOFourVariant` is a useful demonstration of the flexibility of the variant architecture.

The engine allows a custom starting configuration to be defined without requiring the core board or piece systems to be rewritten.

That means the same underlying engine can be used for something that isn't even a playable chess game.

In the portfolio website, this configuration is used when a visitor navigates to a path that does not exist.

```text
                  Invalid URL
                      │
                      ▼
                   404 Page
                      │
                      ▼
              FourOFourVariant
                      │
                      ▼
               "You're lost."
                      │
                      ▼
             "So are the kings."
```

It's intentionally more of a design easter egg than a feature.

---

# How Variants Work

Variants are deliberately kept outside the core `Game` implementation.

`Game` asks the selected variant for the configuration it needs to initialize the game.

This allows variants to change things such as:

- Board dimensions
- Starting positions
- Game validators

without requiring variant-specific conditionals throughout the engine.

For example:

```text
                   Game
                    │
          ┌─────────┴─────────┐
          │                   │
 ClassicalVariant       TwoQueenVariant
          │                   │
       8 × 8                9 × 8
          │                   │
 Standard Set            Custom Set
```

The `FourOFourVariant` demonstrates that the same mechanism can also be used for custom visual experiences.

---

# Starting Positions

Starting positions are represented using a FEN-style board description.

For example, Classic:

```text
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
```

Two Queen:

```text
rnbqkqbnr/ppppppppp/8/8/8/8/PPPPPPPPP/RNBQKQBNR
```

404:

```text
rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR
```

`ClassicalSet` and `CustomSet` turn these descriptions into actual board pieces through `PieceFactory`.

This keeps board setup declarative: a new starting configuration can largely be described by its position string rather than requiring procedural piece placement.

---

# Adding a New Variant

A new variant can extend `ClassicalVariant` when the existing game behavior is appropriate.

The variant can provide:

1. A board with the required dimensions.
2. A starting position.
3. The appropriate game validators.

If the variant requires new game-ending rules, it can provide its own validators.

If it introduces a fundamentally new type of move, the command system provides the corresponding extension point.

This means a variant generally only needs to define **what is different**, while the existing engine continues handling the common game mechanics.