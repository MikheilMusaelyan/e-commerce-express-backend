const mongoose = require('mongoose');
const personSchema = mongoose.Schema({
    email: {type: String, required: true},
    quantity: {type: Number},
});
module.exports = mongoose.model('Person', personSchema);