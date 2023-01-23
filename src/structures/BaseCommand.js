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

  getCoolTime(user) {
    return this.#timer.get(user.id)?.getTime() ?? null;
  }

  getLastUseDiff(user) {
    return Date.now() - (this.getCoolTime(user) ?? 0);
  }

  isInCoolTime(user) {
    return this.getLastUseDiff(user) <= this.#coolTime;
  }

  run(interaction, data, ...args) {
    this.#timer.set(interaction.user.id, new Date());
    return this.callback(interaction, data, ...args);
  }

  isCommand() {
    return true;
  }
}

module.exports = BaseCommand;
