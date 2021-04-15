/* eslint-disable eqeqeq */
const { Listener } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const Autor = require('../models/autoReactor');
const PersonalProfile = require('../models/personalProfile');
const ReactorProfile = require('../models/reactorProfile');
const setText = require('../models/setText');
const textRecords = require('../models/textRecords');
const recordMsgAfterConfirmation = require('../util/recordMsgAfterConfirmation');

class MessageListener extends Listener {
	constructor() {
		super('message', {
			emitter: 'client',
			event: 'message'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	async exec(message) {
		if (!message.guild) return undefined;

		const foundReactor = await Autor.find();
		for (const reactor of foundReactor) {
			if (!reactor.isRunning || reactor.isPoll) continue;
			if (message.channel.id === reactor.reactorSettings.channel) {
				const selectedProfile = new ReactorProfile();
				const exists = await PersonalProfile.exists({
					userid: message.author.id
				});
				let personProfile = undefined;
				if (exists) {
					personProfile = await PersonalProfile.findOne({
						userid: message.author.id
					});
				} else {
					console.log('person profile not found');
					personProfile = new PersonalProfile();
					personProfile.userid = message.author.id;
				}
				selectedProfile.userid = message.author.id;
				selectedProfile.messageid = message.id;
				selectedProfile.stillRunning = true;
				selectedProfile.totalVotes = 0;
				for (const emoji of reactor.emojis) {
					message.react(emoji);
					if (
						!personProfile.emojiData.some(item => item.emojiName === emoji)
					) {
						personProfile.emojiData.push({
							emojiName: emoji,
							count: 0
						});
					}
					selectedProfile.emojiData.push({
						emojiName: emoji,
						count: 0
					});
				}
				selectedProfile.markModified('emojiData');
				selectedProfile.save().catch(err => console.log(err));

				personProfile.markModified('emojiData');
				personProfile.save().catch(err => console.log(err));
			}
		}

		const guild = await setText.findOne({ guildid: message.guild.id });
		if (!guild?.channels?.includes(message.channel?.id)) return undefined;
		if (message.content.split('\n').length < 4) return undefined;

		const date =
      `${new Date().getFullYear()}-` +
      `${`${new Date().getMonth() + 1}`.padStart(2, '0')}-` +
      `${`${new Date().getDate()}`.padStart(2, '0')}`;

		const textRecordConfirmation = async () => {
			const msgFilter = m => {
				const title = m.content.replace(/\s/g, '');
				if (m.author.id !== message.author.id) return false;
				if (title.length > 25) {
					message.author.send(
						'The title is longer than 25 characters, please try again.'
					);
					return false;
				}
				return true;
			};
			const textRecordTitle = new MessageEmbed().setTitle(
				'🎐 Lets give your masterpiece a title.'
			);
			textRecordTitle.setDescription(
				'Please reply to this message with a title no more than 25 characters. You have 30 seconds.'
			);
			textRecordTitle.setThumbnail(
				'https://media.discordapp.net/attachments/748005515992498297/756094502535692338/title.png?width=100&height=100'
			);
			textRecordTitle.setFooter(
				// eslint-disable-next-line max-len
				`🔺 If you fail to reply with a title, it will be set to ${date} by default. Reply with \`\`delete\`\` if you do not wish to save this`
			);
			textRecordTitle.setColor('#00FFFF');
			const textRecordTitleMessage = await message.author.send(textRecordTitle);
			const textRecordTitleMessageCollector = await textRecordTitleMessage.channel.awaitMessages(
				msgFilter,
				{
					max: 1,
					time: 30000
				}
			);

			return textRecordTitleMessageCollector.first()
				? textRecordTitleMessageCollector.first().content
				: date;
		};

		if (await textRecords.exists({ userid: message.author.id })) {
			const record = await textRecords.findOne({ userid: message.author.id });
			const title = await textRecordConfirmation();
			if (title == 'delete') {
				return message.author.send('recording deleted');
			}
			const obj = {
				date,
				title,
				channel: message.channel.name,
				text: message.content,
				link: message.url
			};
			record.content.push(obj);
			return record
				.save()
				.then(() => recordMsgAfterConfirmation(message, obj))
				.catch(console.log);
		}

		const record = new textRecords();
		const title = await textRecordConfirmation();
		if (title == 'delete') {
			return message.author.send('recording deleted');
		}
		const obj = {
			date,
			title,
			channel: message.channel.name,
			text: message.content,
			link: message.url,
			userid: message.author.id
		};
		record.content.push(obj);
		return record
			.save()
			.then(() => recordMsgAfterConfirmation(message, date))
			.catch(console.log);
	}
}

module.exports = MessageListener;
