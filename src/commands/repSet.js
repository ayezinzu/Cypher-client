const { Command } = require('discord-akairo');
const { Message } = require('discord.js');
const guildSettings = require('../models/guildSettings');

class RepSetCommand extends Command {
	constructor() {
		super('rep-set', {
			aliases: ['rep-set'],
			args: [
				{
					id: 'name',
					type: (_, phrase) => {
						if (!phrase?.length) return undefined;
						if (phrase.length < 3 || phrase.length > 10) return undefined;
						return phrase.toLowerCase();
					},
					prompt: {
						start: 'What should the rep be named as?',
						retry: 'What should the rep be named as? [ > 3 && < 10 ]'
					}
				}
			],
			category: 'general',
			userPermissions: ['ADMINISTRATOR'],
			channel: 'guild',
			description: {
				content: 'Set the rep.',
				usage: '<rep-name>'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ name: string }} args - The args object.
	 */
	async exec(message, { name }) {
		const guildRes = await guildSettings.findOne({
			guildID: message.guild.id
		});

		if (guildRes) {
			guildRes.repName = name;
			guildRes.markModified('repName');
			guildRes.save().catch(console.log);
		} else {
			const newRes = new guildSettings({
				guildID: message.guild.id,
				repName: name
			});
			newRes.save().catch(console.log);
		}

		return message.channel.send(`Done! You can now trigger rep using ${name}!`);
	}
}

module.exports = RepSetCommand;
