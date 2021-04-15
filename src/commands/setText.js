const { Command } = require('discord-akairo');
const { Message, MessageEmbed, TextChannel } = require('discord.js');
const setText = require('../models/setText');

class SetTextCommand extends Command {
	constructor() {
		super('set-text', {
			aliases: ['set-text'],
			args: [
				{
					id: 'method',
					type: ['add', 'remove', 'view'],
					prompt: {
						start: 'Select a method. Add, remove, or view.',
						retry: 'Select a correct method from add, remove, or view.'
					}
				},
				{
					id: 'channel',
					type: 'textChannel'
				}
			],
			channel: 'guild',
			description: {
				content: 'Set text something something.',
				usage: '<method> <rest>'
			},
			category: 'general'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ method: 'add' | 'remove' | 'view'; channel: TextChannel }} args - The args object.
	 */
	async exec(message, { method, channel }) {
		const check = await setText.exists({ guildid: message.guild.id });
		const guild = check
			? await setText.findOne({ guildid: message.guild.id })
			: new setText();

		if (method === 'add') {
			guild.guildid = message.guild.id;
			guild.channels.push(channel.id);
			return guild
				.save()
				.then(() => {
					const confirmation = new MessageEmbed()
						.setTitle('📀 Channels recording texts.')
						.setDescription(`✅ ${channel} has been set to record texts.`)
						.setColor('#800080')
						.addField(
							'Channels:',
							`${guild.channels.map(ch => `> <#${ch}>`).join('\n')}`
						);
					message.channel.send(confirmation);
				})
				.catch(() => message.channel.send('Something went wrong...'));
		}
		if (method === 'remove') {
			guild.channels = guild.channels.filter(ch => ch !== channel.id);
			return guild
				.save()
				.then(() => message.channel.send('Channel removed successfully!'));
		}
		if (method === 'view') {
			return message.channel.send({
				embed: {
					title: '📀 Channels recording texts.',
					color: 0x800080,
					fields: [
						{
							name: 'Channels:',
							value: `${guild.channels.map(ch => `> <#${ch}>`).join('\n')}`
						}
					]
				}
			});
		}
		return message.channel.send('Method not found!');
	}
}

module.exports = SetTextCommand;
