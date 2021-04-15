const { Listener } = require('discord-akairo');
const { Message } = require('discord.js');
const guildSettings = require('../models/guildSettings');

class MessageInvalidListener extends Listener {
	constructor() {
		super('messageInvalid', {
			emitter: 'commandHandler',
			event: 'messageInvalid'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	async exec(message) {
		if (!message.guild) return undefined;
		const { prefix } = this.client.commandHandler;
		if (!message.content.startsWith(prefix)) return undefined;
		const guildData = await guildSettings.findOne({ guildID: message.guild.id });
		if (!guildData) return undefined;
		const { repName: rep } = guildData;
		const regex = new RegExp(`^${prefix}\s*${rep}|<@!?${this.client.user.id}>`, 'gi');
		if (!regex.test(message.content)) return undefined;
		const args = message.content.slice(prefix.length + rep.length - 1);
		const command = this.client.commandHandler.modules.get('rep-give');
		return this.client.commandHandler.handleDirectCommand(message, args, command);
	}
}

module.exports = MessageInvalidListener;
