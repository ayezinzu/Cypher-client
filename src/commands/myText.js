const { Command } = require('discord-akairo');
const { Message, User, MessageEmbed } = require('discord.js');
const pagination = require('discord-paginationembed');
const textRecords = require('../models/textRecords');
const recordMsgAfterConfirmation = require('../util/recordMsgAfterConfirmation');

class MyTextCommand extends Command {
	constructor() {
		super('my-text', {
			aliases: ['my-text', 'text-recording'],
			args: [
				{
					id: 'user',
					type: 'user',
					default: message => message.author
				},
				{
					id: 'type',
					type: ['title', 'day', 'month']
				},
				{
					id: 'rest',
					match: 'rest'
				}
			],

			category: 'general',
			description: {
				content: 'My Text Command',
				usage: 'Describe usage here...'
			}
		});
	}

	/**
	 *
	 * @param {Message} message - The message object.
	 * @param {{ user: User; type: 'title' | 'day' | 'month'; rest: string; }} args - The args object.
	 */
	async exec(message, { user, type, rest }) {
		const record = await textRecords.findOne({ userid: user.id });
		if (!record) return message.channel.send('An error occurred. Please try again later.');
		const records = [];
		let finalContent = undefined;
		if (type === 'title') {
			finalContent = record.content.filter(e => e.title.includes(rest));
		} else if (type === 'day') {
			finalContent = record.content.filter(e => e.date.slice(8, 10).includes(rest));
		} else if (type === 'month') {
			finalContent = record.content.filter(e => e.date.slice(5, 10).includes(rest));
		} else {
			finalContent = record.content;
		}

		if (!finalContent?.length) return message.channel.send('Something went wrong! Please try again later.');
		finalContent.forEach((rec, i) => {
			records.push(
				// prettier-ignore
				`**${i + 1}.** 📌 ${rec.title}\n` +
				`> \`\`\`Date:\`\`\` ${rec.date}\n` +
				`> \`\`\`Channel:\`\`\`${rec.channel}\n` +
				`> \`\`\`Content:\`\`\` ${rec.text.slice(0, 20)}... [Read more](${rec.link})\n`
			);
		});

		const FieldsEmbed = new pagination.FieldsEmbed()
			.setArray(records)
			.setAuthorizedUsers([message.author.id])
			.setChannel(message.author)
			.setElementsPerPage(3)
			.setPageIndicator(false)
			.formatField('\u200b', e => e);

		FieldsEmbed.embed
			.setTitle('📒 - __Text records__')
			.setColor(0xff00ae)
			.setThumbnail('https://media.discordapp.net/attachments/748005515992498297/756198492468281404/edit.png')
			.setFooter('Reply with the text record number to view the full verse.');

		FieldsEmbed.build();

		const recMessage = new MessageEmbed();
		recMessage.setDescription('Reply with the record number to view full verse. Reply with `delete` ');
		recMessage.setColor('#FF00AE');
		const textRecordNumber = await message.author.send(recMessage);
		const textRecordNumberCollector = await textRecordNumber.channel.awaitMessages(
			m => m.author.id === message.author.id,
			{
				max: 1,
				time: 300000
			}
		);
		const num = textRecordNumberCollector.first().content;
		return recordMsgAfterConfirmation(message, record.content[num - 1], record);
	}
}

module.exports = MyTextCommand;
