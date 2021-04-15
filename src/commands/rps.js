const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');

class RPSCommand extends Command {
	constructor() {
		super('rock-paper-scissors', {
			aliases: ['rock-paper-scissors', 'r-p-s'],
			args: [
				{
					id: 'user',
					type: (_, phrase) => {
						if (/^r(?:o(?:c(?:k)?)?)?/g.test(phrase) || phrase === '0') return 0;
						if (/^p(?:a(?:p(?:e(?:r(?:s)?)?)?)?)?/g.test(phrase) || phrase === '1') return 1;
						if (/^s(?:c(?:i(?:s(?:s(?:o(?:r(?:s)?)?)?)?)?)?)?/g.test(phrase) || phrase === '2') return 2;
						return undefined;
					},
					prompt: {
						start: 'Choose one from Rock, Papers, or Scissors.',
						retry: 'Invalid Choice! Choose one from Rock, Papers, or Scissors.'
					}
				}
			],
			category: 'general',
			description: {
				content: 'Play a game of Rock, Papers, and Scissors with the bot.',
				usage: '<Rock | Papers | Scissors>'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ user: number }} args - The args object.
	 */
	exec(message, { user }) {
		const emojis = ['✊', '✋', '✌'];
		const bot = Math.round(Math.random() * 2);
		const embed = new MessageEmbed();
		embed.setDescription(`${message.author}: ${emojis[user]}\n${this.client.user}: ${emojis[bot]}`);
		if (bot === user) {
			embed.setTitle('__Tie!__ 👔').setColor('#ffff00').setFooter("Let's try again!");
			message.channel.send(embed);
			return this.handler.handleDirectCommand(message, '', this);
		}

		if ((bot === 0 && user === 2) || (bot === 1 && user === 0) || (bot === 2 && user === 1)) {
			embed.setTitle('__You lose!__ ❌').setColor('#ff0000');
			return message.channel.send(embed);
		}

		if ((bot === 0 && user === 1) || (bot === 1 && user === 2) || (bot === 2 && user === 0)) {
			embed.setTitle('__You win!__ ✅').setColor('#00ff00');
			return message.channel.send(embed);
		}
		return undefined;
	}
}

module.exports = RPSCommand;
