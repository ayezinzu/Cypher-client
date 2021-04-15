/* eslint-disable init-declarations */
/* eslint-disable no-undef */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable prefer-const */
const { Command } = require('discord-akairo');
const TimerData = require('../models/timerData');
const { Message, MessageEmbed } = require('discord.js');
const schedule = require('node-schedule');
let running = 0;
let runningTimers = [];
class TimerCommand extends Command {
	constructor() {
		super('timer', {
			aliases: ['timer'],
			args: [
				{
					id: 'amount',
					type: 'number',
					default: 5
				},
				{
					id: 'unit',
					type: ['min', 'sec'],
					prompt: {
						start: 'Select a unit i.e min or sec.',
						retry: 'Select a correct unit i.e min or sec.'
					},
					default: 'sec'
				}
			],
			category: 'general',
			description: {
				content: 'set a timer',
				usage: 'timer [amount]'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ amount: Amount }} args -  The args object.
	 * @param {{ unit: Unit }} args -  The args object.
	 */
	async exec(message, { amount, unit }) {
		let newTimer;
		let foundTimer;
		let timerid = Math.random().toString(20).substr(2, 6);
		let timeLeftString;
		let finalTimeString;
		let color;
		let timeMsg;
		let savedTimer;
		// eslint-disable-next-line init-declarations
		let myInterval;
		// eslint-disable-next-line init-declarations
		let rawTimeLeft;
		// eslint-disable-next-line init-declarations
		let newTimeEmbed;
		let makeTimeEmbed = (stringOfTimeLeft, embedColor) => {
			console.log(embedColor, 'embedcolor here');
			newTimeEmbed = new MessageEmbed()
				.setTitle('🔹 ThaCypher Timer')
				.setColor(embedColor)
				.setThumbnail(
					'https://media.discordapp.net/attachments/723940968843444268/811311021343899689/stopwatch.png'
				)
				.setFooter('A simple stop watch.')
				.addField('status', stringOfTimeLeft);

			return newTimeEmbed;
		};
		console.log(unit, 'unit here');
		const timeInMs = unit === 'min' ? amount * 60000 : amount * 1000;
		let calculateTimeleft = (inputAmount, lastMinute) => {
			if (lastMinute) {
				console.log('last min');
				timeLeftString = `time left - less than \n **${Math.floor(
					inputAmount / 1000
				)}** \n second(s)`;
			} else {
				// eslint-disable-next-line max-len
				timeLeftString =
          unit === 'min'
          	? `Time left - \n
			  **${Math.floor(inputAmount / 60000)}** \n minute(s)`
          	: `time left - \n **${Math.floor(
          		inputAmount / 1000
          	)}** \n second(s)`;
			}
			console.log(inputAmount, 'input amount');
			console.log(timeLeftString, 'time left string');
			return timeLeftString;
		};
		if (running === 2) {
			return message.channel.send(
				'Maximum amount of timers are running. Please try again later.'
			);
		}
		running++;
		if (running === 1) {
			color = '#FFCCCB';
		} else {
			color = '#DC143C';
		}
		newTimer = new TimerData();
		newTimer.timerid = timerid;
		newTimer.color = color;
		savedTimer = await newTimer.save();
		console.log(savedTimer, 'data');
		foundTimer = await TimerData.findOne({ timerid });
		console.log(foundTimer, 'new timer here');
		timeMsg = await message.channel.send(
			makeTimeEmbed(
				`Timer for \n *${amount} ${unit}(s)* \n initiated by ${message.author.username}.`,
				foundTimer.color
			)
		);

		// function for countdown
		const getTimeout = (() => {
			const t = setTimeout;
			const e = {};
			return (
			// eslint-disable-next-line no-global-assign
				setTimeout = (a, o) => {
					const u = t(a, o);
					// eslint-disable-next-line no-sequences
					return e[u] = Date.now() + o, u;
				},
				t => e[t] ? Math.max(e[t] - Date.now(), 0) : NaN
			);
		})();

		const redirectTimeout = setTimeout(async () => {
			foundTimer = await TimerData.findOne({ timerid });
			timeMsg
				.delete()
				.then(() => {
					console.log('message deleted');
				})
				.catch(err => {
					console.log(err);
				});
			clearInterval(myInterval);
			message.channel.send(makeTimeEmbed('Time up!', foundTimer.color));
			running--;
		}, timeInMs);

		myInterval = setInterval(async () => {
			rawTimeLeft = Math.floor(getTimeout(redirectTimeout));
			console.log(rawTimeLeft);
			if (rawTimeLeft < 60000) {
				console.log('less than 60k');
				finalTimeString = calculateTimeleft(rawTimeLeft, true);
				timeMsg.edit(
					makeTimeEmbed(
						finalTimeString,
						(await TimerData.findOne({ timerid })).color
					)
				);
			} else {
				console.log('more than 60k');
				finalTimeString = calculateTimeleft(rawTimeLeft, false);
				timeMsg.edit(
					makeTimeEmbed(
						finalTimeString,
						(await TimerData.findOne({ timerid })).color
					)
				);
			}
		}, 10000);
	}
}

module.exports = TimerCommand;
