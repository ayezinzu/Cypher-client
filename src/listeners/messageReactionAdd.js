/* eslint-disable require-atomic-updates */
const { Listener } = require('discord-akairo');
const { MessageEmbed, MessageReaction, User } = require('discord.js');
const autor = require('../models/autoReactor');
const reactorProfile = require('../models/reactorProfile');
const personalProfile = require('../models/personalProfile');
const progressBar = require('../util/progressBar');

class MessageReactionAddListener extends Listener {
	constructor() {
		super('messageReactionAdd', {
			emitter: 'client',
			event: 'messageReactionAdd'
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

		let selectedProfile = undefined;
		let totalGems = undefined;
		let autoReactorTotalCount = 0;
		let foundElementVotes = undefined;
		let totalVotes = undefined;
		let numberOfVotes = 0;
		let fetchedChannel = undefined;
		let fetchedMessage = undefined;
		let foundUser = undefined;
		let statsEmbed = undefined;
		let statReactionData = [];
		let ref = undefined;
		let mainString = '';
		let cypherStarsString = '';
		let theReactor = undefined;

		const roleObject = {
			oneRoleArray: ['@everyone'],
			twoRoleArray: ['Crowd', 'Prospect', 'Fan'],
			threeRoleArray: ['Enthusiast', 'Challenge', 'Regular'],
			fourRoleArray: ['Active', 'Pro', 'Vet', 'Titan', 'Legend'],
			fiveRoleArray: ['Supporter']
		};

		const checkAccess = async (user, theReactor) => {
			if (!theReactor.poll) return true;
			if (theReactor.pollRole === 'oneRoleArray') {
				return true;
			}
			const fetchedGuild = await this.client.guilds.fetch('723940968843444264');
			const guildMember = await fetchedGuild.members.fetch(user);
			const roleName = guildMember.roles.highest.name;
			console.log(theReactor.pollRole, 'poll role.');
			if (roleObject[theReactor.pollRole].includes(roleName)) {
				return true;
			}
			return false;
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

		const autoReactorEndLog = (mainString, cypherStarsString) => {
			const statReactionData = [];
			for (const data of selectedProfile.emojiData) {
				statReactionData.push(`\n \`\`Emoji\`\` : ${data.emojiName} \n \`\`Votes\`\` : ${data.count} \n`);
			}
			statReactionData.push(cypherStarsString);
			const statsEmbed = new MessageEmbed().setTitle('Stats Report');
			ref = `http://discordapp.com/channels/723940968843444264/${theReactor.reactorSettings.channel}/${selectedProfile.id}`;
			statReactionData.push(`\n [click here to view the message](${ref})`);
			mainString += statReactionData;
			statsEmbed.addField('Report : ', mainString);
			statsEmbed.setColor('#9400D3');
			statsEmbed.setThumbnail(
				'https://cdn.discordapp.com/attachments/728671530459856896/729851605104590878/chart.png'
			);
			this.client.channels.fetch('730608533112094781').then(channel => channel.send(statsEmbed));
		};

		const foundReactor = await autor.find();

		for (theReactor of foundReactor) {
			if (!theReactor.isRunning) continue;
			if (!theReactor.isPoll) {
				if (reaction.message.channel.id !== theReactor.reactorSettings.channel) continue;
				selectedProfile = await reactorProfile
					.findOne({
						messageid: reaction.message.id
					})
					.catch(console.log);
				if (!selectedProfile.stillRunning) return undefined;

				const newPerson = await personalProfile
					.findOne({
						userid: reaction.message.author.id
					})
					.catch(err => {
						console.log(err);
					});

				const foundEmojiData = selectedProfile.emojiData.find(item => item.emojiName === reaction.emoji.name);
				const personEmojiData = newPerson.emojiData.find(item => item.emojiName === reaction.emoji.name);
				console.log(personEmojiData, 'person emoji data');
				if (foundEmojiData) {
					foundEmojiData.count += await votesToAdd(user);
					personEmojiData.count += await votesToAdd(user);
					selectedProfile.totalVotes += 1;
					// 1 gem = 5 count
					newPerson.gems = '💎'.repeat(Math.floor(personEmojiData.count / 5));
					totalGems = '💎'.repeat(Math.floor(foundEmojiData.count / 5));
				}
				console.log(newPerson, 'new person');
				for (const dataItem of selectedProfile.emojiData) {
					autoReactorTotalCount += dataItem.count;
				}
				console.log('hey man');
				newPerson.markModified('emojiData');
				await newPerson.save().catch(err => console.log(err));
				selectedProfile.markModified('emojiData');
				await selectedProfile.save().catch(err => console.log(err));
				if (selectedProfile.totalVotes === theReactor.statsReactionNumber) {
					mainString =
						`Reactor id: \`${theReactor.id}\` \n` +
						`Stats report - Triggered at ${theReactor.statsReactionNumber} Reactions\n` +
						`${statReactionData} \n Gems : \n ${totalGems}`;
					cypherStarsString = '';
					autoReactorEndLog(mainString, cypherStarsString);
				}
				if (
					theReactor.endReactionEmoji === reaction.emoji.name ||
					theReactor.endReactionNumber === selectedProfile.totalVotes
				) {
					let dueToString = `reaction of ${theReactor.endReactionEmoji}`;
					if (theReactor.endReactionNumber === selectedProfile.totalVotes) {
						dueToString = `reaching the set threshold of ${theReactor.endReactionNumber} emojis.`;
					}
					mainString =
						`Reactor id: \`${theReactor.id}\` \n ` +
						`Stats report - Triggered due to ${dueToString} \n \n \`Gems\` : ${totalGems}\n`;
					cypherStarsString = '';
					autoReactorEndLog(mainString, cypherStarsString);
					selectedProfile.stillRunning = false;
					return selectedProfile.save();
				}
			}
			fetchedChannel = await this.client.channels.fetch(theReactor.reactorSettings.channel).catch(err => {
				console.log(err);
			});
			if (fetchedChannel) {
				// eslint-disable-next-line max-len
				fetchedMessage = await fetchedChannel.messages.fetch(theReactor.reactorSettings.messageId).catch(err => {
					console.log(err);
				});
			}

			// eslint-disable-next-line no-extra-parens
			if (!(await checkAccess(user, theReactor))) {
				user.send("🔒 You don't have access to vote on this poll.");
				return fetchedMessage.reactions.cache
					.find(r => r.emoji.name === reaction.emoji.name)
					.users.remove(user.id);
			}

			if (reaction.message.id === theReactor.reactorSettings.messageId) {
				console.log('we got the reaction');

				console.log(
					reaction.message.guild.members.cache.get(user.id).roles.cache.has('729502305464090697'),
					'ROLE HERE'
				);

				if (theReactor.grandTotal.includes(user.id)) {
					if (theReactor.anon && !theReactor.reactorSettings.multiple) {
						const foundRemovedElement = theReactor.optionsText.find(item => item.voterid.includes(user.id));
						foundRemovedElement.voterid = foundRemovedElement.voterid.filter(item => item !== user.id);

						foundUser = this.client.users.cache.find(item => item.id === user.id);
						foundRemovedElement.voterNames = foundRemovedElement.voterNames.filter(
							item => item !== foundUser.username
						);
						foundRemovedElement.votes -= await votesToAdd(user);
						theReactor.totalVotes -= 1;
						theReactor.grandTotal = theReactor.grandTotal.filter(item => item !== user.id);
						// eslint-disable-next-line max-depth
						if (theReactor.grandTotal.length === 0 || foundRemovedElement.votes === 0) {
							foundRemovedElement.percent = 0;
						} else {
							foundRemovedElement.percent =
								(foundRemovedElement.votes * 100) / theReactor.grandTotal.length;
						}
					} else if (!theReactor.reactorSettings.multiple) {
						return fetchedMessage.reactions.cache
							.find(r => r.emoji.name === reaction.emoji.name)
							.users.remove(user.id);
					}
				}

				totalVotes = () => {
					numberOfVotes = 0;
					for (const elements of theReactor.optionsText) {
						numberOfVotes += elements.votes;
					}

					return numberOfVotes;
				};
				if (theReactor.reactorSettings.isPoll) {
					foundElementVotes = theReactor.optionsText.find(item => item.emoji === reaction.emoji.name);
					console.log('got em', foundElementVotes);

					if (
						foundElementVotes.voterid.includes(user.id) &&
						theReactor.anon &&
						theReactor.reactorSettings.multiple
					) {
						fetchedMessage.reactions.cache
							.find(r => r.emoji.name === reaction.emoji.name)
							.users.remove(user.id);
						return this.client.users.cache
							.find(item => item.id === user.id)
							.send('``You can only vote once on that option !``');
					}
					foundElementVotes.votes += await votesToAdd(user);
					theReactor.totalVotes += 1;
					// }

					foundElementVotes.voterid.push(user.id);
					foundElementVotes.voterid.forEach((value, index) => {
						foundUser = this.client.users.cache.find(user => user.id === value);
						foundElementVotes.voterNames.push(foundUser.username);
					});
					for (const eachElement of theReactor.optionsText) {
						eachElement.percent = (eachElement.votes * 100) / totalVotes();
						console.log(eachElement.weights, 'weight here');
						console.log(totalVotes(), 'votes here');
					}
					if (!theReactor.grandTotal.includes(user.id) || theReactor.reactorSettings.multiple) {
						theReactor.grandTotal.push(user.id);
					}
					console.log(theReactor.reactorSettings.channel, 'channel id');

					const embedObject = fetchedMessage.embeds[0];
					if (theReactor.anon) {
						fetchedMessage.reactions.cache
							.find(r => r.emoji.name === reaction.emoji.name)
							.users.remove(user.id);
					}
					for (let i = 0; i < theReactor.optionsText.length; i++) {
						delete embedObject.fields[i];
					}
					let k = 0;
					let optionString = '';
					const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮'];
					let editedProgressBar = undefined;
					for (const foo of theReactor.optionsText) {
						editedProgressBar = theReactor.anon ? '' : progressBar(foo.percent, 100, 10);
						optionString += `\n ${letters[k++]} **${foo.text}** \n ${editedProgressBar}`;
					}
					embedObject.setDescription(`${optionString}\n 📩 Total Votes : ${theReactor.totalVotes}`);
					fetchedMessage.edit(embedObject);

					if (theReactor.grandTotal.length === theReactor.statsReactionNumber) {
						statReactionData = [];
						for (const data of theReactor.optionsText) {
							statReactionData.push(
								// prettier-ignore
								`\n\`Emoji\` : ${data.emoji} \n` +
								`\`Votes\` : ${data.votes} \n` +
								`\`Voter Names\` : ${data.voterNames}\n` +
								`\`Percent\` : ${data.percent} \n ----`
							);
							statsEmbed = new MessageEmbed().setTitle('Stats Report');
						}
						ref = `'http://discordapp.com/channels/723940968843444264/'${theReactor.reactorSettings.channel}/${fetchedMessage.id}`;
						statReactionData.push(`\n [to view the message](${ref})`);
						statsEmbed.addField(
							// prettier-ignore
							`Reactor id: \`${theReactor.id}\`` +
							`\n Stats report - Triggered at ${theReactor.statsReactionNumber} Reactions`,
							`\n ${statReactionData}`
						);
						statsEmbed.setColor('#9400D3');
						statsEmbed.setThumbnail(
							'https://cdn.discordapp.com/attachments/728671530459856896/729851605104590878/chart.png'
						);
						this.client.channels.fetch('730608533112094781').then(channel => {
							channel.send(statsEmbed);
						});
					}
				}
				theReactor.markModified('optionsText');
				return theReactor
					.save()
					.then(() => console.log('save completed !'))
					.catch(err => console.log(err));
			}
		}

		return undefined;
	}
}

module.exports = MessageReactionAddListener;
