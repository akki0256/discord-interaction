class BaseInteraction {
	/**@type {InteractionRegisterData<T extends InteractionTypes>} */
	#data;
	/**@type {InteractionRegisterCallback<T extends InteractionTypes>} */
	#callback;
	constructor(data, callback) {
		this.#data = data ?? {};
		this.#callback = callback ?? (() => { });
	}

	get data() {
		return ({ ...this.#data });
	}

	get callback() {
		return this.#callback;
	}

	run(interaction, ...args) {
		return this.callback(interaction, ...args);
	}
}

module.exports = BaseInteraction;