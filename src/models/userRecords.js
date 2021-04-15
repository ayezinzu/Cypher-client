const mongoose = require('mongoose');
const autoSchema = mongoose.Schema({
	userid: String,
	content: [{ type: Object }]
});

module.exports = mongoose.model('UserRecords', autoSchema);
