const { ApplicationCommandType } = require('discord.js');
const BaseCommand = require('./BaseCommand');

class UserContext extends BaseCommand {
  constructor(data, meta, callback) {
    super({ ...data, type: ApplicationCommandType.User }, meta, callback);
  }
}

module.exports = UserContext;
