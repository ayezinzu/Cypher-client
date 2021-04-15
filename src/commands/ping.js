const { Command } = require('discord-akairo');
const { Message } = require('discord.js');

class PingCommand extends Command {
	constructor() {
		super('ping', {
			aliases: ['ping'],
			category: 'general',
			description: {
				content: 'Pings the bot to check for latency.',
				usage: '[No Arguments]'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	async exec(message) {
		const m = await message.channel.send('Pinging...');
		return m
			.edit(
				`Ping!\nClient Latency: ${this.client.ws.ping} ms\nAPI Latency: ${Math.round(
					(m.editedTimestamp || m.createdTimestamp) - (message.editedTimestamp || message.createdTimestamp)
				)} ms`
			)
			.catch(() => undefined);
	}
}

module.exports = PingCommand;
