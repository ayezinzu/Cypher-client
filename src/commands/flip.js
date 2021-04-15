const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');

class FlipCommand extends Command {
	constructor() {
		super('flip', {
			aliases: ['flip'],
			category: 'general',
			description: {
				content: 'Flip a coin!',
				usage: '[No Arguments]'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	exec(message) {
		const coin = Math.ceil(Math.random() * 2);
		const embed = new MessageEmbed();
		embed
			.setTitle(`Coin landed on: ${coin === 1 ? 'Heads' : 'Tails'}`)
			.setColor('#ffff00')
			.setThumbnail(coin === 1 ? 'https://i.imgur.com/yiMx1SF.png' : 'https://i.imgur.com/9D95zQz.png');

		return message.channel.send(embed);
	}
}

module.exports = FlipCommand;
