const { Command } = require('discord-akairo');
const { Message } = require('discord.js');
const Autor = require('../models/autoReactor');
const progressBar = require('../util/progressBar');
const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮'];

class StopReactorCommand extends Command {
	constructor() {
		super('stop-reactor', {
			aliases: ['stop-reactor'],
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
				content: 'Stop active reactor.',
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
		if (foundReactor.isRunning) {
			foundReactor.isRunning = false;
			foundReactor.markModified('isRunning');
			await foundReactor.save().catch(console.log);
			if (foundReactor.anon) {
				const updatedDoc = await Autor.findOne({ id }).catch(() => {
					message.channel.send('No saved reactors found. Please create a reactor using `$reactor`');
				});
				const fetchedChannel = await this.client.channels
					.fetch(updatedDoc.reactorSettings.channel)
					.catch(err => {
						console.log(err);
					});

				const fetchedMessage = await fetchedChannel.messages
					.fetch(updatedDoc.reactorSettings.messageId)
					.catch(err => {
						console.log(err);
					});
				const embedObject = fetchedMessage.embeds[0];
				updatedDoc.isRunning = false;
				for (let i = 0; i < updatedDoc.optionsText.length; i++) {
					delete embedObject.fields[i];
				}
				let optionString = '';
				let k = 0;
				for (const foo of updatedDoc.optionsText) {
					optionString += `\n ${letters[k++]} ***${foo.text}*** \n ${progressBar(foo.percent, 100, 10)}`;
				}

				embedObject.setDescription(`${optionString}\n 📩 Total Votes : ${updatedDoc.grandTotal.length}`);
				embedObject.setFooter('The poll has ended');
				fetchedMessage.edit(embedObject);
				await updatedDoc.save().catch(console.log);
			}
			return message.channel.send('`Reactor successfully terminated !`');
		}
		return message.channel.send('`Reactor is already idle !`');
	}
}

module.exports = StopReactorCommand;
