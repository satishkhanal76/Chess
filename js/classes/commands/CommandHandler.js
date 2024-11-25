import { Command } from "./Command.js";

export class CommandHandler {
  #commands;

  //the index of the current command of the command timeline (changes with undo and redo)
  #currentCommandIndex;

  //the index of the furthest ahead command on the command timeliene (does not change with undo and redo)
  #commandIndex;

  constructor() {
    this.#commands = [];
    this.#currentCommandIndex = -1;
    this.#commandIndex = -1;
  }

  addCommand(command) {
    // console.trace(command);
    if (!(command instanceof Command)) return null;

    if (this.#commandIndex !== this.#currentCommandIndex) {
      this.executeCommands();
    }

    this.#commands.push(command);

    this.#incrementCommandIndex();
    this.#incrementCurrentCommandIndex();
  }

  /**
   * Removes a command
   * (Executes all the commands in the stack so if the pointer is not on the top command it will execute to the top before removing)
   * @param {*} command
   * @returns
   */
  removeCommand(command) {
    const commandIndex = this.#commands.findIndex((c) => c === command);

    if (commandIndex < 0) return null;

    this.executeCommands();

    const splicedCommand = this.#commands.splice(commandIndex, 1).pop();

    //undo the command before removing it
    splicedCommand.undo();

    this.#decrementCommandIndex();

    if (this.#currentCommandIndex > this.#commandIndex) {
      this.#currentCommandIndex = this.#commandIndex;
    }

    return splicedCommand;
  }

  pop() {
    if (this.#commands.length <= 0) return null; //can't pop

    const popedCommand = this.#commands.pop();

    //undo the command before removing it
    popedCommand.undo();

    this.#decrementCommandIndex();

    if (this.#currentCommandIndex > this.#commandIndex) {
      this.#currentCommandIndex = this.#commandIndex;
    }
    return popedCommand;
  }

  /**
   * Executes all commands from currentCommandIndex to commandIndex at once
   */
  executeCommands() {
    const executedCommands = [];
    for (let i = this.#currentCommandIndex; i < this.#commandIndex; i++) {
      executedCommands.push(this.redoCommand());
    }
    return executedCommands;
  }

  executeNextCommand() {
    const command = this.#commands[this.#currentCommandIndex];
    if (!command) {
      console.error("No commands to execute!");
      return null;
    }

    command.execute();


    if (!command.isValid()) {
      this.removeCommand(command);
      this.#decrementCurrentCommandIndex();
    }
    return command;
  }

  #incrementCurrentCommandIndex() {
    this.#currentCommandIndex = this.#currentCommandIndex + 1;
  }

  #decrementCurrentCommandIndex() {
    this.#currentCommandIndex = this.#currentCommandIndex - 1;
  }

  #incrementCommandIndex() {
    this.#commandIndex = this.#commandIndex + 1;
  }

  #decrementCommandIndex() {
    this.#commandIndex = this.#commandIndex - 1;
  }

  undoCommand() {
    if (this.#currentCommandIndex < 0) {
      return null;
    }

    const command = this.#commands[this.#currentCommandIndex];
    command.undo();

    this.#decrementCurrentCommandIndex();
    return command;
  }

  redoCommand() {
    this.#incrementCurrentCommandIndex();

    if (this.#currentCommandIndex > this.#commandIndex) {
      this.#currentCommandIndex = this.#commandIndex;
      return null;
    }
    const command = this.#commands[this.#currentCommandIndex];
    command.undo();
    if (command.isExecuted()) {
      command.redo();
    } else {
      command.execute();
    }
    return command;
  }
  getCurrentCommandIndex() {
    return this.#currentCommandIndex;
  }

  getCommandIndex() {
    return this.#commandIndex;
  }

  /**
   * Gets the last command on the command stack
   * @returns command
   */
  getLatestCommand() {
    return this.#commands[this.#commandIndex];
  }

  getCurrentCommand() {
    return this.#commands[this.#currentCommandIndex];
  }

  getPreviousCommand() {
    const previousCommandIndex = this.#currentCommandIndex - 1;
    if (previousCommandIndex < 0) return null;

    return this.#commands[previousCommandIndex];
  }

  emitCommand() {
    this.getCurrentCommand()?.emit();
  }
}
