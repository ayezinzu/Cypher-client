const { Command } = require('discord-akairo');
const { Message } = require('discord.js');
const Autor = require('../models/autoReactor');
const progressBar = require('../util/progressBar');
const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮'];

class DeleteReactorCommand extends Command {
	constructor() {
		super('delete-reactor', {
			aliases: ['delete-reactor'],
			args: [
				{
					id: 'id',
					type: 'phrase',
					prompt: {
						start: 'What is the ID of the reactor?',
						retry: 'ID of the reactor??'
					}
				}
			],
			category: 'general',
			description: {
				content: 'Delete active reactor.',
				usage: '<id>'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ id: string }} args - The args object.
	 */
	async exec(message, { id }) {
		const foundReactor = await Autor.findOne({ id }).catch(err => {
			console.log(err);
			return message.channel.send('An error occurred, please try again.');
		});
		await Autor.deleteOne({ id }).catch(err => {
			console.log(err);
			return message.channel.send('An error occurred, please try again.');
		});
		return message.channel.send('`Reactor successfully deleted !`');
	}
}

module.exports = DeleteReactorCommand;
