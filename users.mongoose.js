const mongoose = require('mongoose');
const personSchema = mongoose.Schema({
    email: {type: String, required: true},
    vip: {type: Boolean, required: true},
    quantity: {type: Number},
    itemId: {type: Number}
});
module.exports = mongoose.model('Person', personSchema);