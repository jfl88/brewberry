const EventEmitter = require('events');
class Logger extends EventEmitter {

};
logger = new Logger();
module.exports = logger;