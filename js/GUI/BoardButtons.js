import ButtonGUI from "./ButtonGUI.js";

export default class BoardButtons {

    #gameGUI;
    #element;

    #prevButton;
    #nextButton;
    #currentButton;

    constructor(gameGUI) {

        this.#gameGUI = gameGUI;
        this.#element = document.getElementById("buttons-container");
        if(!this.#element) return;

        this.#createButtons();
        this.#addEventListeners();
        this.updateButtons();
    }


    #createButtons() {
        this.#prevButton = new ButtonGUI("prev");
        this.#nextButton = new ButtonGUI("next");
        this.#currentButton = new ButtonGUI("current");

        this.#element.innerHTML = "";

        this.#element.appendChild(this.#prevButton.getElement());
        this.#element.appendChild(this.#nextButton.getElement());
        this.#element.appendChild(this.#currentButton.getElement());
    }


    #addEventListeners() {
        this.#prevButton.addClickEventListener(() => {
            const command = this.#gameGUI.getGame().undoMove();
            this.#gameGUI.getAnimationHandler().animateCommand(command, true);
            
            this.updateButtons();
        })

        this.#nextButton.addClickEventListener(() => {
            const command = this.#gameGUI.getGame().redoMove();
            this.#gameGUI.getAnimationHandler().animateCommand(command);
            
            this.updateButtons();
        })

        this.#currentButton.addClickEventListener(() => {
            const commandHandler = this.#gameGUI.getGame().getBoard().getCommandHandler();
            let command;
            do {
                command = commandHandler.redoCommand();

                if (!command) break;

                this.#gameGUI.getAnimationHandler().animateCommand(command, false);
            } while (command);

            this.updateButtons()
        });
    }

    updateButtons() {
        const commandHandler = this.#gameGUI.getGame().getBoard().getCommandHandler();
        const currentCommandIndex = commandHandler.getCurrentCommandIndex();
        const commandIndex = commandHandler.getCommandIndex();

        this.#prevButton.disable();
        this.#nextButton.disable();
        this.#currentButton.disable();

        if (currentCommandIndex === -1 && commandIndex === -1) return;

        if (currentCommandIndex <= commandIndex && currentCommandIndex > -1) {
            this.#prevButton.enable();
        }

        if (currentCommandIndex < commandIndex) {
        this.#nextButton.enable();
        this.#currentButton.enable();
        }
    }


    getElement() {
        return this.#element;
    }

}