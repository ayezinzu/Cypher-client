/*
 * This function is used to send a message embed that contains the recorded text Object.
 * It shows the whole message on reaction with the note.
 */
const Discord = require('discord.js');

module.exports = async (message, textRecordObject, record) => {
	const textRecordMessage = new Discord.MessageEmbed().setTitle('Here is your recorded text.');
	console.log(textRecordObject);
	const smallPart = textRecordObject.text.slice(0, 40);
	let contentString =
		`\`\`\`Channel\`\`\` : ${textRecordObject.channel} \n` +
		`>\`\`\`Content\`\`\` : ${smallPart} [..read more](${textRecordObject.link})`;

	const textRecordMsgFunction = (textRecordMessage, contentString) => {
		textRecordMessage.setColor('#00FFFF');
		textRecordMessage.setThumbnail(
			'https://cdn.discordapp.com/attachments/748005515992498297/756111184226418738/pen.jpg?width=50&height=50'
		);
		textRecordMessage.setFooter('React with 🗒️ to read the whole verse.');
		textRecordMessage.addField(
			`📌 ${textRecordObject.title}`,
			` > \`\`Date\`\` : ${textRecordObject.date} \n > ${contentString}`
		);
		return textRecordMessage;
	};
	const reviewText = await message.author.send(textRecordMsgFunction(textRecordMessage, contentString));

	await reviewText.react('🗒️');
	await reviewText.react('🗑️');
	const filter = reaction => ['🗒️', '🗑️'].includes(reaction.emoji.name);
	const reviewReacts = await reviewText.awaitReactions(filter, {
		max: 3,
		time: 60000,
		errors: ['time']
	});

	if (reviewReacts.first().emoji.name === '🗒️') {
		const editedTextRecordMessage = new Discord.MessageEmbed().setTitle('Here is your recorded text.');
		contentString =
			`\`\`\`Channel\`\`\` : ${textRecordObject.channel} \n` +
			`> \`\`\`Content\`\`\` : \n ${textRecordObject.text}`;
		await reviewText.edit(textRecordMsgFunction(editedTextRecordMessage, contentString));
	} else if (reviewReacts.first().emoji.name === '🗑️') {
		record.content.splice(record.content.indexOf(textRecordObject), 1);
		record.markModified('content');
		await record
			.save()
			.then(doc => {
				console.log(doc);
				return message.author.send('`This verse was successfully deleted.`');
			})
			.catch(err => {
				console.log(err);
			});
	}
};
