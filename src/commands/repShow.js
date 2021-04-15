const { Command } = require('discord-akairo');
const { Message, User } = require('discord.js');
const pagination = require('discord-paginationembed');
const guildSettings = require('../models/guildSettings');
const reps = require('../models/reps');

class RepShowCommand extends Command {
	constructor() {
		super('rep-show', {
			aliases: ['rep-show'],
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: 'Whose rep would you like to check?',
						retry: 'Invalid user specified! Please mention a valid user!'
					}
				}
			],
			channel: 'guild',
			category: 'general',
			description: {
				content: 'Show rep of someone.',
				usage: '<user>'
			}
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ user: User }} args - The args object.
	 */
	async exec(message, { user }) {
		const guildRes = await guildSettings.findOne({
			guildID: message.guild.id
		});
		const repName = guildRes?.repName ?? 'rep';
		const userReps = await reps.findOne({ userid: user.id });
		if (!userReps?.reviews?.length) {
			return message.channel.send({
				embed: {
					color: '#ffff00',
					description:
						`${user.id === message.author.id ? `${user}, you don't` : `${user} doesn't`} have` +
						` any ${repName.endsWith('s') ? repName : `${repName}s`} yet!`
				}
			});
		}

		const FieldsEmbed = new pagination.FieldsEmbed()
			.setArray(userReps.reviews)
			.setAuthorizedUsers([message.author.id])
			.setChannel(message.channel)
			.setElementsPerPage(1)
			.setPage(1)
			.setPageIndicator(true)
			.formatField('Reviews', i => {
				/*
				 * Reviews include a "from" key
				 * that holds the id of the submitter
				 * we can search in cache for their tag
				 * if not found, just change it to a mention
				 * (tags are preferred as mentions depend on client's cache and not on cache of the bot)
				 */
				const userReview = this.client.users.cache.get(i.from);
				return `From: ${userReview ? userReview.tag : `<@${i.from}>`}\n\`\`\`${i.review}\`\`\``;
			})
			.setDisabledNavigationEmojis(['delete'])
			.setEmojisFunctionAfterNavigation(false);

		FieldsEmbed.embed
			.setColor('#ffff00')
			.setTitle(
				`${user.id === message.author.id ? 'You have' : `${user} has`} ${userReps.reps} ${
					repName.endsWith('s') ? repName : `${repName}s`
				}`
			);

		return FieldsEmbed.build();
	}
}

module.exports = RepShowCommand;
