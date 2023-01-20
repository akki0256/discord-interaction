const { ApplicationCommandType } = require('discord.js');
const BaseCommand = require('./BaseCommand');

class ChatInput extends BaseCommand {
	constructor(data, meta, callback) {
		super({ ...data, type: ApplicationCommandType.ChatInput }, meta, callback);
	}
}

module.exports = ChatInput;
