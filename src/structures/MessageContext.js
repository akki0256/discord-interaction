const { ApplicationCommandType } = require('discord.js');
const BaseCommand = require('./BaseCommand');

class MessageContext extends BaseCommand {
  constructor(data, meta, callback) {
    super({ ...data, type: ApplicationCommandType.Message }, meta, callback);
  }
}

module.exports = MessageContext;
