const mongoose = require('mongoose');

const autoSchema = mongoose.Schema({
	userid: String,
	coins: Number,
	bets: Number
});

module.exports = mongoose.model('Profile', autoSchema);
