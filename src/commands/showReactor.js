const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const autor = require('../models/autoReactor');
const pagination = require('discord-paginationembed');

class ShowReactorCommand extends Command {
	constructor() {
		super('show-reactor', {
			aliases: ['show-reactor'],
			category: 'general',
			description: {
				content: 'Show reactors...',
				usage: 'Args here...'
			},
			args: [
				{
					id: 'id',
					type: 'phrase',
					prompt: {
						start: 'ID of the reactor please?',
						retry: 'What is the ID of the reactor?',
						optional: true
					}
				}
			]
		});
	}

	/**
	 * @param {Message} message - The message object.
	 * @param {{ id: string }} args - The args object.
	 */
	async exec(message, { id }) {
		const paginationEmbed = (title, description, reactorsArray, message) => {
			const FieldsEmbed = new pagination.FieldsEmbed()
				.setArray(reactorsArray)
				.setAuthorizedUsers([message.author.id])
				.setChannel(message.channel)
				.setElementsPerPage(5)
				.setPageIndicator(false)
				.formatField('\u200b', el => el);

			FieldsEmbed.embed.setColor(0xff00ae);
			FieldsEmbed.embed.setTitle(title);
			FieldsEmbed.embed.setDescription(description);
			return FieldsEmbed.build();
		};

		const createAndWait = async messageEmbedObject => {
			const msgFilter = m => m.author.id === message.author.id;
			const messageEmbed = new MessageEmbed().setTitle(messageEmbedObject.title);
			messageEmbed.addField(messageEmbedObject.topic, messageEmbedObject.text);
			messageEmbed.setColor(messageEmbedObject.color);
			messageEmbed.setThumbnail(messageEmbedObject.thumbnail);
			const collectThisMsg = await message.channel.send(messageEmbed);
			if (messageEmbedObject.boolean) {
				const collected = await collectThisMsg.channel
					.awaitMessages(msgFilter, {
						max: 1,
						time: 20000
					})
					.catch(err => {
						console.log(err);
						return message.channel.send('`No input received.`');
					});
				if (messageEmbedObject.image) {
					if (collected.first().attachment === undefined) {
						return undefined;
					}
					return collected.first().attachment.url;
				}
				return collected.first().content;
			}
			for (const emoji of messageEmbedObject.emojiArray) {
				await collectThisMsg.react(emoji);
			}
			const collected = await collectThisMsg.awaitReactions((_, u) => u.id === message.author.id, {
				max: 1,
				time: 20000,
				errors: ['time']
			});
			return collected.first().emoji.name;
		};
		const reactorsArray = [];
		if (!id) {
			const foundDocs = await autor
				.find()
				.catch(() => message.channel.send('No saved reactors found. Please create a reactor using `$reactor`'));
			let reactorType = undefined;
			let status = undefined;
			for (const doc of foundDocs) {
				reactorType = doc.isPoll ? '📊 Poll' : '💈 Auto reactor';
				if (doc.isRunning) {
					status = '🟢 running';
				} else {
					status = '🟣 idle';
				}
				reactorsArray.push(
					`🪧 \`\`id - ${doc.id}\`\` - Reactor type - \`\`${reactorType}\`\` - \`\`${status}\`\` \n`
				);
			}
			const title = 'List of reactors';
			const description = 'To view or edit any reactor, use showreactor `InsertIdHere`';
			paginationEmbed(title, description, reactorsArray, message);
		}

		if (id) {
			const doc = await autor.findOne({ id }).catch(() => {
				message.channel.send(
					// prettier-ignore
					`No reactor found with id ${id}. ` +
					'Please check available reactors with `$showreactor` and try again!'
				);
			});
			const title = `id - \`${doc.id}\``;
			const description = '';
			const i = 1;
			let arrayString = '';
			arrayString = doc.pollTopic === undefined ? '' : `${arrayString}📌 \`pollTopic\` - ${doc.pollTopic}`;
			arrayString =
				doc.pollColor === undefined ? arrayString : `${arrayString}\n♑ \`\`pollColor\` - ${doc.pollColor}`;
			arrayString =
				doc.pollImage === undefined ? arrayString : `${arrayString}\n🖼️ \`pollImage\` - ${doc.pollImage}`;
			for (const item of doc.optionsText) {
				arrayString += `\n ➿ \`option${doc.optionsText.indexOf(item) + 1} - \` - ${item.text} `;
			}
			arrayString = doc.emojis ? `${arrayString}\n🤡 \`emojis\` - ${doc.emojis}` : arrayString;
			arrayString = doc.statsReactionNumber
				? `${arrayString}\n🖼 \`statsReactionNumber\` - ${doc.statsReactionNumber}`
				: arrayString;
			arrayString = doc.endReactionEmoji
				? `${arrayString}\n🧭 \`endReactionEmoji\` - ${doc.endReactionEmoji}`
				: arrayString;
			arrayString = doc.endReactionNumber
				? `${arrayString}\n🗳️ \`endReactionNumber\` - ${doc.endReactionNumber}`
				: arrayString;
			arrayString = doc.endReactionTime
				? `${arrayString}\n⏳ \`endReactionTime\` - ${doc.endReactionTime}`
				: arrayString;

			arrayString = doc.role === undefined ? arrayString : `${arrayString}\n👨‍👦 \`\`role\`\` - ${doc.role}`;
			arrayString = doc.notify === undefined ? arrayString : `${arrayString}\n📩 \`\`notify\`\` - ${doc.notify}`;
			arrayString = doc.pin === undefined ? arrayString : `${arrayString}\n🔁 \`\`pin\`\` - ${doc.pin}`;
			arrayString = doc.rep === undefined ? arrayString : `${arrayString}\n🔁 \`\`rep\`\` - ${doc.rep}`;
			arrayString = doc.repNum === undefined ? arrayString : `${arrayString}\n🎚️ \`\`repNum\`\` - ${doc.repNum}`;
			reactorsArray.push(arrayString);
			paginationEmbed(title, description, reactorsArray, message);
			const userInputEmbed = new MessageEmbed().setDescription(
				'Reply with that property name you would like to change. You have 20 seconds'
			);
			const msgFilter = m => m.author.id === message.author.id;
			const userInput = await message.channel.send(userInputEmbed);
			const collected = await userInput.channel
				.awaitMessages(msgFilter, {
					max: 1,
					time: 20000
				})
				.catch(err => {
					console.log(err);
					return message.channel.send('``No input received.``');
				});
			const userInputMessage = collected.first().content;
			const messageEmbedObject = {
				title: 'Auto reactor and Polls',
				topic: 'Poll',
				text: 'Please reply with poll topic',
				color: '#9400D3',
				thumbnail:
					'https://cdn.discordapp.com/attachments/728671530459856896/728677723198980167/television.png',
				boolean: true,
				emojiArray: []
			};

			if (doc[userInputMessage] || doc.optionsText) {
				if (userInputMessage.includes('option')) {
					const optionNumber = parseInt(userInputMessage.slice(6, userInputMessage.length), 10);
					messageEmbedObject.topic = 'Poll';
					messageEmbedObject.text = `Please enter option ${optionNumber}`;
					const returnedText = await createAndWait(messageEmbedObject);
					doc.optionsText[optionNumber - 1].text = returnedText;
					doc.markModified('optionsText');
				}

				if (userInputMessage === 'pollTopic') {
					const pollTopic = await createAndWait(messageEmbedObject);
					doc.pollTopic = pollTopic;
				}
				if (userInputMessage === 'pollColor') {
					messageEmbedObject.topic = 'Poll';
					messageEmbedObject.text =
						'Please reply with poll color \n [view applicable colors here](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable)';
					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.thumbnail =
						'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';
					const pollColor = await createAndWait(messageEmbedObject);
					doc.pollColor = pollColor.toUpperCase();
				}

				if (userInputMessage === 'pollImage') {
					messageEmbedObject.topic = 'Poll';
					messageEmbedObject.text =
						// prettier-ignore
						'Please reply with the custom poll image\n' +
						'if you don\'t want to set poll image please reply with `no`';

					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.image = true;
					messageEmbedObject.thumbnail =
						'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';
					const pollImageCheck = await createAndWait(messageEmbedObject);
					const pollImage = pollImageCheck === undefined ? false : pollImageCheck;
					if (pollImage) {
						doc.pollImage = pollImage;
					}
				}
				if (userInputMessage === 'statsReactionNumber') {
					messageEmbedObject.topic = 'Trigger options';
					messageEmbedObject.text =
						'Please enter the number of reactions after which the stats are to be stored.';
					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.thumbnail =
						'https://cdn.discordapp.com/attachments/728671530459856896/728680050295046214/bible.png';
					messageEmbedObject.boolean = true;
					const statsReactionNumber = await createAndWait(messageEmbedObject);
					doc.statsReactionNumber = statsReactionNumber;
					console.log(statsReactionNumber, 'here it isd');
				}
				if (userInputMessage === 'endReactionEmoji') {
					messageEmbedObject.topic = 'Trigger options';
					messageEmbedObject.text =
						'Please react this message with the reaction you would want to trigger this action';
					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.thumbnail =
						'https://cdn.discordapp.com/attachments/728671530459856896/728680480559595630/love.png';
					messageEmbedObject.boolean = false;
					messageEmbedObject.emojiArray = [];
					const triggerTwoEmoji = await createAndWait(messageEmbedObject);
					doc.endReactionEmoji = triggerTwoEmoji;
				}
				if (userInputMessage === 'endReactionNumber') {
					messageEmbedObject.topic = 'Trigger options';
					messageEmbedObject.text = 'Please enter the number of reactions to trigger this action';
					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.thumbnail =
						'https://media.discordapp.net/attachments/728671530459856896/728681225971171389/kindness.png';
					messageEmbedObject.boolean = true;
					const triggerThreeStatsMsgCollector = await createAndWait(messageEmbedObject);
					doc.endReactionNumber = parseInt(triggerThreeStatsMsgCollector, 10);
				}
				if (userInputMessage === 'role') {
					messageEmbedObject.topic = 'Trigger options';
					messageEmbedObject.text = 'Please Select which role \n ***1 - Admin \n 2 - Owner***';
					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.thumbnail =
						'https://media.discordapp.net/attachments/728671530459856896/728682672615850135/person.png';
					messageEmbedObject.boolean = false;
					messageEmbedObject.emojiArray = ['1️⃣', '2️⃣'];

					const triggerFiveStatsMsgCollector = await createAndWait(messageEmbedObject);
					let finalPush = undefined;
					if (triggerFiveStatsMsgCollector === '1️⃣') {
						finalPush = 'Admin';
					}
					if (triggerFiveStatsMsgCollector === '2️⃣') {
						finalPush = 'Owner';
					}
					doc.role = finalPush;
				}
				if (userInputMessage === 'rep') {
					messageEmbedObject.topic = 'Triggers';
					messageEmbedObject.text = 'Do you want to add a +rep to the author of the message on every upvote';
					messageEmbedObject.color = '#9400D3';
					messageEmbedObject.thumbnail =
						'https://media.discordapp.net/attachments/728671530459856896/728683970371387512/thumbs-up.png';
					messageEmbedObject.boolean = false;
					messageEmbedObject.emojiArray = ['✅', '❎'];
					const triggerSevenEmoji = await createAndWait(messageEmbedObject);
					if (triggerSevenEmoji === '✅') {
						doc.rep === 'yes';
					}
				}

				doc.save()
					.then(saved => {
						message.channel.send('`Value saved`');
						console.log(saved);
					})
					.catch(console.log);
			} else {
				message.channel.send('You cannot edit that value.');
			}
		}
	}
}

module.exports = ShowReactorCommand;
