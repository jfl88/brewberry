var logger = require('winston');
logger.add(new logger.transports.Console({colorize: true, timestamp: true, level: 'info'}));
logger.error('lolwut this is logging?');
module.exports = logger;