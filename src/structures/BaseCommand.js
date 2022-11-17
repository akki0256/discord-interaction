const { Collection } = require('discord.js');
const BaseInteraction = require('./BaseInteraction');

class BaseCommand extends BaseInteraction {
	/**@type {number} */
	#coolTime;
	/**@type {Snowflake?} */
	#guildId;
	/**@type {Collection<Snowflake,Date>} */
	#timer;
	constructor(data, callback) {
		super(data, callback);

		this.#coolTime = data.coolTime ?? 0;
		this.#guildId = data.guildId || null;
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
		this.#timer.set(user.id, null);
	}

	getCoolTime(user) {
		return this.timer.get(user.id) ?? null;
	}

	getLastUseDiff(user) {
		const lastUse = this.getCoolTime(user) ?? 0;
		return Date.now() - lastUse;
	}

	isInCoolTime(user) {
		return this.getLastUseDiff(user) <= this.coolTime;
	}

	run(interaction, ...args) {
		this.#timer.set(interaction.user.id, new Date());
		return this.callback(interaction, ...args);
	}
}

module.exports = BaseCommand;
