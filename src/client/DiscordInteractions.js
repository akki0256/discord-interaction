const EventEmitter = require('node:events');
const fs = require('fs');
const path = require('path');
const {
	ApplicationCommandType,
	Collection,
	ComponentType,
	InteractionType,
} = require('discord.js');
const Button = require('../structures/Button');
const ChatInput = require('../structures/ChatInput');
const MessageContext = require('../structures/MessageContext');
const Modal = require('../structures/Modal');
const SelectMenu = require('../structures/SelectMenu');
const UserContext = require('../structures/UserContext');
const { commandTypes, Events } = require('../util/constant');

/**
 * @typedef InteractionData
 * @prop {Collection<string, Button>} buttons
 * @prop {Collection<string, ChatInput>} chatInputs
 * @prop {Collection<string, MessageContext>} messageContexts
 * @prop {Collection<string, Modal>} modals
 * @prop {Collection<string, SelectMenu>} selectMenus
 * @prop {Collection<string, UserContext>} userContexts
 */

class DiscordInteractions {
	/**@type {Client} */
	#client;
	/**@type {InteractionData} */
	#registries;
	#emitter;
	#guildId;
	constructor(client) {
		this.#client = client;
		this.#emitter = new EventEmitter();
		this.#registries = {
			buttons: new Collection(),
			chatInputs: new Collection(),
			messageContexts: new Collection(),
			modals: new Collection(),
			selectMenus: new Collection(),
			userContexts: new Collection(),
		}
	}

	run(interaction, args) {
		return new Promise(() => {
			if (this.#isAutocomplete(interaction)) {
				this.#registries.chatInputs.get(interaction.commandName)?._runAutoComplete(interaction, args);
			}
			if (this.#isButton(interaction)) {
				const data = this.#registries.buttons.get(interaction.customId) ??
					this.#registries.buttons.find(v => this.#getCustomIdRegexp(v, interaction));
				data?._run(interaction, args);
			}
			if (this.#isChatInputCommand(interaction)) {
				this.#getCommandInteraction(this.#registries.chatInputs, interaction)?._run(interaction, args);
			}
			if (this.#isMessageContextMenuCommand(interaction)) {
				this.#getCommandInteraction(this.#registries.messageContexts, interaction)?._run(interaction, args);
			}
			if (this.#isModalSubmit(interaction)) {
				const data = this.#registries.modals.get(interaction.customId) ??
					this.#registries.modals.find(v => this.#getCustomIdRegexp(v, interaction));
				data?._run(interaction, args);
			}
			if (this.#isAnySelectMenu(interaction)) {
				const data = this.#registries.selectMenus.get(interaction.customId) ??
					this.#registries.selectMenus.find(v => this.#getCustomIdRegexp(v, interaction));
				if (data.data.type && interaction.componentType !== ComponentType[`${data.data.type}Select`]) return;
				data?._run(interaction, args);
			}
			if (this.#isUserContextMenuCommand(interaction)) {
				this.#getCommandInteraction(this.#registries.userContexts, interaction)?._run(interaction, args);
			}
		});
	}

	registerCommands(options) {
		if (typeof options === 'string') options = { guildId: options };
		if (options.guildId) this.guildId = options.guildId;
		const guilds = new Set();
		for (const command of [
			...this.registries.chatInputs.values(),
			...this.registries.messageContexts.values(),
			...this.registries.userContexts.values(),
		]) {
			if (command.guildId) guilds.add(command.guildId);
			this.#editOrCreateCommand(command);
		}
		if (options.syncWithCommand || options.deleteNoLoad) {
			if (options.guildId) {
				this.#syncWithCommand(options.guildId);
			}
			else {
				this.#syncWithCommand();
				for (const guildId of guilds) {
					this.#syncWithCommand(guildId);
				}
			}
		}
	}

	async loadRegistries(basePath, predicate) {
		for (const filePath of this.#getAllPath(basePath, predicate)) {
			try {
				const { default: registries } = await import(`file://${filePath}`);
				this.#emitter.emit(Events.fileLoad, filePath);
				if (Array.isArray(registries)) {
					for (const registry of registries) {
						this.#loadregistry(registry);
					}
				}
				else {
					this.#loadregistry(registries);
				}
			}
			catch (error) {
				this.#emitter.emit(Events.error, error);
			}
		}
		this.#emitter.emit(Events.interactionLoaded, this.registries);
	}

	/**@deprecated */
	async loadInteractions(basePath, predicate) {
		process.emitWarning('loadInteractions Deprecated!', {
			code: 'Deprecated',
			detail: 'Use loadRegistries() instead',
		});
		this.loadRegistries(basePath, predicate);
	}

	async #editOrCreateCommand(registry) {
		const guildId = registry.guildId ?? this.guildId;
		const commands = await this.#client.application?.commands.fetch({ guildId });
		const command = commands?.find(cmd => cmd.type === registry.data.type && cmd.name === registry.data.name);
		if (!command) {
			const created = await this.#client.application?.commands.create(registry.data, guildId);
			if (created) {
				this.#emitter.emit(`${commandTypes[created.type]}Create`, created);
				registry._setId(created.id);
			}
		}
		else {
			command.edit(registry.data);
			this.#emitter.emit(`${commandTypes[command.type]}Edit`, command);
			registry._setId(command.id);
		}
	}

	async #syncWithCommand(guildId) {
		const commands = await this.#client.application?.commands.fetch({ guildId });
		if (!commands) return;
		for (const command of commands.values()) {
			if (command.type === ApplicationCommandType.ChatInput && !this.#registries.chatInputs.has(command.name)) continue;
			if (command.type === ApplicationCommandType.Message && !this.#registries.messageContexts.has(command.name)) continue;
			if (command.type === ApplicationCommandType.User && !this.#registries.userContexts.has(command.name)) continue;
			command.delete();
			this.#emitter.emit(`${commandTypes[command.type]}Delete`, command);
		}
	}

	#loadregistry(registry) {
		if (registry instanceof Button) this.#registries.buttons.set(String(registry.data.customId), registry);
		if (registry instanceof ChatInput) this.#registries.chatInputs.set(registry.data.name, registry);
		if (registry instanceof MessageContext) this.#registries.messageContexts.set(registry.data.name, registry);
		if (registry instanceof Modal) this.#registries.modals.set(String(registry.data.customId), registry);
		if (registry instanceof SelectMenu) this.#registries.selectMenus.set(String(registry.data.customId), registry);
		if (registry instanceof UserContext) this.#registries.userContexts.set(registry.data.name, registry);
	}

	#getAllPath(basePath, predicate, paths = new Set()) {
		if (typeof predicate !== 'function') predicate = (value) => !/^(-|_|\.)/.test(value.name);
		if (!fs.existsSync(basePath)) return [];
		for (const entry of fs.readdirSync(basePath, { withFileTypes: true })) {
			if (!predicate(entry)) continue;
			if (entry.isFile()) {
				paths.add(path.resolve(basePath, entry.name));
				continue;
			}
			if (entry.isDirectory()) this.#getAllPath(path.resolve(basePath, entry.name), predicate, paths);
		}
		return [...paths];
	}

	#getCustomIdRegexp({ data }, { customId }) {
		if (data.customId instanceof RegExp && data.customId.test(customId)) return true;
		return false;
	}

	#getCommandInteraction(collection, interaction) {
		const cmd = collection.get(interaction.commandName);
		if (!cmd) return;
		if (cmd.isInCoolTime(interaction.user)) throw new InteractionsError(InteractionErrorCodes.CommandHasCoolTime, cmd);
		return cmd;
	}

	get buttons() {
		return structuredClone(this.#registries.buttons);
	}

	get chatInputs() {
		return structuredClone(this.#registries.chatInputs);
	}

	get messageContexts() {
		return structuredClone(this.#registries.messageContexts);
	}

	get modals() {
		return structuredClone(this.#registries.modals);
	}

	get selectMenus() {
		return structuredClone(this.#registries.selectMenus);
	}

	get userContexts() {
		return structuredClone(this.#registries.userContexts);
	}

	get registries() {
		return structuredClone(this.#registries);
	}

	/**@deprecated */
	get interactions() {
		return this.registries;
	}

	set guildId(id) {
		if (id && !/^\d{16,}$/.test(id)) return;
		this.#guildId = id;
	}

	get guildId() {
		return this.#guildId;
	}

	#isAutocomplete(interaction) {
		return interaction.type === InteractionType.ApplicationCommandAutocomplete;
	}
	#isChatInputCommand(interaction) {
		return interaction.type === InteractionType.ApplicationCommand && interaction.commandType === ApplicationCommandType.ChatInput;
	}
	#isUserContextMenuCommand(interaction) {
		return interaction.type === InteractionType.ApplicationCommand && interaction.commandType === ApplicationCommandType.User;
	}
	#isMessageContextMenuCommand(interaction) {
		return interaction.type === InteractionType.ApplicationCommand && interaction.commandType === ApplicationCommandType.Message;
	}
	#isButton(interaction) {
		return interaction.type === InteractionType.MessageComponent && interaction.componentType === ComponentType.Button;
	}
	#isAnySelectMenu(interaction) {
		return (
			interaction.type === InteractionType.MessageComponent &&
			[
				ComponentType.StringSelect,
				ComponentType.UserSelect,
				ComponentType.RoleSelect,
				ComponentType.MentionableSelect,
				ComponentType.ChannelSelect,
			].includes(interaction.componentType)
		);
	}
	#isModalSubmit(interaction) {
		return interaction.type === InteractionType.ModalSubmit;
	}

	on(eventName, listener) {
		this.#emitter.on(eventName, listener);
		return this;
	}

	once(eventName, listener) {
		this.#emitter.once(eventName, listener);
		return this;
	}

	off(eventName, listener) {
		this.#emitter.off(eventName, listener);
		return this;
	}

	removeAllListeners(event) {
		this.#emitter.removeAllListeners(event);
		return this;
	}
}

module.exports = DiscordInteractions;
