const mongoose = require('mongoose');

const autoSchema = mongoose.Schema({
	userid: String,
	reps: Number,
	timeLeft: Number,
	reviews: [
		{
			from: String,
			review: String
		}
	]
});

module.exports = mongoose.model('Reps', autoSchema);
