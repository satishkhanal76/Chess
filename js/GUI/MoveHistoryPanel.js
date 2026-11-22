export default class MoveHistoryPanel {
  #game;
  #list;
  #summary;
  #feedback;

  constructor(game) {
    this.#game = game;
    this.#list = document.getElementById("move-history");
    this.#summary = document.getElementById("move-history-summary");
    this.#feedback = document.getElementById("move-history-feedback");
    if (!this.#list) return;

    document.getElementById("copy-moves-button")?.addEventListener("click", () => this.#copy());
    document.getElementById("download-moves-button")?.addEventListener("click", () => this.#download());
    this.#game.moveEventListeners.addListener(() => this.update());
    this.update();
  }

  update() {
    if (!this.#list) return;
    const moves = this.#groupMoves(this.#game.getMoveRecords());
    const moveCount = this.#game.getMoveRecords().length;
    this.#summary.textContent = `${moveCount} ${moveCount === 1 ? "move" : "moves"}`;

    const fragment = document.createDocumentFragment();
    moves.forEach(({ number, white, black }) => {
      const item = document.createElement("li");
      const moveNumber = document.createElement("span");
      const whiteMove = document.createElement("span");
      const blackMove = document.createElement("span");
      moveNumber.className = "move-number";
      moveNumber.textContent = `${number}.`;
      whiteMove.textContent = white;
      blackMove.textContent = black;
      item.append(moveNumber, whiteMove, blackMove);
      fragment.append(item);
    });

    this.#list.replaceChildren(fragment);
    this.#list.scrollTop = this.#list.scrollHeight;
  }

  #groupMoves(records) {
    const groups = [];
    records.forEach((record) => {
      const last = groups.at(-1);
      if (record.colour === "WHITE") {
        groups.push({ number: record.moveNumber, white: record.san, black: "" });
      } else if (last?.number === record.moveNumber && !last.black) {
        last.black = record.san;
      } else {
        groups.push({ number: record.moveNumber, white: "", black: record.san });
      }
    });
    return groups;
  }

  #serializeMoves() {
    return this.#groupMoves(this.#game.getMoveRecords())
      .map(({ number, white, black }) => {
        if (!white) return `${number}... ${black}`;
        return `${number}. ${white}${black ? ` ${black}` : ""}`;
      })
      .join(" ");
  }

  async #copy() {
    try {
      await navigator.clipboard.writeText(this.#serializeMoves());
      this.#feedback.textContent = "Moves copied.";
    } catch {
      this.#feedback.textContent = "Clipboard access is unavailable in this browser.";
    }
  }

  #download() {
    const file = new Blob([`${this.#serializeMoves()}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chess-moves.txt";
    link.click();
    URL.revokeObjectURL(url);
    this.#feedback.textContent = "Moves downloaded.";
  }
}
