class BaseInteraction {
  #data;
  #callback;
  #id;
  constructor(data, callback) {
    this.#data = data;
    this.#callback = callback;
    this.#id = null;
  }

  get data() {
    return structuredClone(this.#data);
  }

  get callback() {
    return this.#callback;
  }

  get id() {
    return this.#id;
  }

  _setId(id) {
    this.#id = id;
  }

  _run(interaction, args) {
    return this.#callback.call(this, interaction, args);
  }

  isCommand() {
    return false;
  }

  toString() {
    return String(this.#data.customId) || this.#data.name;
  }
}

module.exports = BaseInteraction;
