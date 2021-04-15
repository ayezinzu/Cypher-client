const mongoose = require('mongoose');
const autoSchema = mongoose.Schema({
	reactors: [{ type: Object }]
});

module.exports = mongoose.model('LiveReactor', autoSchema);
