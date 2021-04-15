const mongoose = require('mongoose');

const autoSchema = mongoose.Schema({
	guildID: String,
	repName: String
});

module.exports = mongoose.model('GuildSettings', autoSchema);
