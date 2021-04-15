/* eslint-disable no-mixed-spaces-and-tabs */
const { Command } = require('discord-akairo');
const { Message, MessageEmbed } = require('discord.js');
const autoReactor = require('../models/autoReactor');
const letters = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮'];

class ReactorCommand extends Command {
	constructor() {
		super('reactor', {
			aliases: ['reactor'],
			category: 'general',
			description: {
				content: 'Reactor command something...',
				usage: '[No Arguments]'
			},
			channel: 'guild'
		});
	}

	/**
	 * @param {Message} message - The message object.
	 */
	async exec(message) {
		const prop = [];
		let statsReactionNumber = undefined;
		const newReactor = new autoReactor();
		newReactor.userid = message.author.id;
		const createAndWait = async messageEmbedObject => {
			const embed = new MessageEmbed().setTitle(messageEmbedObject.title);
			embed.addField(messageEmbedObject.topic, messageEmbedObject.text);
			embed.setColor(messageEmbedObject.color);
			embed.setThumbnail(messageEmbedObject.thumbnail);
			const collectThisMsg = await message.channel.send(embed);
			if (messageEmbedObject.boolean) {
				const collected = await collectThisMsg.channel.awaitMessages(
					m => m.author.id === message.author.id,
					{
						max: 1,
						time: 200000
					}
				);
				if (messageEmbedObject.image) {
					return collected?.first()?.attachments?.first()?.url;
				}
				return collected.first().content;
			}
			for (const emoji of messageEmbedObject.emojiArray) {
				await collectThisMsg.react(emoji);
			}
			const collected = await collectThisMsg.awaitReactions(
				(r, u) => u.id === message.author.id,
				{
					max: 1,
					time: 200000,
					errors: ['time']
				}
			);
			return collected.first().emoji.name;
		};
		const messageEmbedObject = {
			title: 'Auto reactor and Polls',
			topic: 'Channel select',
			text:
        'Please enter the name of the channel you wish to initiate Auto Reactor/ Polls.',
			color: '#9400D3',
			thumbnail:
        'https://cdn.discordapp.com/attachments/728671530459856896/728677723198980167/television.png',
			boolean: true,
			emojiArray: []
		};

		messageEmbedObject.topic = 'Auto reactor or Poll ?';
		messageEmbedObject.text = '\n - ``1️`` - Auto Reactor \n - ``2`` - Poll';
		messageEmbedObject.color = '#9400D3';
		messageEmbedObject.thumbnail =
      'https://cdn.discordapp.com/attachments/728671530459856896/728677723198980167/television.png';
		messageEmbedObject.boolean = true;

		const AutoOrPoll = await createAndWait(messageEmbedObject);
		if (AutoOrPoll === '2') {
			messageEmbedObject.topic = 'Poll';
			messageEmbedObject.text = 'Please reply with poll topic';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';
			messageEmbedObject.boolean = true;
			const pollTopic = await createAndWait(messageEmbedObject);
			newReactor.pollTopic = pollTopic;
			newReactor.isPoll = true;
			prop.push(`\n - 📄 Poll Topic : ${pollTopic}`);

			messageEmbedObject.topic = 'Poll';
			messageEmbedObject.text = 'How many poll options do you want to add.';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';

			const pollOptions = await createAndWait(messageEmbedObject);
			newReactor.optionsText = [];
			newReactor.pollOptions = parseInt(pollOptions, 10);
			for (let i = 0; i < newReactor.pollOptions; i++) {
				messageEmbedObject.text = `Please enter option ${i + 1}`;
				const optionText = await createAndWait(messageEmbedObject);
				newReactor.optionsText.push({
					text: optionText,
					weights: 0,
					votes: 0,
					voterid: [],
					voterNames: [],
					emoji: letters[i],
					percent: 0
				});
			}

			messageEmbedObject.topic = 'Poll';
			messageEmbedObject.text =
        'Please reply with poll color \n [view applicable colors here](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable)';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';
			const pollColor = await createAndWait(messageEmbedObject);
			newReactor.pollColor = pollColor.toUpperCase();
			prop.push(`\n - 📄 Poll Color : ${pollColor}`);

			messageEmbedObject.topic = 'Poll';
			// prettier-ignore
			messageEmbedObject.text =
				'Please reply with the custom poll image\n' +
				'if you don\'t want to set poll image please reply with `no`';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.image = true;
			messageEmbedObject.thumbnail =
        'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';

			const pollImageCheck = await createAndWait(messageEmbedObject);
			const pollImage = pollImageCheck === undefined ? false : pollImageCheck;
			if (pollImage) {
				newReactor.pollImage = pollImage;
				prop.push(`\n - 📄 Poll Image : [click to view image](${pollImage})`);
			}
			messageEmbedObject.image = false;
			messageEmbedObject.topic = 'Poll';
			messageEmbedObject.text =
        'Reply with ``yes`` for anonymous voting and ``no`` for public voting.';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';

			const isAnon = await createAndWait(messageEmbedObject);
			newReactor.anon = isAnon === 'yes';
			if (newReactor.anon) {
				newReactor.hasEnded = false;
			}
			prop.push(`\n - 📄 Anonymous voting : ${isAnon}`);

			messageEmbedObject.topic = 'What roles should have access to the poll';
			messageEmbedObject.text =
        '1️ - Everyone\n' +
        '2️ - New Heads - `Crowd, prospect, fan`\n' +
        '3️ - Heads - `Enthusiast, challenger, regular`\n' +
        '4 - Old Heads - `active, pro, vet, titan, legend`\n' +
        '5 - Supporter';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://media.discordapp.net/attachments/763795278079721482/765232054228090880/unknown.png';
			messageEmbedObject.boolean = true;

			const pollRole = await createAndWait(messageEmbedObject);
			if (pollRole === '1') {
				newReactor.pollRole = 'oneRoleArray';
				prop.push('\n - 📄 Poll Roles : Everyone');
			} else if (pollRole === '2') {
				newReactor.pollRole = 'twoRoleArray';
				prop.push('\n - 📄 Poll Roles : New Heads');
			} else if (pollRole === '3') {
				newReactor.pollRole = 'threeRoleArray';
				prop.push('\n - 📄 Poll Roles : Heads');
			} else if (pollRole === '4') {
				newReactor.pollRole = 'fourRoleArray';
				prop.push('\n - 📄 Poll Roles : Old Heads');
			} else if (pollRole === '5') {
				newReactor.pollRole = 'fiveRoleArray';
				prop.push('\n - 📄 Poll Roles : Supporter');
			} else {
				newReactor.pollRole = 'oneRoleArray';
				prop.push('\n - 📄 Poll Roles : Everyone');
			}
			newReactor.totalVotes = 0;
		}

		messageEmbedObject.topic = 'Triggers';
		messageEmbedObject.text =
      'Do you want enable stat point condition \n ``1`` - Yes \n ``2`` - No';
		messageEmbedObject.color = '#9400D3';
		messageEmbedObject.thumbnail =
      'https://cdn.discordapp.com/attachments/728671530459856896/728680050295046214/bible.png';
		messageEmbedObject.boolean = true;

		const triggerOneEmoji = await createAndWait(messageEmbedObject);

		if (triggerOneEmoji === '1') {
			prop.push('\n - 📄 Stat point : yes');
			messageEmbedObject.topic = 'Trigger options';
			messageEmbedObject.text =
        'Please enter the number of reactions after which the stats are to be stored.';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://cdn.discordapp.com/attachments/728671530459856896/728680050295046214/bible.png';
			messageEmbedObject.boolean = true;
			statsReactionNumber = await createAndWait(messageEmbedObject);
			console.log(statsReactionNumber, 'stats reaction number');
			prop.push(`\n - 📄 Store stats at : ${statsReactionNumber} reactions`);
			newReactor.statsReactionNumber = parseInt(statsReactionNumber, 10);
		}
		if (!newReactor.isPoll) {
			messageEmbedObject.topic = 'Triggers';
			messageEmbedObject.text =
        'Do you want to end reaction collector on a post by reacting with a certain emoji\n' +
        '`1` - Yes\n`2` - No';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://cdn.discordapp.com/attachments/728671530459856896/728680480559595630/love.png';
			messageEmbedObject.boolean = true;
			const triggerTwoEmoji = await createAndWait(messageEmbedObject);
			prop.push(`\n - 📊 End reaction with Emoji : ${triggerTwoEmoji}`);

			if (triggerTwoEmoji === '1') {
				messageEmbedObject.topic = 'Trigger options';
				messageEmbedObject.text =
          'Please react this message with the reaction you would want to trigger this action';
				messageEmbedObject.color = '#9400D3';
				messageEmbedObject.thumbnail =
          'https://cdn.discordapp.com/attachments/728671530459856896/728680480559595630/love.png';
				messageEmbedObject.boolean = false;
				messageEmbedObject.emojiArray = [];
				const triggerTwoEmoji = await createAndWait(messageEmbedObject);
				prop.push(`\n - 📊 End reaction Emoji : ${triggerTwoEmoji}`);
				newReactor.endReactionEmoji = triggerTwoEmoji;
			}

			messageEmbedObject.topic = 'Trigger';
			messageEmbedObject.text =
        'Do you want to end reaction collector on a post after a certain reactions are reached\n' +
        '`1` - Yes\n`2` - No';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://cdn.discordapp.com/attachments/728671530459856896/728680480559595630/love.png';
			messageEmbedObject.boolean = true;
			const triggerThreeEmoji = await createAndWait(messageEmbedObject);

			prop.push(`\n - 🎬 End reaction after some cap : ${triggerThreeEmoji}`);
			if (triggerThreeEmoji === '1') {
				messageEmbedObject.topic = 'Trigger options';
				messageEmbedObject.text =
          'Please enter the number of reactions to trigger this action';
				messageEmbedObject.color = '#9400D3';
				messageEmbedObject.thumbnail =
          'https://media.discordapp.net/attachments/728671530459856896/728681225971171389/kindness.png';
				messageEmbedObject.boolean = true;
				const triggerThreeStatsMsgCollector = await createAndWait(
					messageEmbedObject
				);
				prop.push(
					`\n - 🎬 End reaction after cap : ${triggerThreeStatsMsgCollector}`
				);
				newReactor.endReactionNumber = parseInt(
					triggerThreeStatsMsgCollector,
					10
				);
			}
			messageEmbedObject.topic = 'Reaction options';
			messageEmbedObject.text =
        'Do you want to add custom emojis or select from the presets \n ``1`` - Custom \n ``2`` - Preset';
			messageEmbedObject.color = '#9400D3';
			messageEmbedObject.thumbnail =
        'https://cdn.discordapp.com/attachments/728671530459856896/728677723198980167/television.png';
			messageEmbedObject.boolean = true;

			const reactCusOrPreMsgEmoji = await createAndWait(messageEmbedObject);
			prop.push(`\n - 📄 Reaction options : ${reactCusOrPreMsgEmoji}`);

			if (reactCusOrPreMsgEmoji === '2') {
				messageEmbedObject.topic = 'Please choose one of the preset options';
				messageEmbedObject.text =
          '1 - ``✅`` - ``❎`` \n 2 - ``👍`` - ``🤐`` - `` 👎 `` \n 3 - ``😍`` - ``👍`` - ``🤐`` - `` 👎 `` - ``🤢``';
				messageEmbedObject.color = '#9400D3';
				messageEmbedObject.thumbnail =
          'https://cdn.discordapp.com/attachments/728671530459856896/728679330095300628/donate.png';
				messageEmbedObject.boolean = true;
				const finalPreset = await createAndWait(messageEmbedObject);
				if (finalPreset === '1') {
					const presetEmojis1 = '✅ - ❎';
					prop.push(`\n - 📄 Preset emojis : ${presetEmojis1}`);
					newReactor.emojis.push('✅');
					newReactor.emojis.push('❎');
				} else if (finalPreset === '2') {
					const presetEmojis2 = '👍 - 🤐 - 👎';
					prop.push(`\n - 📄 Preset emojis : ${presetEmojis2}`);
					newReactor.emojis.push('👍');
					newReactor.emojis.push('🤐');
					newReactor.emojis.push('👎');
				} else if (finalPreset === '3') {
					const presetEmojis3 = '😍 - 👍 - 👎 - 🤐 - 🤢';
					prop.push(`\n - 📄 Preset emojis : ${presetEmojis3}`);

					newReactor.emojis.push('😍');
					newReactor.emojis.push('👍');
					newReactor.emojis.push('👎');
					newReactor.emojis.push('🤐');
					newReactor.emojis.push('🤢');
				}
				newReactor.markModified('emojis');
			}

			if (reactCusOrPreMsgEmoji === '1') {
				messageEmbedObject.topic = 'Reactions to be done';
				messageEmbedObject.text =
          'Please select the number of reactions you want to be reacted on the messages. \n ``MINIMUM : 2``';
				messageEmbedObject.color = '#9400D3';
				messageEmbedObject.thumbnail =
          'https://cdn.discordapp.com/attachments/728671530459856896/728679330095300628/donate.png';
				messageEmbedObject.boolean = true;

				const finalNum = await createAndWait(messageEmbedObject);
				const finalNum1 = parseInt(finalNum, 10);
				if (finalNum1 === 2) {
					const reactionSelect = new MessageEmbed().setTitle(
						'Auto reactions creator'
					);

					reactionSelect.addField(
						'Reactions to be done',
						'Please react with the reactions you would like to be done '
					);
					reactionSelect.setColor('#9400D3');
					reactionSelect.setThumbnail(
						'https://cdn.discordapp.com/attachments/728671530459856896/728679330095300628/donate.png'
					);
					const reactSelectMsg = await message.channel.send(reactionSelect);

					reactSelectMsg.react('⬆️');
					reactSelectMsg.react('⬇️');

					const [reactionOne, reactionTwo] = (
						await reactSelectMsg.awaitReactions(
							(_, u) => u.id === message.author.id,
							{
								max: finalNum,
								time: 200000,
								errors: ['time']
							}
						)
					).first(2);
					prop.push(
						`\n - 🛡️ Custom emojis : ${reactionOne.emoji.name} - ${reactionTwo.emoji.name}`
					);
					const reactionFinalOne =
            reactionOne.emoji.id === null
            	? reactionOne.emoji.name
            	: reactionOne.emoji.id;
					const reactionFinalTwo =
            reactionTwo.emoji.id === null
            	? reactionTwo.emoji.name
            	: reactionTwo.emoji.id;
					newReactor.emojis.push(reactionFinalOne);
					newReactor.emojis.push(reactionFinalTwo);
					console.log(reactionOne.emoji);
				}
				// ----------------------------

				if (finalNum1 === 3) {
					const reactionSelect = new MessageEmbed().setTitle(
						'Auto reactions creator'
					);

					reactionSelect.addField(
						'Reactions to be done',
						'Please react with the reactions you would like to be done '
					);
					reactionSelect.setColor('#9400D3');
					reactionSelect.setThumbnail(
						'https://cdn.discordapp.com/attachments/728671530459856896/728679330095300628/donate.png'
					);
					const reactSelectMsg = await message.channel.send(reactionSelect);

					const [reactionOne, reactionTwo, reactionThree] = (
						await reactSelectMsg.awaitReactions(
							(_, u) => u.id === message.author.id,
							{
								max: finalNum,
								time: 200000,
								errors: ['time']
							}
						)
					).first(3);
					const reactionFinalOne =
            reactionOne.emoji.id === null
            	? reactionOne.emoji.name
            	: reactionOne.emoji.id;
					const reactionFinalTwo =
            reactionTwo.emoji.id === null
            	? reactionTwo.emoji.name
            	: reactionTwo.emoji.id;
					const reactionFinalThree =
            reactionThree.emoji.id === null
            	? reactionThree.emoji.name
            	: reactionThree.emoji.id;
					prop.push(
						`\n - 🛡️ Custom emojis : ${reactionFinalOne} - ${reactionFinalTwo} - ${reactionFinalThree}`
					);
					newReactor.emojis.push(reactionFinalOne);
					newReactor.emojis.push(reactionFinalTwo);
					newReactor.emojis.push(reactionFinalThree);
				}
				if (finalNum1 === 4) {
					const reactionSelect = new MessageEmbed().setTitle(
						'Auto reactions creator'
					);

					reactionSelect.addField(
						'Reactions to be done',
						'Please react with the reactions you would like to be done'
					);
					reactionSelect.setColor('#9400D3');
					reactionSelect.setThumbnail(
						'https://cdn.discordapp.com/attachments/728671530459856896/728679330095300628/donate.png'
					);
					const reactSelectMsg = await message.channel.send(reactionSelect);

					const [reactionOne, reactionTwo, reactionThree, reactionFour] = (
						await reactSelectMsg.awaitReactions(
							(_, u) => u.id === message.author.id,
							{
								max: finalNum,
								time: 200000,
								errors: ['time']
							}
						)
					).first(4);
					const reactionFinalOne =
            reactionOne.emoji.id === null
            	? reactionOne.emoji.name
            	: reactionOne.emoji.id;
					const reactionFinalTwo =
            reactionTwo.emoji.id === null
            	? reactionTwo.emoji.name
            	: reactionTwo.emoji.id;
					const reactionFinalThree =
            reactionThree.emoji.id === null
            	? reactionThree.emoji.name
            	: reactionThree.emoji.id;
					const reactionFinalFour =
            reactionFour.emoji.id === null
            	? reactionFour.emoji.name
            	: reactionFour.emoji.id;
					prop.push(
						`\n - 🛡️ Custom emojis : ${reactionFinalOne} ` +
              `- ${reactionFinalTwo} ` +
              `- ${reactionFinalThree} ` +
              `- ${reactionFinalFour}`
					);
					newReactor.emojis.push(reactionFinalOne);
					newReactor.emojis.push(reactionFinalTwo);
					newReactor.emojis.push(reactionFinalThree);
					newReactor.emojis.push(reactionFinalFour);
				}
				if (finalNum1 === 5) {
					const reactionSelect = new MessageEmbed().setTitle(
						'Auto reactions creator'
					);

					reactionSelect.addField(
						'Reactions to be done',
						'Please react with the reactions you would like to be donee '
					);
					reactionSelect.setColor('#9400D3');
					reactionSelect.setThumbnail(
						'https://cdn.discordapp.com/attachments/728671530459856896/728679330095300628/donate.png'
					);
					const reactSelectMsg = await message.channel.send(reactionSelect);

					const [
						reactionOne,
						reactionTwo,
						reactionThree,
						reactionFour,
						reactionFive
					] = (
						await reactSelectMsg.awaitReactions(
							(_, u) => u.id === message.author.id,
							{
								max: finalNum,
								time: 200000,
								errors: ['time']
							}
						)
					).first(5);
					const reactionFinalOne =
            reactionOne.emoji.id === null
            	? reactionOne.emoji.name
            	: reactionOne.emoji.id;
					const reactionFinalTwo =
            reactionTwo.emoji.id === null
            	? reactionTwo.emoji.name
            	: reactionTwo.emoji.id;
					const reactionFinalThree =
            reactionThree.emoji.id === null
            	? reactionThree.emoji.name
            	: reactionThree.emoji.id;
					const reactionFinalFour =
            reactionFour.emoji.id === null
            	? reactionFour.emoji.name
            	: reactionFour.emoji.id;
					const reactionFinalFive =
            reactionFive.emoji.id === null
            	? reactionFive.emoji.name
            	: reactionFive.emoji.id;
					prop.push(
						`\n - 🛡️ Custom emojis : ${reactionFinalOne} ` +
              `- ${reactionFinalTwo} ` +
              `- ${reactionFinalThree} ` +
              `- ${reactionFinalFour} ` +
              `- ${reactionFinalFive}`
					);
					newReactor.emojis.push(reactionFinalOne);
					newReactor.emojis.push(reactionFinalTwo);
					newReactor.emojis.push(reactionFinalThree);
					newReactor.emojis.push(reactionFinalFour);
					newReactor.emojis.push(reactionFinalFive);
				}
				newReactor.markModified('emojis');
			}
		}
		newReactor.id = Math.random().toString(20).substr(2, 6);

		const confirmationEmbed = new MessageEmbed()
			.setColor('#E0FFFF')
			.setTitle(
				`Here are you AutoReact/Poll Details\n\n\`\`\`ID: ${newReactor.id} \`\`\``
			)
			.setThumbnail(
				'https://cdn.discordapp.com/attachments/728671530459856896/728686591526174760/rocket.png'
			)
			.addFields({
				name: 'Properties ',
				value: prop
			});

		await newReactor.save();
		message.channel.send(confirmationEmbed);
	}
}

module.exports = ReactorCommand;
