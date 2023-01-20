# @akki256/discord-interaction

> Module for easier handling of discord interaction

## Installation
```bash
npm install '@akki256/discord-interaction'
yarn add '@akki256/discord-interaction'
```

## Usage
index.js
```js
const discord = require('discord.js');
const client = new discord.Client({
	/* options */
});
const { DiscordInteractions } = require('@akki256/discord-interaction');
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
const { ChatInput } = require('@akki256/discord-interaction');

const pingCommand = new ChatInput({
	name: 'ping',
	description: 'pong!'
}, async interaction => {
	return await interaction.reply('pong!')
})

module.exports = [ pingCommand ];
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT License
