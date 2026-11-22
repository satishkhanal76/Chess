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
            this.#gameGUI.stepBackInTimeline();
        })

        this.#nextButton.addClickEventListener(() => {
            this.#gameGUI.stepForwardInTimeline();
        })

        this.#currentButton.addClickEventListener(() => {
            this.#gameGUI.followLatestInTimeline();
        });
    }

    updateButtons() {
        const { index, latestIndex } = this.#gameGUI.getTimelineState();

        this.#prevButton.disable();
        this.#nextButton.disable();
        this.#currentButton.disable();

        if (index > 0) this.#prevButton.enable();
        if (index < latestIndex) {
            this.#nextButton.enable();
            this.#currentButton.enable();
        }
    }


    getElement() {
        return this.#element;
    }

}
