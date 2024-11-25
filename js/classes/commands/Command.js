
export class Command {
  static TYPES = {
    MOVE_COMMAND: "MOVE_COMMAND",
    CASTLE_COMMAND: "CASTLE_COMMAND",
    EN_PASSANT_COMMAND: "EN_PASSANT_COMMAND",
    PROMOTION_COMMAND: "PROMOTION_COMMAND",
  };


  #executed;
  #type;
  #isValid;
  #piecesAffected;

  constructor(type) {
    this.#type = type;
    this.#executed = false;
    this.#isValid = false;
    this.#piecesAffected = [];


  }

  validate() {
    console.log("Validation Not Implemented!");
  }

  execute() {
    if(!this.#isValid) throw new Error("Not a valid command!");
  }

  undo() {
    if(!(this.isExecuted() && this.isValid())) throw new Error("Can't undo an unexecuted or invalid command!");
  }

  redo() {
    if(!(this.isExecuted() && this.isValid())) throw new Error("Can't redo an unexecuted or invalid command!");
  }

  getType() {
    return this.#type;
  }

  isExecuted() {
    return this.#executed;
  }

  setExecuted(executed) {
    this.#executed = executed;
  }

  isValid() {
    return this.#isValid;
  }

  setIsValid(isValid) {
    this.#isValid = isValid;
  }

  getPiecesAffected() {
    return this.#piecesAffected;
  }
}
