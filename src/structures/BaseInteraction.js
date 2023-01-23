const BaseCommand = require("./BaseCommand");

class BaseInteraction {
  #data;
  #callback;
  constructor(data, callback) {
    this.#data = data;
    this.#callback = callback;
  }

  get data() {
    return { ...this.#data };
  }

  get callback() {
    return this.#callback;
  }

  run(interaction, data, ...args) {
    return this.callback(interaction, data, ...args);
  }

  isCommand() {
    return false;
  }
}

module.exports = BaseInteraction;
