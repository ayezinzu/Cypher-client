const { Command } = require('discord-akairo');
const { Message, User } = require('discord.js');
const personalProfile = require('../models/personalProfile');

class ProfileCommand extends Command {
	constructor() {
		super('profile', {
			aliases: ['profile'],
			args: [
				{
					id: 'user',
					type: 'user',
					default: message => message.author
				}
			],
			category: 'general',
			description: {
				content: 'Check profile.',
				usage: '<user>'
			},
			channel: 'guild'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ user: User }} args -  The args object.
	 */
	async exec(message, { user }) {
		const profile = await personalProfile.findOne({ userid: user.id }).catch(() => undefined);
		if (!profile) {
			return message.channel.send('Profile not found!');
		}
		const emojis = [];
		profile.emojiData.forEach(e => emojis.push(`${e.emojiName}: ${e.count}`));
		return message.channel.send({
			embed: {
				color: '#ffc0cb',
				title: 'TheCypher Reactor Profile',
				description: `${user.tag}'s Profile:`,
				fields: [
					{ name: 'Emojis:', value: `${emojis.join('\n') || 'Nothing here.'}` },
					{ name: 'Gems:', value: profile.gems }
				],
				thumbnail: {
					url: user.displayAvatarURL({ dynamic: true })
				}
			}
		});
	}
}

module.exports = ProfileCommand;
