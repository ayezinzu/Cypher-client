require('dotenv').config();

const client = require('./client');
client.start();

client
	.on('disconnect', () => console.log('[DISCONNECTED]'))
	.on('shardReconnecting', () => console.log('[RECONNECTING]'))
	.on('error', console.log)
	.on('warn', console.log);

process.on('unhandledRejection', console.log).on('warning', console.log);
