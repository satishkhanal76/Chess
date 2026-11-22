export default class ButtonGUI {

    #element;

    #isDisabled;

    constructor(key) {
        this.#createElement(key);
        this.#isDisabled = false;
    }


    #createElement(key) {
        const labels = { prev: "← Previous", next: "Next →", current: "Latest" };
        this.#element = document.createElement("button");
        this.#element.setAttribute("id", key);
        this.#element.textContent = labels[key] || key;
        this.#element.setAttribute("aria-label", labels[key] || key);
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
