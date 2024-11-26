export default class ButtonGUI {

    #element;

    #isDisabled;

    constructor(key) {
        this.#createElement(key);
        this.#isDisabled = false;
    }


    #createElement(key) {
        this.#element = document.createElement("button");
        this.#element.setAttribute("id", key);
        this.#element.textContent = key;
    }


    getElement() {
        return this.#element;
    }

    addClickEventListener(callback) {
        this.#element.addEventListener("click", callback);
    }

    disable() {
        this.#isDisabled = true;
        this.#element.disabled = true;
    }

    enable() {
        this.#isDisabled = false;
        this.#element.disabled = false;
    }
}