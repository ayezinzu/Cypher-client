const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const axios = require('axios');
let running = false;
// eslint-disable-next-line init-declarations
let theInterval;
class RandomCommand extends Command {
	constructor() {
		super('wordgen', {
			aliases: ['wordgen'],
			args: [
				{
					id: 'method',
					type: ['start', 'stop', 'setup'],
					prompt: {
						start: 'Select a method. start or stop.',
						retry: 'Select a correct method from start or stop.'
					}
				},
				{
					id: 'time',
					type: 'number',
					default: 5
				},
				{
					id: 'difficulty',
					type: 'string',
					default: 'ez'
				},
				{
					id: 'autooff',
					type: 'string',
					default: 'no'
				}
			],
			category: 'general',
			description: {
				content: 'Generate a random word.',
				usage: '$random -[time]'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{method : 'start' | 'stop' | 'setup' ; time: Number; difficulty: String; autooff: String}}
	 */

	async exec(message, { method, time, difficulty, autooff }) {
		console.log('time', time);
		console.log('difficulty', difficulty);
		const filter = m => m.author.id === message.author.id;
		// eslint-disable-next-line init-declarations

		let autoofftime;
		if (autooff === 'autooff') {
			const autoOffMsg = await message.channel.send(
				'Please reply with the number hours after which you will like to terminate the wordgen.'
			);
			const collected = await autoOffMsg.channel
				.awaitMessages(filter, {
					max: 1,
					time: 300000,
					errors: ['time']
				})
				.catch(err => message.channel.send('you took too long.'));
			autoofftime = collected.first().content;
		}
		if (method === 'start') {
			if (running) {
				return message.channel.send('Word gen is already running.');
			}
			running = true;
			const randomWordEmbed = new MessageEmbed();
			randomWordEmbed.setTitle('Word gen');
			randomWordEmbed.setColor('#DC143C');
			randomWordEmbed.setThumbnail(
				'https://cdn.discordapp.com/attachments/723940968843444268/814920754948735006/dices.png'
			);
			let fieldString = 'Generating a random word...';
			randomWordEmbed.addField('word ', fieldString);
			const randomWordMsg = await message.channel.send(randomWordEmbed);
			// eslint-disable-next-line init-declarations
			const selectRandomWord = someArray =>
				someArray[Math.floor(Math.random() * someArray.length)];
			// eslint-disable-next-line prefer-const
			let randomWordArray = require('fs')
				.readFileSync('words')
				.toString()
				.trim()
				.split('\r\n');
			let randomWord;
			theInterval = setInterval(async () => {
				if (difficulty === 'ez') {
					// eslint-disable-next-line max-len
					fieldString = `__***${selectRandomWord(
						randomWordArray
					)}***__ \n - \n __***${selectRandomWord(
						randomWordArray
					)}***__ \n - \n __***${selectRandomWord(
						randomWordArray
					)}***__ \n - \n __***${selectRandomWord(
						randomWordArray
					)}***__ \n - \n __***${selectRandomWord(randomWordArray)}***__`;
				} else if (difficulty === 'real') {
					randomWord = await axios.get(
						'https://random-word-api.herokuapp.com/word?number=5'
					);

					// eslint-disable-next-line max-len
					fieldString = `__***${randomWord.data[0]}***__ \n - \n __***${randomWord.data[1]}***__ \n - \n __***${randomWord.data[2]}***__ \n - \n __***${randomWord.data[3]}***__ \n - \n __***${randomWord.data[4]}***__`;
				}
				const editedEmbed = randomWordEmbed.spliceFields(0, 1);
				editedEmbed.addField('word ', fieldString);
				randomWordMsg.edit(editedEmbed);
			}, time * 1000);
		}
		// eslint-disable-next-line init-declarations
		let autoofftimeout;
		if (autoofftime) {
			autoofftimeout = setTimeout(() => {
				clearInterval(theInterval);
				running = false;
				message.channel.send('Word gen terminated.');
			}, autoofftime * 3600000);
		}
		if (method === 'stop') {
			if (!running) {
				return message.channel.send('Theres no word gen running currently.');
			}
			clearInterval(theInterval);
			message.channel.send('Word gen terminated.');
			// eslint-disable-next-line require-atomic-updates
			running = false;
			if (autoofftimeout) {
				clearTimeout(autoofftimeout);
			}
		}
	}
}

module.exports = RandomCommand;
