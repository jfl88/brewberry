const { transports, createLogger, format } = require('winston');

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({ level: 'debug' })
  ]
});

module.exports = logger;