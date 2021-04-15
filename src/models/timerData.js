const mongoose = require('mongoose');

const autoSchema = mongoose.Schema({
	timerid: String,
	color: String
});

module.exports = mongoose.model('TimerData', autoSchema);
