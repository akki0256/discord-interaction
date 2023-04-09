const { Collection } = require('discord.js');
const BaseInteraction = require('./BaseInteraction');

class BaseCommand extends BaseInteraction {
  #coolTime;
  #guildId;
  #timer;
  constructor(data, meta, callback) {
    if (!callback && typeof meta === 'function') {
      callback = meta;
      meta = {};
    }
    super(data, callback);
    this.#coolTime = meta.coolTime ?? 0;
    this.#guildId = meta.guildId || undefined;
    this.#timer = new Collection();
  }

  get coolTime() {
    return this.#coolTime;
  }

  get guildId() {
    return this.#guildId;
  }

  get timer() {
    return this.#timer.clone();
  }

  resetCoolTime(user) {
    return this.#timer.delete(user.id);
  }

  getLastUse(user) {
    return this.#timer.get(user.id)?.getTime() ?? null;
  }

  getElapsedTime(user) {
    return Date.now() - (this.getLastUse(user) ?? 0);
  }

  isInCoolTime(user) {
    return this.getElapsedTime(user) <= this.#coolTime;
  }

  getCoolTime(user) {
    process.emitWarning('getCoolTime Deprecated!', {
      code: 'Deprecated',
      detail: 'Use getLaseUse() instead',
    });
    return this.getLastUse(user);
  }

  getLastUseDiff(user) {
    process.emitWarning('getLastUseDiff Deprecated!', {
      code: 'Deprecated',
      detail: 'Use getElapsedTime() instead',
    });
    return this.getElapsedTime(user);
  }
  isCommand() {
    return true;
  }

  _run(interaction, args) {
    this.#timer.set(interaction.user.id, new Date());
    return this.callback(interaction, args);
  }

  toString() {
    return this.data.name;
  }
}

module.exports = BaseCommand;
