'use strict';
const ErrorCodes = require('./errors/ErrorCodes');

module.exports = {
	...require('./util/constant'),
	InteractionsError: require('./errors/InteractionsError'),
	ErrorCodes,
	DiscordInteractionsErrorCodes: ErrorCodes,
	DiscordInteractions: require('./client/DiscordInteractions'),
	BaseCommand: require('./structures/BaseCommand'),
	BaseInteraction: require('./structures/BaseInteraction'),
	Button: require('./structures/Button'),
	ChatInput: require('./structures/ChatInput'),
	MessageContext: require('./structures/MessageContext'),
	Modal: require('./structures/Modal'),
	SelectMenu: require('./structures/SelectMenu'),
	UserContext: require('./structures/UserContext'),
	version: require('../package.json').version,
};