const mongoose = require('mongoose');
const personSchema = mongoose.Schema({
    socketId: {type:String, required: true},
    messages: {type: Array, required: false},
});
module.exports = mongoose.model('Person', personSchema);