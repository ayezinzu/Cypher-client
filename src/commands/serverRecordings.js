const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const serverRecords = require('../models/serverRecords');
const pagination = require('discord-paginationembed');

class ServerRecordingsCommand extends Command {
	constructor() {
		super('server-recordings', {
			aliases: ['server-recordings'],
			channel: 'guild',
			description: {
				content: 'Server Recordings...',
				usage: '[No Arguments]'
			},
			category: 'general'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	async exec(message) {
		const foundUser = await serverRecords.findOne({ userid: 'server' });
		const recordingsArray = [];
		foundUser.content.forEach((doc, i) => {
			recordingsArray.push(
				`\`${i + 1}\` 📌 ${doc.note} \n > \`\`Date\`\` : ${
					doc.date
				} \n > \`\`Personal\`\` : [Click here to download it](${
					doc.personalLink
				}) \n > \`\`General\`\` : [Click here to download it](${doc.generalLink}) \n > \`\`Time\`\` : ${
					doc.time
				} \n - \n`
			);
		});
		const FieldsEmbed = new pagination.FieldsEmbed()
			// A must: an array to paginate, can be an array of any type
			.setArray(recordingsArray)
			/*
			 * Set users who can only interact with the instance. Default: `[]` (everyone can interact).
			 * If there is only 1 user, you may omit the Array literal.
			 */
			.setAuthorizedUsers([message.author.id])
			// A must: sets the channel where to send the embed
			.setChannel(message.author.dmChannel)
			// Elements to show per page. Default: 10 elements per page
			.setElementsPerPage(3)
			// Have a page indicator (shown on message content). Default: false
			.setPageIndicator(false)
			// Format based on the array, in this case we're formatting the page based on each object's `word` property
			.formatField('\u200b', el => el);

		FieldsEmbed.embed.setColor(0xff00ae);

		FieldsEmbed.build();

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
			time: 20000
		});
		const theNumber = collected.first().content;
		const theInt = parseInt(theNumber, 10);
		if (Number.isInteger(theInt) === false) {
			message.channel.send('**You can only reply with a recording number. Please try again later.**');
			return;
		}
		if (foundUser.content[theInt - 1].note === undefined) {
			message.author.send('❌ Oops something went wrong. Note not saved. please try again later !');
			return;
		}
		const selectedRecord = foundUser.content[theInt - 1];
		const noteReader = new MessageEmbed().setTitle(
			'Reply with the note you would want to add or say `cancel` to exit out '
		);

		noteReader.addField(
			'Your recordings',
			// prettier-ignore
			`**Title** : ${selectedRecord.note} \n` +
			`**Date** : ${selectedRecord.date} \n` +
			`**General** : [Click here to download it](${selectedRecord.generalLink}) \n` +
			`**Time spent by you** : ${selectedRecord.time}`
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
			message.author.send('Session Cancelled.');
			return;
		}
		const addNoteToThisUser = await serverRecords.findOne({ userid: 'server' });

		addNoteToThisUser.content[theNumber - 1].note = theNote;
		addNoteToThisUser.markModified('content');
		addNoteToThisUser
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

module.exports = ServerRecordingsCommand;
