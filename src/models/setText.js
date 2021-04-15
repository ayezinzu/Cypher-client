const mongoose = require('mongoose');
const autoSchema = mongoose.Schema({
	guildid: String,
	channels: [{ type: String }]
});
module.exports = mongoose.model('SetText', autoSchema);
