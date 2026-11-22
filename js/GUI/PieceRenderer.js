const SYMBOLS = {
  "♔": ["king", "light"], "♕": ["queen", "light"], "♖": ["rook", "light"],
  "♗": ["bishop", "light"], "♘": ["knight", "light"], "♙": ["pawn", "light"],
  "♚": ["king", "dark"], "♛": ["queen", "dark"], "♜": ["rook", "dark"],
  "♝": ["bishop", "dark"], "♞": ["knight", "dark"], "♟": ["pawn", "dark"],
};

// Original, inline SVG artwork keeps the pieces crisp at every board size.
const BODY = {
  king: '<path d="M26 36 23 17l13 10 4-16 4 16 13-10-3 19z"/><circle cx="40" cy="29" r="3.2"/><path d="M28 52c1-8 5-12 10-16l2-3 2 3c6 4 9 8 10 16z"/>',
  queen: '<path d="m22 23 12 11 6-17 8 17 12-11-4 29H26z"/><circle cx="22" cy="20" r="3.5"/><circle cx="40" cy="14" r="3.5"/><circle cx="60" cy="20" r="3.5"/>',
  rook: '<path d="M23 19h8v7h6v-7h7v7h6v-7h8v12H23z"/><path d="M28 31h24l-3 21H31z"/>',
  bishop: '<path d="M40 14c-7 8-12 14-8 21 2 3 5 5 8 7-7 3-12 7-13 12h26c-1-5-6-9-13-12 8-5 10-12 5-20z"/><path d="m34 25 12 13"/>',
  knight: '<path d="M24 53v-7c0-7 4-12 11-15l-2-9 6-7 6 8c10 0 16 6 15 15l-1 4 6 3-9 2-3 8z"/><path d="M30 46c4-5 9-7 16-7 5 0 9 1 13 4l-2 10H30z"/><path d="m35 21 4-5 5 8-8 5"/><path d="m54 34 9 4-8 4"/><circle cx="47" cy="32" r="1.8"/>',
  pawn: '<circle cx="40" cy="23" r="10"/><path d="M33 34h14c0 8 2 12 7 18H26c5-6 7-10 7-18z"/>',
};

export function renderPieceMarkup(character) {
  if (!character) return null;
  const normalized = character.replace(/[\uFE0E\uFE0F]/g, "");
  const piece = SYMBOLS[normalized];
  if (!piece) return null;

  const [type, colour] = piece;
  const palette = colour === "light"
    ? { fill: "#f5ead7", stroke: "#382b20" }
    : { fill: "#25303b", stroke: "#f5ead7" };
  const accessibleColour = colour === "light" ? "White" : "Black";
  return `<svg class="chess-piece-svg ${colour}-piece" viewBox="0 0 80 80" role="img" aria-label="${accessibleColour} ${type}" focusable="false"><g fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"><path d="M14 68h52l-4-8H18zM20 59h40l-3-7H23z"/><g>${BODY[type]}</g></g></svg>`;
}
