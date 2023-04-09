const { ApplicationCommandType } = require('discord.js');
const BaseCommand = require('./BaseCommand');

class ChatInput extends BaseCommand {
  #autoComplete;
  constructor(data, meta, callback, autoComplete) {
    if (typeof meta === 'function') {
      autoComplete = callback;
      callback = meta;
    }
    super({ ...data, type: ApplicationCommandType.ChatInput }, meta, callback);
    this.#autoComplete = autoComplete;
  }

  get autoComplete() {
    return this.#autoComplete;
  }

  _runAutoComplete(interaction, args) {
    this.#autoComplete.call(this, interaction, args);
  }

  toCommandString() {
    if (!this.id) throw new ReferenceError('Command not registered');
    return `</${this.data.name}:${this.id}>`;
  }
}

module.exports = ChatInput;