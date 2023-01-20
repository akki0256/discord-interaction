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

	resetCoolTime(userId) {
		return this.#timer.delete(userId);
	}

	getCoolTime(userId) {
		return this.#timer.get(userId)?.getTime() ?? null;
	}

	getLastUseDiff(userId) {
		return Date.now() - (this.getCoolTime(userId) ?? 0);
	}

	isInCoolTime(userId) {
		return this.getLastUseDiff(userId) <= this.#coolTime;
	}

	run(interaction, data, ...args) {
		this.#timer.set(interaction.user.id, new Date());
		return this.callback(interaction, data, ...args);
	}
}

module.exports = BaseCommand;
