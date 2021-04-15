const { AkairoClient, CommandHandler, ListenerHandler } = require('discord-akairo');
const path = require('path');
const server = require('./server');
const mongoose = require('mongoose');

class ThaCypherBot extends AkairoClient {
	constructor() {
		super({
			ownerID: process.env.OwnerID,
			allowedMentions: { parse: ['roles', 'users'] },
			fetchAllMembers: true,
			messageCacheLifetime: 43200,
			messageSweepInterval: 21600
		});

		this.server = server;
		this.isProcessing = false;
		this.isRecording = false;
		this.speaking = new Map();
		this.lockTo = undefined;
		this.recordings = [];
		this.recordingFormat = {};

		this.commandHandler = new CommandHandler(this, {
			aliasReplacement: /-/g,
			allowMention: true,
			argumentDefaults: {
				prompt: {
					timeout: 'Time up!',
					ended: 'Too many retries. Try again later.',
					cancel: 'Command cancelled.',
					retries: 4,
					time: 30000
				}
			},
			commandUtil: true,
			directory: path.join(`${__dirname}/commands`),
			fetchMembers: true,
			handleEdits: true,
			prefix: process.env.BOT_PREFIX
		});
		this.listenerHandler = new ListenerHandler(this, { directory: path.join(`${__dirname}/listeners`) });
	}

	start() {
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.loadAll();

		this.listenerHandler.setEmitters({
			commandHandler: this.commandHandler,
			listenerHandler: this.listenerHandler
		});
		this.listenerHandler.loadAll();
		mongoose.connect(
			process.env.DB_URI,
			{
				useNewUrlParser: true,
				useUnifiedTopology: true
			},
			err => {
				if (err) {
					console.log(err);
				} else {
					console.log('Database connection initiated');
				}
			}
		);

		const prod = process.argv[2] === 'prod';
		const token = prod ? process.env.PRODUCTION_TOKEN : process.env.TEST_TOKEN;
		return this.login(token);
	}
}

const client = new ThaCypherBot();
module.exports = client;
