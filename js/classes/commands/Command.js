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

  constructor(type) {
    this.#type = type;
    this.#executed = false;
    this.#isValid = false;
  }

  execute() {
    console.error("Not Implemented!");
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

  emit() {
    console.error("Not Implemented");
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
}
