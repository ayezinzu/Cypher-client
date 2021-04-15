const mongoose = require('mongoose');

const autoSchema = mongoose.Schema({
	userid: String,
	emojiData: [{ type: Object }],
	gems: String
});

module.exports = mongoose.model('PersonalProfile', autoSchema);
