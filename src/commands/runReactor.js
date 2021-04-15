const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const schedule = require('node-schedule');
const autor = require('../models/autoReactor');
const progressBar = require('../util/progressBar');
const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮'];

class RunReactorCommand extends Command {
	constructor() {
		super('run-reactor', {
			aliases: ['run-reactor'],
			args: [
				{
					id: 'id',
					type: 'phrase',
					prompt: {
						start: 'What is your reactor id?',
						retry: 'What is your reactor id?'
					}
				}
			],
			category: 'general',
			description: {
				content: 'Run Reactor command',
				usage: '<id>'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ id: string }} args - The args object.
	 */
	async exec(message, { id }) {
		const msgFilter = m => m.author.id === message.author.id;
		const foundDoc = await autor
			.findOne({ id })
			.catch(() => message.channel.send('No saved reactors found. Please create a reactor using `$reactor`'));

		if (foundDoc.isRunning) {
			return message.channel.send('`This reactor is already running.`');
		}

		const askTime = new MessageEmbed().setTitle('Reaction settings');
		const settings = {};
		if (foundDoc.isPoll) {
			askTime
				.setDescription(
					'When do you want to schedule this ? \n `1` - Start right now \n `2` - Schedule a time.'
				)
				.setColor('#800080');

			const askTimeEmbed = await message.channel.send(askTime);
			let collected = await askTimeEmbed.channel
				.awaitMessages(msgFilter, {
					max: 1,
					time: 200000,
					errors: ['time']
				})
				.catch(err => {
					console.log(err);
					return message.channel.send('invalid input');
				});

			if (collected.first().content === '1') {
				settings.startTime = 0;
			} else if (collected.first().content === '2') {
				settings.scheduled = true;
				askTime.setDescription('Enter the day of the month you would want to schedule the poll.');
				const askStartDayEmbed = await message.channel.send(askTime);
				collected = await askStartDayEmbed.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 200000,
						errors: ['time']
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('invalid input');
					});
				settings.startTimeDay = parseInt(collected.first().content, 10);
				askTime.setDescription('Enter the hour of the day you would want to schedule the poll.');
				const askStartHourEmbed = await message.channel.send(askTime);
				collected = await askStartHourEmbed.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 200000
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('invalid input');
					});
				settings.startTimeHour = parseInt(collected.first().content, 10);
				askTime.setDescription('Enter the minute of the hour you would want to schedule the poll.');
				const askStartMinuteEmbed = await message.channel.send(askTime);
				collected = await askStartMinuteEmbed.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 200000
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('invalid input');
					});
				settings.startTimeMinute = parseInt(collected.first().content, 10);
			}

			askTime.setDescription(
				// prettier-ignore
				'When do you want to terminate the process of the reactor ?\n' +
				'`1` - Schedule a time\n`2` - Custom - `$stopreactor <reactoridhere>`'
			);

			const askEndTimeEmbed = await message.channel.send(askTime);
			collected = await askEndTimeEmbed.channel
				.awaitMessages(msgFilter, {
					max: 1,
					time: 200000,
					errors: ['time']
				})
				.catch(err => {
					console.log(err);
					return message.channel.send('invalid input');
				});

			if (collected.first().content === '1') {
				settings.endCustom = false;
				askTime.setDescription('Enter the day of the month you would want to terminate the poll.');
				const askEndDayEmbed = await message.channel.send(askTime);
				collected = await askEndDayEmbed.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 200000
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('invalid input');
					});
				settings.endTimeDay = parseInt(collected.first().content, 10);
				askTime.setDescription('Enter the hour of the day you would want to terminate the poll.');
				const askEndHourEmbed = await message.channel.send(askTime);
				collected = await askEndHourEmbed.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 200000
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('invalid input');
					});
				settings.endTimeHour = parseInt(collected.first().content, 10);
				askTime.setDescription('Enter the minute of the hour you would want to terminate the poll.');
				const askEndMinuteEmbed = await message.channel.send(askTime);
				collected = await askEndMinuteEmbed.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 200000
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('invalid input');
					});
				settings.endTimeMinute = parseInt(collected.first().content, 10);
			}
			askTime.setDescription(
				'If you want people to cast multiple votes, reply with a `yes` else reply with a `no`'
			);
			const askMultipleEmbed = await message.channel.send(askTime);
			collected = await askMultipleEmbed.channel
				.awaitMessages(msgFilter, {
					max: 1,
					time: 200000
				})
				.catch(err => {
					console.log(err);
					return message.channel.send('invalid input');
				});
			settings.multiple = collected.first().content === 'yes' ? true : false;
			settings.isPoll = true;
		}
		askTime.setDescription('In which channel do you want to initiate the reactor ?');
		const askChannelEmbed = await message.channel.send(askTime);
		const collected = await askChannelEmbed.channel
			.awaitMessages(msgFilter, {
				max: 1,
				time: 200000
			})
			.catch(err => {
				console.log(err);
				return message.channel.send('invalid input');
			});

		const allReactors = await autor
			.find()
			.catch(_err => message.channel.send('No saved reactors found. Please create a reactor using `$reactor`'));
		for (const item of allReactors) {
			if (item.isPoll) continue;
			if (!item.reactorSettings) continue;
			if (item.reactorSettings.channel === collected.first().mentions.channels.first().id) {
				return message.channel.send(
					'You already have a reactor set for that channel. Please try again and choose a different channel.'
				);
			}
		}
		settings.channel = collected.first().mentions.channels.first();
		const confirmationEmbed = new MessageEmbed();
		confirmationEmbed.setColor('#BFFF00');
		confirmationEmbed.setDescription('✅ Your reactor is scheduled !');
		message.channel.send(confirmationEmbed);
		if (!foundDoc.isPoll) {
			settings.count = 0;
			/* eslint-disable require-atomic-updates */
			foundDoc.isRunning = true;
			foundDoc.reactorSettings = settings;
			foundDoc.markModified('reactorSettings');
			foundDoc.markModified('isRunning');
			return foundDoc.save().catch(console.log);
		}
		if (foundDoc.isPoll) {
			if (foundDoc.alreadyRan) {
				foundDoc.totalVotes = 0;
				foundDoc.optionsText.forEach(item => {
					item.votes = 0;
					item.voterid = [];
					item.voterNames = [];
					item.percent = 0;
				});
			}
			const pollEmbed = new MessageEmbed()
				.setTitle(`📊 ${foundDoc.pollTopic}`)
				.setColor(foundDoc.pollColor)
				.setImage(foundDoc.pollImage);
			let i = 0;
			let optionString = '';
			const progressBarHere = foundDoc.anon ? '' : progressBar(0, 100, 10);
			for (const field of foundDoc.optionsText) {
				optionString += `\n ${letters[i++]} **${field.text}** \n ${progressBarHere}`;
			}
			pollEmbed.setDescription(`${optionString}\n 📩 Total Votes: 0`);
			const runPoll = async () => {
				const pollEmbedMessage = await settings.channel.send(pollEmbed);
				settings.messageId = pollEmbedMessage.id;
				// eslint-disable-next-line guard-for-in
				for (const numberOfFields in foundDoc.optionsText) {
					await pollEmbedMessage.react(letters[numberOfFields]);
				}
				settings.url = pollEmbedMessage.url;
			};
			foundDoc.reactorSettings = settings;
			foundDoc.grandTotal = [];
			foundDoc.alreadyRan = true;
			foundDoc.markModified('optionsText');
			foundDoc.markModified('reactorSettings');
			foundDoc.markModified('grandTotal');
			if (settings.startTime === 0) {
				foundDoc.isRunning = true;
				await runPoll();
			} else {
				foundDoc.isRunning = false;
			}
			foundDoc.markModified('isRunning');
			await foundDoc.save().catch(console.log);
			schedule.scheduleJob(
				`${settings.startTimeMinute} ${settings.startTimeHour} ${settings.startTimeDay} * *`,
				async () => {
					foundDoc.isRunning = true;
					await runPoll();
					foundDoc.markModified('reactorSettings');
					foundDoc.markModified('isRunning');
					await foundDoc.save().catch(console.log);
				}
			);

			return schedule.scheduleJob(
				`${settings.endTimeMinute} ${settings.endTimeHour} ${settings.endTimeDay} * *`,
				async () => {
					const updatedDoc = await autor.findOne({ id }).catch(() => {
						message.channel.send('No saved reactors found. Please create a reactor using `$reactor`');
					});
					const fetchedChannel = await this.client.channels
						.fetch(updatedDoc.reactorSettings.channel)
						.catch(console.log);

					const fetchedMessage = await fetchedChannel.messages
						.fetch(updatedDoc.reactorSettings.messageId)
						.catch(console.log);
					const embedObject = fetchedMessage.embeds[0];
					updatedDoc.isRunning = false;
					for (i = 0; i < updatedDoc.optionsText.length; i++) {
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
			);
		}
		return undefined;
	}
}

module.exports = RunReactorCommand;
