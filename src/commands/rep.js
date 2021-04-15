const { Command } = require('discord-akairo');
const { Message } = require('discord.js');

class RepCommand extends Command {
	constructor() {
		super('rep', {
			aliases: ['rep'],
			args: [
				{
					id: 'method',
					type: ['set', 'show', 'give'],
					prompt: {
						start: 'Please select either set or show.',
						retry: 'Please select either set or show.'
					}
				},
				{
					id: 'args',
					match: 'rest'
				}
			],
			channel: 'guild',
			category: 'general',
			description: {
				content: 'Rep something something.',
				usage: 'Describe the command usage here.'
			}
		});
	}

	/**
	 *
	 * @param {Message} message - The message object.
	 * @param {{ args: string; method: 'set' | 'show' | 'give' }} args - The args object.
	 */
	exec(message, { args, method }) {
		if (!method) return undefined;
		const command = {
			show: this.handler.modules.get('rep-show'),
			set: this.handler.modules.get('rep-set'),
			give: this.handler.modules.get('rep-give')
		}[method];
		if (!command) return undefined;
		return this.handler.handleDirectCommand(message, args, command, true);
	}
}

module.exports = RepCommand;
