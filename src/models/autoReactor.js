const mongoose = require('mongoose');

const autoSchema = mongoose.Schema({
	anon: Boolean,
	channel: String,
	emojis: [{ type: String }],
	endReactionEmoji: String,
	endReactionNumber: Number,
	endReactionTime: Number,
	grandTotal: [String],
	hasEnded: Boolean,
	id: String,
	isPoll: Boolean,
	isRunning: Boolean,
	notify: Number,
	optionsText: [Object],
	pin: String,
	pollColor: String,
	pollImage: String,
	pollRole: String,
	pollTopic: String,
	reactorSettings: Object,
	rep: String,
	repNum: Number,
	role: String,
	statsReactionNumber: Number,
	totalVotes: Number,
	userid: String,
	// eslint-disable-next-line sort-keys
	alreadyRan: Boolean
});

module.exports = mongoose.model('Autor', autoSchema);
