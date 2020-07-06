const EventEmitter = require('events');
class Emitter extends EventEmitter {

};
var emitter = new Emitter();
module.exports = emitter;