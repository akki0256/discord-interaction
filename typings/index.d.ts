import {
	Client,
	Interaction,
	ButtonInteraction,
	ModalSubmitInteraction,
	ChatInputApplicationCommandData,
	UserContextMenuCommandInteraction,
	UserApplicationCommandData,
	MessageContextMenuCommandInteraction,
	MessageApplicationCommandData,
	ChatInputCommandInteraction,
	Snowflake,
	Collection,
	User,
	UserSelectMenuInteraction,
	MentionableSelectMenuInteraction,
	ChannelSelectMenuInteraction,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	AutocompleteInteraction,
	Awaitable
} from 'discord.js';
import {
	Dirent
} from 'fs';
import * as ErrorCode from '../src/errors/ErrorCodes';
import { AutocompleteInteraction } from 'discord.js';
import { Events } from '../src/util/constant';

//#region Classes
export class DiscordInteractions {
	constructor(client: Client);
	run(interaction: Interaction, args: object): Promise<void>;
	registerCommands(option: RegisterCommandOptions | string): void;
	loadRegistries(basePath: string, predicate: (value: Dirent) => boolean): Promise<void>;
	/**@deprecated use {@link loadRegistries()}*/
	loadInteractions(basePath: string, predicate: (value: Dirent) => boolean): Promise<void>;

	get buttons(): Collection<string, Button>;
	get chatInputs(): Collection<string, ChatInput>;
	get messageContexts(): Collection<string, MessageContext>;
	get modals(): Collection<string, Modal>;
	get selectMenus(): Collection<string, SelectMenu<keyof SelectMenuInteractions>>;
	get userContexts(): Collection<string, UserContext>;

	get registries(): {
		buttons: Collection<string, Button>;
		chatInputs: Collection<string, ChatInput>;
		messageContexts: Collection<string, MessageContext>;
		modals: Collection<string, Modal>;
		selectMenus: Collection<string, SelectMenu>;
		userContexts: Collection<string, UserContext>;
	};
	/**@deprecated use {@link registries}*/
	get interactions(): {
		buttons: Collection<string, Button>;
		chatInputs: Collection<string, ChatInput>;
		messageContexts: Collection<string, MessageContext>;
		modals: Collection<string, Modal>;
		selectMenus: Collection<string, SelectMenu>;
		userContexts: Collection<string, UserContext>;
	};

	set guildId(id?: Snowflake);
	get guildId(): Snowflake;

	//#region EventEmitter
	public on<K extends keyof ClientEvents>(
		event: K,
		listener: (...args: ClientEvents[K]) => Awaitable<void>,
	): this;
	public on<S extends string | symbol>(
		event: Exclude<S, keyof ClientEvents>,
		listener: (...args: any[]) => Awaitable<void>,
	): this;

	public once<K extends keyof ClientEvents>(
		event: K,
		listener: (...args: ClientEvents[K]) => Awaitable<void>,
	): this;
	public once<S extends string | symbol>(
		event: Exclude<S, keyof ClientEvents>,
		listener: (...args: any[]) => Awaitable<void>,
	): this;

	public off<K extends keyof ClientEvents>(
		event: K,
		listener: (...args: ClientEvents[K]) => Awaitable<void>,
	): this;
	public off<S extends string | symbol>(
		event: Exclude<S, keyof ClientEvents>,
		listener: (...args: any[]) => Awaitable<void>,
	): this;

	public removeAllListeners<K extends keyof DiscordInteractionsEvents>(event?: K): this;
	public removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof DiscordInteractionsEvents>): this;
	//#endregion
}

export class BaseInteraction<T extends InteractionRegistryData, PARAMS extends object, U extends Callback<Registries, CallbackInteraction, PARAMS>> {
	#data: T;
	#callback: U;
	#id: Snowflake;
	constructor(data: T, callback: U);

	get data(): T;
	get callback(): U;
	get id(): Snowflake;
	protected _setId(id: Snowflake): void;
	protected _run(interaction: T, args: PARAMS): void;
	isCommand(): this is BaseCommand<CommandRegistryData, PARAMS, Callback<CommandRegistries, CommandCallback, PARAMS>>;
	toString(): string;
}

export class BaseCommand<T extends CommandRegistryData, PARAMS extends object, U extends Callback<CommandRegistries, CommandCallback, PARAMS>> extends BaseInteraction<T, PARAMS, U> {
	constructor(data: T, meta: CommandMetadata, callback: U);
	constructor(data: T, callback: U);

	get coolTime(): number;
	get guildId(): Snowflake | undefined;
	get timer(): Collection<Snowflake, Date>;

	resetCoolTime(user: User): boolean;
	getLastUse(user: User): number | null;
	getElapsedTime(user: User): number;
	isInCoolTime(user: User): boolean;
	/**@deprecated */
	getCoolTime(user: User): number | null;
	/**@deprecated */
	getLastUseDiff(user: User): number;
}

export class Button<PARAMS extends object = {}> extends BaseInteraction<CustomIdRegistry, PARAMS, Callback<Button, ButtonInteraction, PARAMS>> {

}

export class ChatInput<PARAMS extends object = {}> extends BaseCommand<ChatInputRegistry, PARAMS, Callback<ChatInput<PARAMS>, ChatInputCommandInteraction, PARAMS>> {
	constructor(data: ChatInputRegistry, callback: Callback<ChatInput<PARAMS>, ChatInputCommandInteraction, PARAMS>, autoComplete?: Callback<ChatInput<PARAMS>, AutocompleteInteraction, PARAMS>);
	constructor(data: ChatInputRegistry, meta: CommandMetadata, callback: Callback<ChatInput<PARAMS>, ChatInputCommandInteraction, PARAMS>, autoComplete?: Callback<ChatInput<PARAMS>, AutocompleteInteraction, PARAMS>);
	toCommandString(): `</${string}:${string}>`;
}

export class MessageContext<PARAMS extends object = {}> extends BaseCommand<MessageContextRegistry, PARAMS, Callback<MessageContext<PARAMS>, MessageContextMenuCommandInteraction, PARAMS>> {

}

export class Modal<PARAMS extends object = {}> extends BaseInteraction<CustomIdRegistry, PARAMS, Callback<Modal<PARAMS>, ModalSubmitInteraction, PARAMS>> {

}

export class SelectMenu<T extends keyof SelectMenuInteractions, PARAMS extends object = {}> extends BaseInteraction<SelectMenuRegistry, PARAMS, Callback<SelectMenu<T, PARAMS>, SelectMenuInteractions[T], PARAMS>> {
	constructor(data: SelectMenuRegistry<T>, callback: Callback<SelectMenu<T, PARAMS>, SelectMenuInteractions[T], PARAMS>)
}

export class UserContext<PARAMS extends object = {}> extends BaseCommand<UserContextRegistry, PARAMS, Callback<UserContext, UserContextMenuCommandInteraction, PARAMS>> {

}

export class InteractionsError extends Error {
	code: keyof typeof ErrorCode;
	public data: ChatInput | MessageContext | UserContext;

	get name(): string;
}
//#endregion

//#region Typedef
export const version: string;
export * from '../src/util/constant';
export const ErrorCodes: typeof ErrorCode;
/**@deprecated use {@link ErrorCodes} */
export const InteractionErrorCodes: typeof ErrorCode;

type PartialRecord<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface ClientEvents {
	ChatInputCreate: [command: ApplicationCommand];
	ChatInputEdit: [command: ApplicationCommand];
	ChatInputDelete: [command: ApplicationCommand];
	fileLoad: [filePath: string];
	error: [error: Error];
	interactionLoaded: [registries: DiscordInteractions['registries']];
	UserCreate: [command: ApplicationCommand];
	UserDelete: [command: ApplicationCommand];
	UserEdit: [command: ApplicationCommand];
	MessageCreate: [command: ApplicationCommand];
	MessageEdit: [command: ApplicationCommand];
	MessageDelete: [command: ApplicationCommand];
}

export type Callback<
	THIS extends Registries,
	Interaction,
	PARAMS,
> = (
	this: THIS,
	interaction: Interaction,
	params: PARAMS
) => void;

export type Registries =
	| CommandRegistries
	| Button
	| Modal
	| SelectMenu<keyof SelectMenuInteractions>
export type CommandRegistries =
	| ChatInput
	| MessageContext
	| UserContext

export type InteractionRegistryData = CommandRegistryData | CustomIdRegistry | SelectMenuRegistry;
export type CallbackInteraction = CommandCallback | ButtonInteraction | ModalSubmitInteraction | SelectMenuInteractions[keyof SelectMenuInteractions];

export type CommandRegistryData = ChatInputRegistry | UserContextRegistry | MessageContextRegistry;
export type CommandCallback = ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction;

export interface ChatInputRegistry extends ChatInputApplicationCommandData {

}

export interface UserContextRegistry extends PartialRecord<UserApplicationCommandData, 'type'> {

}

export interface MessageContextRegistry extends PartialRecord<MessageApplicationCommandData, 'type'> {

}

export interface CustomIdRegistry {
	customId: string | RegExp;
}

export interface SelectMenuRegistry<T extends keyof SelectMenuInteractions = keyof SelectMenuInteractions> extends CustomIdRegistry {
	type: T;
}

interface SelectMenuInteractions {
	String: StringSelectMenuInteraction,
	User: UserSelectMenuInteraction,
	Role: RoleSelectMenuInteraction,
	Mentionable: MentionableSelectMenuInteraction,
	Channel: ChannelSelectMenuInteraction,
}

export interface CommandMetadata {
	/**GuildId to register the command. */
	guildId?: Snowflake;
	/**Number of milliseconds before the next command becomes available. */
	coolTime?: number;
}

export type RegisterCommandOptions = Partial<{
	/**
	 * GuildId to register the command.
	 * The server ID in each file takes precedence.
	 */
	guildId: Snowflake;
	/**If true, the loaded command is synchronized with the server */
	syncWithCommand: boolean;
	/**
	 * If true, the loaded command is synchronized with the server
	 * @deprecated use {@link RegisterCommandOptions.syncWithCommand}
	 */
	deleteNoLoad: boolean;
}>;
//#endregion