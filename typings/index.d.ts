import {
	AnySelectMenuInteraction,
	ApplicationCommandType,
	Awaitable,
	BaseInteraction as DiscordBaseInteraction,
	ButtonInteraction,
	ChannelSelectMenuInteraction,
	ChatInputApplicationCommandData,
	ChatInputCommandInteraction,
	Client,
	Collection,
	GuildMember,
	MentionableSelectMenuInteraction,
	Message,
	MessageApplicationCommandData,
	MessageContextMenuCommandInteraction,
	ModalSubmitInteraction,
	RoleSelectMenuInteraction,
	Snowflake,
	StringSelectMenuInteraction,
	ThreadMember,
	User,
	UserApplicationCommandData,
	UserContextMenuCommandInteraction,
	UserSelectMenuInteraction
} from 'discord.js';
import fs from 'node:fs';
import { EventEmitter } from 'node:stream';

//#region Classes

export class BaseInteraction<T extends InteractionData, U extends InteractionInteraction> {
	#data: T;
	#callback: U;
	protected constructor(data: T, callback: (interaction: U, data: BaseInteraction<T, U>, ...args: any[]) => any);

	public get data(): T;
	public get callback(): (interaction: U, data: BaseInteraction<T, U>, ...args: any[]) => any;
	protected run(interaction: U, ...args: any[]): any;
}

export class BaseCommand<T extends CommandData, U extends CommandInteraction> extends BaseInteraction<T, U> {
	#guildId: Snowflake | null;
	#timer: Collection<Snowflake, Date>;
	#coolTime: number;
	protected constructor(data: T, meta: CommandMetadata, callback: (interaction: U, data: BaseCommand<T, U>, ...args: any[]) => any);
	protected constructor(data: T, callback: (interaction: U, data: BaseCommand<T, U>, ...args: any[]) => any);

	public get coolTime(): number;
	public get guildId(): Snowflake | undefined;
	public get timer(): Collection<Snowflake, Date>;

	public getCoolTime(user: User): number | null;
	public getLastUseDiff(user: User): number;
	public IsInCoolTime(user: User): boolean;
	public resetCoolTime(user: User): boolean;
}

export class ChatInput extends BaseCommand<ChatInputData, ChatInputCommandInteraction> {
	public constructor(data: ChatInputData, meta: CommandMetadata, callback: (interaction: ChatInputCommandInteraction, data: ChatInput, ...args: any[]) => any);
	public constructor(data: ChatInputData, callback: (interaction: ChatInputCommandInteraction, data: ChatInput, ...args: any[]) => any);
}

export class UserContext extends BaseCommand<UserContextData, UserContextMenuCommandInteraction> {
	public constructor(data: UserContextData, meta: CommandMetadata, callback: (interaction: UserContextMenuCommandInteraction, data: UserContext, ...args: any[]) => any);
	public constructor(data: UserContextData, callback: (interaction: UserContextMenuCommandInteraction, data: UserContext, ...args: any[]) => any);
}

export class MessageContext extends BaseCommand<MessageContextData, MessageContextMenuCommandInteraction> {
	public constructor(data: MessageContextData, meta: CommandMetadata, callback: (interaction: MessageContextMenuCommandInteraction, data: MessageContext, ...args: any[]) => any);
	public constructor(data: MessageContextData, callback: (interaction: MessageContextMenuCommandInteraction, data: MessageContext, ...args: any[]) => any);
}

export class Button extends BaseInteraction<CustomIdData, ButtonInteraction> {
	public constructor(data: CustomIdData, callback: (interaction: ButtonInteraction, data: Button, ...args: any[]) => any);
}

export class SelectMenu<T extends SelectMenuType> extends BaseInteraction<SelectMenuData<T>, SelectMenuInteraction<T>> {
	public constructor(data: SelectMenuData<T>, callback: (interaction: SelectMenuInteraction<T>, data: SelectMenu<T>, ...args: any[]) => any);
}

export class Modal extends BaseInteraction<CustomIdData, ModalSubmitInteraction> {
	public constructor(data: CustomIdData, callback: (interaction: ModalSubmitInteraction, data: Modal, ...args: any[]) => any);
}

export class DiscordInteractions extends EventEmitter {
	/**
	 * @param client discord client
	 */
	public constructor(client: Client);
	#chatInputs: Interactions['chatInputs'];
	#userContexts: Interactions['userContexts'];
	#messageContexts: Interactions['messageContexts'];
	#buttons: Interactions['buttons'];
	#selectMenus: Interactions['selectMenus'];
	#modals: Interactions['modals'];
	#interactions: Interactions;

	get chatInputs(): Interactions['chatInputs'];
	get userContexts(): Interactions['userContexts'];
	get messageContexts(): Interactions['messageContexts'];
	get buttons(): Interactions['buttons'];
	get selectMenus(): Interactions['selectMenus'];
	get modals(): Interactions['modals'];
	get interactions(): Interactions;

	loadInteractions(basePath: string, predicate?: (value: fs.Dirent) => boolean): Promise<void>;
	registerCommands(options: registerOption): Promise<void>;
	registerCommands(guildId?: Snowflake): Promise<void>;
	deleteNoLoadInteractions(guildId?: Snowflake): Promise<void>;
	setGuildOnly(guildId: Snowflake): DiscordInteractions;
	resetGuildOnly(): DiscordInteractions;
	run(interaction: InteractionInteraction, ...args: any[]): Promise<any>;

	#getAllPath(path: string, predicate?: (value: fs.Dirent) => boolean, pre?: Set<string>): string[];
	#loadInteraction(interaction: Button | ChatInput | MessageContext | Modal | SelectMenu<any> | UserContext): void;
	#editOrCreateCommand(interactionData: ChatInput | MessageContext | UserContext, options: { guildId?: Snowflake }): Promise<void>;
	#isChatInputCommand(interaction: DiscordBaseInteraction): interaction is ChatInputCommandInteraction;
	#isContextMenuCommand(interaction: DiscordBaseInteraction): interaction is UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction;
	#isUserContextMenuCommand(interaction: DiscordBaseInteraction): interaction is UserContextMenuCommandInteraction;
	#isMessageContextMenuCommand(interaction: DiscordBaseInteraction): interaction is MessageContextMenuCommandInteraction;
	#isButton(interaction: DiscordBaseInteraction): interaction is ButtonInteraction;
	#isAnySelectMenu(interaction: DiscordBaseInteraction): interaction is AnySelectMenuInteraction;
	#isModalSubmit(interaction: DiscordBaseInteraction): interaction is ModalSubmitInteraction;

	//#region EventEmitter
	public on<K extends keyof DiscordInteractionsEvents>(
		event: K,
		listener: (...args: DiscordInteractionsEvents[K]) => Awaitable<void>,
	): this;
	public on<S extends string | symbol>(
		event: Exclude<S, keyof DiscordInteractionsEvents>,
		listener: (...args: any[]) => Awaitable<void>,
	): this;

	public once<K extends keyof DiscordInteractionsEvents>(
		event: K,
		listener: (...args: DiscordInteractionsEvents[K]) => Awaitable<void>,
	): this;
	public once<S extends string | symbol>(
		event: Exclude<S, keyof DiscordInteractionsEvents>,
		listener: (...args: any[]) => Awaitable<void>,
	): this;

	public emit<K extends keyof DiscordInteractionsEvents>(event: K, ...args: DiscordInteractionsEvents[K]): boolean;
	public emit<S extends string | symbol>(event: Exclude<S, keyof DiscordInteractionsEvents>, ...args: unknown[]): boolean;

	public off<K extends keyof DiscordInteractionsEvents>(
		event: K,
		listener: (...args: DiscordInteractionsEvents[K]) => Awaitable<void>,
	): this;
	public off<S extends string | symbol>(
		event: Exclude<S, keyof DiscordInteractionsEvents>,
		listener: (...args: any[]) => Awaitable<void>,
	): this;

	public removeAllListeners<K extends keyof DiscordInteractionsEvents>(event?: K): this;
	public removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof DiscordInteractionsEvents>): this;
	//#endregion
}

export class InteractionsError extends Error { }

//#endregion

//#region Typedef

export interface DiscordInteractionsEvents {
	ChatInputCreate: [command: ChatInput];
	ChatInputEdit: [command: ChatInput];
	ChatInputDelete: [command: UserContext];
	error: [error: Error];
	interactionLoaded: [Interaction: Interactions];
	UserCreate: [command: MessageContext];
	UserDelete: [command: UserContext];
	UserEdit: [command: MessageContext];
	MessageCreate: [command: UserContext];
	MessageEdit: [command: UserContext];
	MessageDelete: [command: UserContext];
}

export interface Interactions {
	buttons: Collection<String, Button>,
	chatInputs: Collection<String, ChatInput>,
	messageContexts: Collection<String, MessageContext>,
	modals: Collection<String, Modal>,
	selectMenus: Collection<String, SelectMenu<any>>,
	userContexts: Collection<String, UserContext>,
}

export enum SelectMenuType {
	String = 'String',
	User = 'User',
	Role = 'Role',
	Mentionable = 'Mentionable',
	Channel = 'Channel'
}

export interface CommandMetadata {
	/**GuildId to register the command */
	guildId?: Snowflake,
	/**Time before the command can be reused */
	coolTime?: number
}

export type InteractionData = CommandData | CustomIdData;
export type InteractionInteraction = CommandInteraction | ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction;

export type CommandData = ChatInputData | UserContextData | MessageContextData;
export type CommandInteraction = ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction;

export type ChatInputData = ChatInputApplicationCommandData;
export type UserContextData = Omit<UserApplicationCommandData, 'type'> & { type?: ApplicationCommandType.User };
export type MessageContextData = Omit<MessageApplicationCommandData, 'type'> & { type?: ApplicationCommandType.Message };
export interface CustomIdData {
	customId: string | RegExp
}
export interface SelectMenuData<T extends SelectMenuType> extends CustomIdData {
	type: T
}

export type SelectMenuInteraction<T extends SelectMenuType> =
	T extends SelectMenuType.String ? StringSelectMenuInteraction :
	T extends SelectMenuType.User ? UserSelectMenuInteraction :
	T extends SelectMenuType.Role ? RoleSelectMenuInteraction :
	T extends SelectMenuType.Mentionable ? MentionableSelectMenuInteraction :
	T extends SelectMenuType.Channel ? ChannelSelectMenuInteraction :
	never;

export type UserResolvable = DiscordBaseInteraction | User | ThreadMember | GuildMember | Message | string;
export const version: string;
export enum DiscordInteractionsErrorCodes {
	CommandHasCoolTime = 'CommandHasCoolTime'
}

export interface registerOption {
	guildId?: Snowflake
	deleteNoLoad?: boolean
}

//#endregion