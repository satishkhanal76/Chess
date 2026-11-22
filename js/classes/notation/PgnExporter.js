const RESULT_BY_COLOR = { WHITE: "1-0", BLACK: "0-1" };

export default class PgnExporter {
  static export(records, result = null, headers = {}) {
    const resultToken = result?.type === "draw"
      ? "1/2-1/2"
      : result?.winner
        ? RESULT_BY_COLOR[result.winner] || "*"
        : "*";
    const tags = {
      Event: "Casual Game",
      Site: "Online",
      Date: new Date().toISOString().slice(0, 10).replaceAll("-", "."),
      Round: "-",
      White: "White",
      Black: "Black",
      ...headers,
      Result: resultToken,
    };
    const tagText = Object.entries(tags)
      .map(([name, value]) => `[${name} "${String(value).replaceAll('"', '\\"')}"]`)
      .join("\n");

    const moves = [];
    for (const record of records) {
      if (record.colour === "WHITE") moves.push(`${record.moveNumber}. ${record.san}`);
      else if (!moves.length) moves.push(`${record.moveNumber}... ${record.san}`);
      else moves[moves.length - 1] += ` ${record.san}`;
    }
    moves.push(resultToken);
    return `${tagText}\n\n${moves.join(" ")}`;
  }
}
