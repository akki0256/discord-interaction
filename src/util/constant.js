const { ApplicationCommandType } = require('discord.js');

const commandTypes = /** @type {const} */ ({
	[ApplicationCommandType.ChatInput]: 'chatInput',
	[ApplicationCommandType.Message]: 'messageContext',
	[ApplicationCommandType.User]: 'userContext',
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
	UserCreate: 'UserCreate',
	UserDelete: 'UserDelete',
	UserEdit: 'UserEdit',
	MessageCreate: 'MessageCreate',
	MessageEdit: 'MessageEdit',
	MessageDelete: 'MessageDelete',
});

module.exports = { commandTypes, SelectMenuType, Events };