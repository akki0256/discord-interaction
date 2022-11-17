const fs = require('node:fs');
const pathModule = require('node:path');
const { EventEmitter } = require('node:stream');
const MessageContext = require('../structures/MessageContext');
const Command = require('../structures/Command');
const UserContext = require('../structures/UserContext');
const Button = require('../structures/Button');
const SelectMenu = require('../structures/SelectMenu');
const Modal = require('../structures/Modal');
const { Collection, ApplicationCommandType } = require('discord.js');
const BaseCommand = require('../structures/BaseCommand');

class DiscordInteractions extends EventEmitter {
	/**@type {Client} */
	#client;
	/** @type {Collection<String,Command>}*/
	#commands;
	/** @type {Collection<String,UserContext>}*/
	#userContexts;
	/** @type {Collection<String,MessageContext>}*/
	#messageContexts;
	/** @type {Collection<String,Button>}*/
	#buttons;
	/** @type {Collection<String,SelectMenu>}*/
	#selectMenus;
	/** @type {Collection<String,Modal>}*/
	#modals;
	/**
	 * @param {Client} client discord client
	 */
	constructor(client) {
		super();

		this.#client = client;
		this.#commands = new Collection();
		this.#userContexts = new Collection();
		this.#messageContexts = new Collection();
		this.#buttons = new Collection();
		this.#selectMenus = new Collection();
		this.#modals = new Collection();
	}

	/**Loaded Slash command */
	get commands() {
		return this.#commands;
	}

	/**Loaded user context */
	get userContexts() {
		return this.#userContexts;
	}

	/**Loaded message context */
	get messageContexts() {
		return this.#messageContexts;
	}

	/**Loaded button interaction */
	get buttons() {
		return this.#buttons;
	}

	/**Loaded selectMenu interaction */
	get selectMenus() {
		return this.#selectMenus;
	}

	/**Loaded modal interaction */
	get modals() {
		return this.#modals;
	}

	/**Loaded all interaction */
	get interactions() {
		return {
			commands: this.commands,
			userContexts: this.userContexts,
			messageContexts: this.messageContexts,
			buttons: this.buttons,
			selectMenus: this.selectMenus,
			modals: this.modals
		};
	}

	/**
	 * @param {string} path
	 * @param {(value:fs.Dirent) => boolean} [predicate]
	 * @param {Set<String>} [pre]
	 * @returns {string[]}
	 */
	#getAllPath(path, predicate, pre = new Set()) {
		if (typeof predicate !== 'function') predicate = (value) => !/^(-|_|\.)/.test(value.name);
		if (!fs.existsSync(path)) return;
		const dir = fs.readdirSync(path, { withFileTypes: true });
		dir.forEach(v => {
			if (v.isFile() && predicate(v)) return pre.add(pathModule.resolve(path, v.name));
			if (v.isDirectory() && predicate(v)) this.#getAllPath(pathModule.resolve(path, v.name), predicate, pre);
		});
		return [...pre];
	}

	/**
	 * Load an interaction file
	 * @param {string} path Path of the directory where it is stored
	 * @param {(value:fs.Dirent) => boolean} predicate If false, exclude the file
	 */
	loadInteractions(path, predicate) {
		this.#getAllPath(path, predicate).forEach(InteractionPath => {
			const interactionData = require(InteractionPath);
			if (Array.isArray(interactionData)) {
				interactionData.forEach(interaction => {
					this.#loadInteraction(interaction.data, interaction.exec);
				});
			} else {
				this.#loadInteraction(interactionData.data, interactionData.exec);
			}
		});
		this.emit('interactionLoaded', this.interactions);
	}

	/**
	 * @param {InteractionRegisterData} data
	 * @param {InteractionRegisterCallback} exec
	 */
	#loadInteraction(data = {}, exec) {
		if (data.type === 'CHAT_INPUT') {
			this.#commands.set(data.name, new Command({ ...data, type: ApplicationCommandType.ChatInput }, exec));
		}
		if (data.type === 'MESSAGE') {
			this.#messageContexts.set(data.name, new MessageContext({ ...data, type: ApplicationCommandType.Message }, exec));
		}
		if (data.type === 'USER') {
			this.#userContexts.set(data.name, new UserContext({ ...data, type: ApplicationCommandType.User }, exec));
		}
		if (data.type === 'BUTTON') {
			this.#buttons.set(data.customId, new Button(data, exec));
		}
		if (data.type === 'SELECT_MENU') {
			this.#selectMenus.set(data.customId, new SelectMenu(data, exec));
		}
		if (data.type === 'MODAL') {
			this.#modals.set(data.customId, new Modal(data, exec));
		}
	}

	/**
	 * Register the command in the discord
	 * @param {Snowflake?} guildId Server ID to be registered
	 */
	async registerCommands(guildId) {
		const commands = await this.#client.application.commands.fetch();
		const interactions = this.commands.concat(this.userContexts, this.messageContexts);
		const types = { 1: 'command', 2: 'userContext', 3: 'messageContext' };
		interactions.forEach(cmd => {
			const find_cmd = commands.find(v => v.name === cmd.data.name && (cmd.guildId ?? guildId ?? null) === v.guildId);
			if (find_cmd) {
				find_cmd.edit(cmd.data);
				this.emit(`${types[find_cmd.type]}Edit`);
			}
			else {
				this.#client.application.commands.create(cmd.data, cmd.data.guildId ?? guildId);
				this.emit(`${types[cmd.data.type]}Add`, cmd);
			}
		})
		commands.forEach(cmd => {
			if (guildId !== cmd.guildId) return;
			const interaction = this.commands.find(v => cmd.name === v.data.name && (v.guildId ?? guildId ?? null) === cmd.guildId)
				?? this.userContexts.find(v => cmd.name === v.data.name && (v.guildId ?? guildId ?? null) === cmd.guildId)
				?? this.messageContexts.find(v => cmd.name === v.data.name && (v.guildId ?? guildId ?? null) === cmd.guildId);
			const type = types[cmd.type];
			if (interaction) {
				cmd.edit(interaction.data);
				this.emit(`${type}Edit`);
			}
			else {
				this.#client.application.commands.create(cmd.data, cmd.data.guildId ?? guildId);
			}
		});
	}

	/**
	 * Execute loaded interactions
	 * @param {Interaction} interaction Arguments of the discord interactionCreate event
	 * @param {any[]?} args Other arguments
	 */
	async run(interaction, ...args) {
		return new Promise((resolve, reject) => {
			let select;
			if (interaction.isChatInputCommand()) select = this.commands.get(interaction.commandName);
			if (interaction.isUserContextMenuCommand()) select = this.userContexts.get(interaction.commandName);
			if (interaction.isMessageContextMenuCommand()) select = this.messageContexts.get(interaction.commandName);
			if (interaction.isButton()) select = this.buttons.get(interaction.customId);
			if (interaction.isSelectMenu()) select = this.selectMenus.get(interaction.customId);
			if (interaction.type === 5) select = this.modals.get(interaction.customId);
			if (!select) {
				return reject({
					message: 'Not loaded interaction',
					code: 0x0
				});
			}
			if (select instanceof BaseCommand && select.isInCoolTime(interaction.user)) {
				return reject({
					message: 'During the cooltime period',
					code: 0x1,
					data: select
				});
			}
			resolve(select.run(interaction, select, ...args));
		});
	}
}

module.exports = DiscordInteractions;
