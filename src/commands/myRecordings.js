const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const pagination = require('discord-paginationembed');
const userRecords = require('../models/userRecords');

class MyRecordingsCommand extends Command {
	constructor() {
		super('my-recordings', {
			aliases: ['my-recordings'],
			category: 'general',
			description: {
				content: 'Get the list of your recordings.',
				usage: '[No Arguments]'
			},
			channel: 'guild'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	async exec(message) {
		const record = await userRecords.findOne({ userid: message.author.id });
		const recordings = [];
		record.content.forEach((obj, i) => {
			recordings.push(
				`\`${i + 1}\` 📌 ${obj.note}\n` +
					`> \`\`\`Date:\`\`\` ${obj.date}\n` +
					`> \`\`\`Personal:\`\`\` [Click here to download it](${obj.personalLink})\n` +
					`> \`\`\`General:\`\`\` [Click here to download it](${obj.generalLink})\n` +
					`> \`\`\`Time:\`\`\` ${obj.time}`
			);
		});

		const fieldsEmbed = new pagination.FieldsEmbed()
			.setArray(recordings)
			.setAuthorizedUsers([message.author.id])
			.setChannel(message.author.dmChannel)
			.setElementsPerPage(3)
			.setPageIndicator(false)
			.formatField('\u200b', el => el);

		fieldsEmbed.embed.setColor('#ff00ae');
		await fieldsEmbed.build();

		const recordsEmbed = new MessageEmbed().setTitle('🗒️ Add notes');
		recordsEmbed.addField(
			'You can add notes to any of these recordings',
			'Reply with the recording number to add a note. You have 30 seconds.'
		);
		recordsEmbed.setThumbnail('https://i.imgur.com/EvIGx9d.png');
		recordsEmbed.setColor('#FFC0CB');
		const recordsMessage = await message.author.send(recordsEmbed);

		const msgFilter = m => m.author.id === message.author.id;
		const collected = await recordsMessage.channel.awaitMessages(msgFilter, {
			max: 1,
			time: 30000
		});
		if (!collected?.first()) return undefined;
		const num = parseInt(collected.first().content, 10);
		if (!Number.isInteger(num)) {
			return message.channel.send('**You can only reply with a recording number. Please try again later.**');
		}
		if (!record.content[num - 1].note) {
			return message.author.send('❌ Oops something went wrong. Note not saved. please try again later !');
		}
		const selectedRecord = record.content[num - 1];
		const noteReader = new MessageEmbed().setTitle(
			'Reply with the note you would want to add, say `cancel` to exit out, or `delete` to delete this recording.'
		);

		noteReader.addField(
			'Your recordings',
			`**Title** : ${selectedRecord.note}\n` +
				`**Date** : ${selectedRecord.date}\n` +
				`**Personal** : [Click here to download it](${selectedRecord.personalLink})\n` +
				`**General** : [Click here to download it](${selectedRecord.generalLink})\n` +
				`**Time spent by you** : ${selectedRecord.time} `
		);

		noteReader.setThumbnail('https://i.imgur.com/4xD6FOm.png');
		noteReader.setColor('#FFC0CB');
		const noteCollection = await message.author.send(noteReader);
		const collectedNote = await noteCollection.channel.awaitMessages(msgFilter, {
			max: 1,
			time: 30000
		});
		const theNote = collectedNote.first().content;

		if (theNote === 'cancel') {
			return message.author.send('Session Cancelled.');
		} else if (theNote === 'delete') {
			record.content.splice(num - 1, 1);
			return record.save().then(() => message.author.send('🇽 Recording deleted successfully.'));
		}
		console.log(theNote, 'note here');
		const addNoteToThisUser = await userRecords.findOne({ userid: message.author.id });

		addNoteToThisUser.content[num - 1].note = theNote;
		addNoteToThisUser.markModified('content');
		return addNoteToThisUser
			.save()
			.then(() => {
				const noteStatus = new MessageEmbed().setTitle('Note');
				noteStatus.addField('Saved', 'Title successfully saved !');
				noteStatus.setColor('#32CD32');
				noteStatus.setThumbnail('https://i.imgur.com/ACh4QGC.png');
				message.author.send(noteStatus);
			})
			.catch(err => {
				message.author.send('❌ Oops something went wrong. Note not saved. please try again later !');
				console.log(err);
			});
	}
}

module.exports = MyRecordingsCommand;
