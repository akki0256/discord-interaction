const { ApplicationCommandType } = require('discord.js');

const commandTypes = /** @type {const} */ ({
	[ApplicationCommandType.ChatInput]: 'ChatInput',
	[ApplicationCommandType.Message]: 'MessageContext',
	[ApplicationCommandType.User]: 'UserContext',
});

const SelectMenuType = /** @type {const} */ ({
	String: 'String',
	User: 'User',
	Role: 'Role',
	Mentionable: 'Mentionable',
	Channel: 'Channel'
});

const Events = /**@type {const} */ ({
	ChatInputCreate: 'ChatInputCreate',
	ChatInputEdit: 'ChatInputEdit',
	ChatInputDelete: 'ChatInputDelete',
	fileLoad: 'fileLoad',
	error: 'error',
	interactionLoaded: 'interactionLoaded',
	UserContextCreate: 'UserContextCreate',
	UserContextDelete: 'UserContextDelete',
	UserContextEdit: 'UserContextEdit',
	MessageContextCreate: 'MessageContextCreate',
	MessageContextEdit: 'MessageContextEdit',
	MessageContextDelete: 'MessageContextDelete',
	SyncedCommand: 'SyncedCommand',
});

module.exports = { commandTypes, SelectMenuType, Events };