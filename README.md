# ♟️ Chess

A JavaScript implementation of chess with a reusable rules engine and a browser-based game.

## Play

Live: https://satishkhanal76.github.io/Chess/

The browser game remains in this repository. The engine package excludes `index.html`, `css/`, and browser client and GUI modules.

## Engine package

The engine is configured as `@satishkhanal76/chess-engine` for GitHub Packages. To install it, configure the scope in your consuming project's `.npmrc`:

```ini
@satishkhanal76:registry=https://npm.pkg.github.com
```

Then run:

```bash
npm install @satishkhanal76/chess-engine
```

GitHub Packages requires authentication for installation. Use a token with `read:packages` permission in your local npm config or CI secrets; do not commit credentials. Set the package visibility to public after the first publish if unauthenticated installs are desired.

The package entry point exports the primary engine API:

```js
import {
  Game,
  Move,
  Player,
  Piece,
  ClassicalVariant,
  TwoQueenVariant,
  FourOFourVariant,
} from "@satishkhanal76/chess-engine";

const game = new Game(new ClassicalVariant());
game.addPlayer(new Player(Piece.COLOUR.WHITE));
game.addPlayer(new Player(Piece.COLOUR.BLACK));
```

Existing engine modules are also available under the `./classes/*` export path:

```js
import { Game } from "@satishkhanal76/chess-engine/classes/Game.js";
import { Piece } from "@satishkhanal76/chess-engine/classes/pieces/Piece.js";
```

`npm run build` creates `dist/` from `js/classes/` and `src/index.js`. `npm pack --dry-run` previews the package contents. These commands do not publish anything.

## Multiplayer integration

ChessMultiplayer currently includes this repository as a Git submodule and imports paths such as `Chess/js/classes/Game.js`. All current source paths remain unchanged for compatibility. The server can migrate to package imports after a release and a deliberate dependency update.

## Engine capabilities

- Piece movement, legal move validation, check and checkmate
- Stalemate, dead-position, and threefold-repetition validation
- Castling, en passant, promotion, move history, undo and redo
- Classical Chess, Two Queen, and FourOFour variants
- Extensible board sets, pieces, move commands, and game validators

See [Architecture](docs/architecture.md) and [Variants](docs/variants.md) for details.
