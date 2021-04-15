const mongoose = require('mongoose');
const autoSchema = mongoose.Schema({
	pollid: String,
	voters: [{ type: Object }],
	pollCount: [{ type: Object }]
});

module.exports = mongoose.model('PollData', autoSchema);
