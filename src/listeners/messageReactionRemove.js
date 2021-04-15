/* eslint-disable require-atomic-updates */
const { Listener } = require('discord-akairo');
const { MessageReaction, User } = require('discord.js');
const autor = require('../models/autoReactor');
const personalProfile = require('../models/personalProfile');
const reactorProfile = require('../models/reactorProfile');
const progressBar = require('../util/progressBar');

class MessageReactionRemoveListener extends Listener {
	constructor() {
		super('messageReactionRemove', {
			emitter: 'client',
			event: 'messageReactionRemove'
		});
	}

	/**
	 * @param {MessageReaction} reaction - The reaction.
	 * @param {User} user - The user.
	 */
	async exec(reaction, user) {
		if (user.bot) return undefined;
		if (reaction.partial) await reaction.fetch();
		if (reaction.message.partial) await reaction.message.fetch();

		const roleObject = {
			oneRoleArray: ['@everyone'],
			twoRoleArray: ['Crowd', 'Prospect', 'Fan'],
			threeRoleArray: ['Enthusiast', 'Challenge', 'Regular'],
			fourRoleArray: ['Active', 'Pro', 'Vet', 'Titan', 'Legend'],
			fiveRoleArray: ['Supporter']
		};

		const votesToAdd = async user => {
			const fetchedGuild = await this.client.guilds.fetch('723940968843444264');
			const guildMember = await fetchedGuild.members.fetch(user);
			const roleName = guildMember.roles.highest.name;

			if (roleObject.oneRoleArray.includes(roleName)) {
				return 1;
			} else if (roleObject.twoRoleArray.includes(roleName)) {
				return 2;
			} else if (roleObject.threeRoleArray.includes(roleName)) {
				return 3;
			} else if (roleObject.fourRoleArray.includes(roleName)) {
				return 4;
			} else if (roleObject.fiveRoleArray.includes(roleName)) {
				return 5;
			}
			return 1;
		};

		const foundReactor = await autor.find();
		for (const theReactor of foundReactor) {
			if (!theReactor.isRunning) continue;
			if (!theReactor.isPoll) {
				if (reaction.message.channel.id === theReactor.reactorSettings.channel) {
					const selectedProfile = await reactorProfile
						.findOne({
							messageid: reaction.message.id
						})
						.catch(console.log);
					const newPerson = await personalProfile
						.findOne({
							userid: reaction.message.author.id
						})
						.catch(err => {
							console.log(err);
						});

					if (!selectedProfile.stillRunning) return undefined;
					const foundEmojiData = selectedProfile.emojiData.find(
						item => item.emojiName === reaction.emoji.name
					);
					const personEmojiData = newPerson.emojiData.find(item => item.emojiName === reaction.emoji.name);
					if (foundEmojiData) {
						foundEmojiData.count -= await votesToAdd(user);
						personEmojiData.count -= await votesToAdd(user);
						selectedProfile.totalVotes -= 1;
					}

					selectedProfile.markModified('emojiData');
					selectedProfile
						.save()
						.then(doc => console.log('saved', doc))
						.catch(err => console.log(err));
				}
			}
			if (reaction.message.id === theReactor.reactorSettings.messageId) {
				const fetchedChannel = await this.client.channels
					.fetch(theReactor.reactorSettings.channel)
					.catch(err => {
						console.log(err);
					});

				const fetchedMessage = await fetchedChannel.messages
					.fetch(theReactor.reactorSettings.messageId)
					.catch(err => {
						console.log(err);
					});
				const foundElementVotes = theReactor.optionsText.find(item => item.emoji === reaction.emoji.name);
				if (theReactor.anon) return undefined;
				if (!foundElementVotes.voterid.includes(user.id)) return undefined;
				foundElementVotes.votes -= await votesToAdd(user);
				theReactor.totalVotes -= 1;
				foundElementVotes.voterid.forEach((value, index) => {
					const foundUser = this.client.users.cache.find(user => user.id === value);
					foundElementVotes.voterNames = foundElementVotes.voterNames.filter(
						name => name !== foundUser.username
					);
				});

				foundElementVotes.voterid = foundElementVotes.voterid.filter(voter => voter !== user.id);
				console.log(user.id);
				const totalVotesTwo = () => {
					let numberOfVotes = 0;
					for (const elements of theReactor.optionsText) {
						numberOfVotes += elements.votes;
					}
					return numberOfVotes;
				};

				console.log(totalVotesTwo(), 'total votes here');

				for (const eachElement of theReactor.optionsText) {
					if (totalVotesTwo() === 0) {
						eachElement.percent = 0;
					} else {
						eachElement.percent = (eachElement.votes * 100) / totalVotesTwo();
					}
				}
				if (theReactor.reactorSettings.multiple) {
					const userToRemove = element => element === user.id;
					const userIndex = theReactor.grandTotal.findIndex(userToRemove);
					theReactor.grandTotal.splice(userIndex, 1);
				} else {
					theReactor.grandTotal = theReactor.grandTotal.filter(total => total !== user.id);
				}

				const embedObject = fetchedMessage.embeds[0];
				if (!theReactor.anon) {
					for (let i = 0; i < theReactor.optionsText.length; i++) {
						delete embedObject.fields[i];
					}
					let k = 0;
					let optionString = '';
					const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮'];

					for (const foo of theReactor.optionsText) {
						optionString += `\n ${letters[k++]} **${foo.text}** \n ${progressBar(foo.percent, 100, 10)}`;
					}
					embedObject.setDescription(`${optionString}\n 📩 Total Votes : ${theReactor.totalVotes}`);
					fetchedMessage.edit(embedObject);
				}
				theReactor.markModified('optionsText');
				theReactor.save().catch(err => console.log(err));
			}
		}

		return undefined;
	}
}

module.exports = MessageReactionRemoveListener;
