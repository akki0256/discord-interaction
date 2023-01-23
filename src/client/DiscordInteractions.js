const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:stream');
const {
	ApplicationCommandType,
	Collection,
	ComponentType,
	InteractionType,
} = require('discord.js');
const BaseCommand = require('../structures/BaseCommand');
const Button = require('../structures/Button');
const ChatInput = require('../structures/ChatInput');
const MessageContext = require('../structures/MessageContext');
const Modal = require('../structures/Modal');
const SelectMenu = require('../structures/SelectMenu');
const UserContext = require('../structures/UserContext');
const { InteractionsError, ErrorCodes } = require('../errors');

class DiscordInteractions extends EventEmitter {
	/** @type {import('discord.js').Client}*/
	#client;
	/** @type {Collection<string,Button>} */
	#buttons;
	/** @type {Collection<string,ChatInput>} */
	#chatInputs;
	/** @type {Collection<string,MessageContext>} */
	#messageContexts;
	/** @type {Collection<string,Modal>} */
	#modals;
	/** @type {Collection<string,SelectMenu>} */
	#selectMenus;
	/** @type {Collection<string,UserContext>} */
	#userContexts;
	/** @type {Snowflake} */
	#guildId;
	constructor(client) {
		super();
		this.#client = client;
		this.#buttons = new Collection();
		this.#chatInputs = new Collection();
		this.#messageContexts = new Collection();
		this.#modals = new Collection();
		this.#selectMenus = new Collection();
		this.#userContexts = new Collection();
	}

	/** Loaded button interaction */
	get buttons() {
		return this.#buttons.clone();
	}

	/** Loaded Slash command */
	get chatInputs() {
		return this.#chatInputs.clone();
	}

	/** Loaded message context */
	get messageContexts() {
		return this.#messageContexts.clone();
	}

	/** Loaded modal interaction */
	get modals() {
		return this.#modals.clone();
	}

	/** Loaded selectMenu interaction */
	get selectMenus() {
		return this.#selectMenus.clone();
	}

	/** Loaded user context */
	get userContexts() {
		return this.#userContexts.clone();
	}

	/** Loaded all interaction */
	get interactions() {
		return {
			buttons: this.buttons,
			chatInputs: this.chatInputs,
			messageContexts: this.messageContexts,
			modals: this.modals,
			selectMenus: this.selectMenus,
			userContexts: this.userContexts,
		};
	}

	async deleteNoLoadInteractions(guildId) {
		const registered = await this.#client.application.commands.fetch({ guildId });
		const commands = [
			...this.chatInputs.values(),
			...this.userContexts.values(),
			...this.messageContexts.values(),
		];
		for (const cmd of registered.values()) {
			if (commands.some((command) => cmd.type === command.data.type && cmd.guildId === (this.#guildId ?? command.guildId) && cmd.name === command.data.name)) continue;
			cmd.delete();
			this.emit(`${ApplicationCommandType[cmd.type]}Delete`, cmd);
		}
	}

	/**
	 * @param {string} basePath
	 * @param {(value:fs.Dirent) => boolean} [predicate]
	 * @param {Set<String>} [pre]
	 * @returns {string[]}
	 */
	#getAllPath(basePath, predicate, pre = new Set()) {
		if (typeof predicate !== 'function') predicate = (value) => !/^(-|_|\.)/.test(value.name);
		if (!fs.existsSync(basePath)) return [];
		fs.readdirSync(basePath, { withFileTypes: true }).forEach((v) => {
			if (v.isFile() && predicate(v)) return pre.add(path.resolve(basePath, v.name));
			if (v.isDirectory() && predicate(v)) this.#getAllPath(path.resolve(basePath, v.name), predicate, pre);
		});
		return [...pre];
	}

	#loadInteraction(interaction) {
		if (interaction instanceof ChatInput) this.#chatInputs.set(interaction.data.name, interaction);
		if (interaction instanceof MessageContext) this.#messageContexts.set(interaction.data.name, interaction);
		if (interaction instanceof UserContext) this.#userContexts.set(interaction.data.name, interaction);
		if (interaction instanceof Button) this.#buttons.set(interaction.data.customId instanceof RegExp ? `regexp:${Date.now()}` : interaction.data.customId, interaction);
		if (interaction instanceof Modal) this.#modals.set(interaction.data.customId instanceof RegExp ? `regexp:${Date.now()}` : interaction.data.customId, interaction);
		if (interaction instanceof SelectMenu) this.#selectMenus.set(interaction.data.customId instanceof RegExp ? `regexp:${Date.now()}` : interaction.data.customId, interaction);
	}

	/**
	 * Load an interaction file
	 * @param {string} basePath Path of the directory where it is stored
	 * @param {(value:fs.Dirent) => boolean} predicate If false, exclude the file
	 */
	async loadInteractions(basePath, predicate) {
		for (const filePath of this.#getAllPath(basePath, predicate)) {
			this.emit('fileLoad', filePath);
			const { default: interactionData } = await import(`file://${filePath}`);
			if (Array.isArray(interactionData)) {
				interactionData.forEach((interaction) => this.#loadInteraction(interaction));
			} else {
				this.#loadInteraction(interactionData);
			}
		}
		this.emit('interactionLoaded', this.interactions);
	}

	async registerCommands(options = {}) {
		if (typeof options === 'string') options = { guildId: options };
		this.setGuildOnly(options.guildId);
		const guildIds = new Set();
		this.chatInputs.forEach((chatInput) => {
			if (chatInput.guildId) guildIds.add(chatInput.guildId);
			this.#editOrCreateCommand(chatInput);
		});
		this.messageContexts.forEach((messageContext) => {
			if (messageContext.guildId) guildIds.add(messageContext.guildId);
			this.#editOrCreateCommand(messageContext);
		});
		this.userContexts.forEach((userContext) => {
			if (userContext.guildId) guildIds.add(userContext.guildId);
			this.#editOrCreateCommand(userContext);
		});
		if (options.deleteNoLoad) {
			if (options.guildId) {
				this.deleteNoLoadInteractions(options.guildId);
			} else {
				guildIds.forEach((guildId) => this.deleteNoLoadInteractions(guildId));
			}
		}
	}

	/**
	 * @param {ChatInput | MessageContext | UserContext} interactionData
	 * @param {{ guildId?: string }} options
	 */
	async #editOrCreateCommand(interactionData) {
		const guildId = this.#guildId ?? interactionData.guildId;
		const registered = await this.#client.application.commands.fetch({ guildId });
		const cmd = registered.find((c) => c.type === interactionData.data.type && c.name === interactionData.data.name);
		if (!cmd) {
			const created = await this.#client.application.commands.create(interactionData.data, guildId);
			this.emit(`${ApplicationCommandType[interactionData.data.type]}Create`, created);
		} else {
			cmd.edit(interactionData.data);
			this.emit(`${ApplicationCommandType[interactionData.data.type]}Edit`, cmd);
		}
	}

	setGuildOnly(guildId) {
		if (!/^\d{16,}$/.test(guildId)) return this;
		this.#guildId = guildId;
		return this;
	}

	resetGuildOnly() {
		this.#guildId = undefined;
		return this;
	}

	run(interaction, ...args) {
		return new Promise((resolve, reject) => {
			let select;
			if (this.#isChatInputCommand(interaction)) select = this.#chatInputs.get(interaction.commandName);
			if (this.#isUserContextMenuCommand(interaction)) select = this.#userContexts.get(interaction.commandName);
			if (this.#isMessageContextMenuCommand(interaction)) select = this.#messageContexts.get(interaction.commandName);
			if (this.#isButton(interaction)) select = this.#buttons.get(interaction.customId) ?? this.#buttons.find(({ data: { customId } }) => customId instanceof RegExp && customId.test(interaction.customId),);
			if (this.#isAnySelectMenu(interaction)) {
				select = this.#selectMenus.get(interaction.customId) ?? this.#selectMenus.find(({ data: { customId } }) => customId instanceof RegExp && customId.test(interaction.customId),);
				if (!select) return;
				if (select.data.type && ComponentType[`${select.data.type}Select`] !== interaction.componentType) return;
			}
			if (this.#isModalSubmit(interaction)) select = this.#modals.get(interaction.customId) ?? this.#modals.find(({ data: { customId } }) => customId instanceof RegExp && customId.test(interaction.customId),);
			if (!select) return;
			if (select instanceof BaseCommand && select.isInCoolTime(interaction.user)) {
				return reject(new InteractionsError(ErrorCodes.CommandHasCoolTime, select));
			}
			resolve(select.run(interaction, select, ...args));
		});
	}

	/**@param {Interaction} interaction*/
	#isChatInputCommand(interaction) {
		return interaction.type === InteractionType.ApplicationCommand && interaction.commandType === ApplicationCommandType.ChatInput;
	}

	/**@param {Interaction} interaction*/
	#isContextMenuCommand(interaction) {
		return interaction.type === InteractionType.ApplicationCommand && [ApplicationCommandType.User, ApplicationCommandType.Message].includes(interaction.commandType);
	}

	/**@param {Interaction} interaction*/
	#isUserContextMenuCommand(interaction) {
		return this.#isContextMenuCommand(interaction) && interaction.commandType === ApplicationCommandType.User
	}

	/**@param {Interaction} interaction*/
	#isMessageContextMenuCommand(interaction) {
		return this.#isContextMenuCommand(interaction) && interaction.commandType === ApplicationCommandType.Message
	}

	/**@param {Interaction} interaction*/
	#isButton(interaction) {
		return interaction.type === InteractionType.MessageComponent && interaction.componentType === ComponentType.Button;
	}

	/**@param {Interaction} interaction*/
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

	/**@param {Interaction} interaction*/
	#isModalSubmit(interaction) {
		return interaction.type === InteractionType.ModalSubmit;
	}
}

module.exports = DiscordInteractions;
