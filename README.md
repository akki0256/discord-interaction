# @akki0256/discord-interaction

> Module for easier handling of discord interaction

## Installation
- npm
```bash
npm install '@akki0256/discord-interaction'
```
- yarn
```bash
yarn add '@akki0256/discord-interaction'
```

## Usage
index.js
```js
const discord = require('discord.js');
const client = new discord.Client({
	/* options */
});
const { DiscordInteractions } = require('@akki0256/discord-interaction');
const interactions = new DiscordInteractions(client);
interactions.loadInteractions('./interactions');

client.on('ready',() => {
	interactions.registerCommands();
})

client.on('interactionCreate', interaction => {
	interactions.run(interaction).then(console.info).catch(console.warn);
})

client.login('token');
```
interactions/ping.js
```js
/**@type {import('@akki0256/discord-interaction').ChatInputRegister} */
const ping_command = {
	data: {
		type: 'CHAT_INPUT',
		name: 'ping',
		description: 'pong!'
	},
	exec: async (interaction) => {
		return await interaction.reply('pong!');
	}
}

module.exports = [ ping_command ];
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT License
