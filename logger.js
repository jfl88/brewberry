const EventEmitter = require('events');
class Logger extends EventEmitter {

};
var logger = new Logger();
module.exports = logger;