const { Command } = require('discord-akairo');
const { Message, User } = require('discord.js');
const { profanity } = require('@2toad/profanity');
const guildSettings = require('../models/guildSettings');
const reps = require('../models/reps');
const profile = require('../models/profile');
const msToString = require('../util/msToString');

class RepGiveCommand extends Command {
	constructor() {
		super('rep-give', {
			aliases: ['rep-give', 'give-rep'],
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: 'Whom would you like to give the rep to?',
						retry: 'Please mention a valid user!'
					}
				},
				{
					id: 'review',
					type: (_, phrase) => {
						if (!phrase?.length) return undefined;
						if (phrase.length > 200) return undefined;
						return profanity.censor(phrase);
					},
					match: 'rest',
					prompt: {
						start: 'Please enter a review!',
						retry: 'Please enter a valid review! (Less than 200 chars)'
					}
				}
			],
			category: 'general',
			channel: 'guild',
			description: {
				content: 'Something something',
				usage: '<user> <review>'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ user: User; review: string; }} args - The args object.
	 */
	async exec(message, { user, review }) {
		if (user.id === message.author.id || user.bot) {
			return message.channel.send('You cannot give rep to yourself or a bot!');
		}
		if (!review?.length) return message.channel.send('Empty review!');

		const guildRes = await guildSettings.findOne({
			guildID: message.guild.id
		});
		const repName = guildRes?.repName ?? 'rep';

		const authorRep = await reps.findOne({ userid: message.author.id });
		const userRep = await reps.findOne({ userid: user.id });
		const userProfile = await profile.findOne({ userid: user.id });
		// prettier-ignore
		const repLimit = Date.now() + (24 * 60 * 60 * 1000);

		if (!authorRep) {
			const newRes = new reps({
				userid: message.author.id,
				reps: 0,
				timeLeft: repLimit,
				reviews: []
			});
			newRes.save().catch(console.log);
		} else if (Date.now() < authorRep.timeLeft) {
			return message.channel.send({
				embed: {
					color: '#ff0000',
					title: 'Wait! Hold up!',
					description: `You will be able to ${repName} someone in more:\n ${msToString(
						authorRep.timeLeft - Date.now()
					)}`
				}
			});
		} else {
			authorRep.timeLeft = repLimit;
			authorRep.markModified('timeLeft');
			authorRep.save().catch(console.log);
		}

		if (userRep) {
			userRep.reps += 1;
			userRep.markModified('reps');
			userRep.reviews.push({ from: message.author.id, review });
			userRep.markModified('reviews');
			userRep.save().catch(console.log);
		} else {
			const newRes = new reps({
				userid: user.id,
				reps: 1,
				timeLeft: 0,
				reviews: [{ from: message.author.id, review }]
			});
			newRes.save().catch(console.log);
		}

		if (userProfile) {
			userProfile.coins += 1;
			userProfile.markModified('coins');
			userProfile.save().catch(console.log);
		} else {
			const newProfile = new profile({
				userid: user.id,
				coins: 1,
				bets: 0
			});
			newProfile.save().catch(console.log);
		}

		return message.channel.send(`${user}, you just received a ${repName} from ${message.author}.`);
	}
}

module.exports = RepGiveCommand;
