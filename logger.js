const { transports, createLogger, format } = require('winston');
require('winston-mongodb');
const config = require('./config');

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({ level: 'debug' }),
    new transports.MongoDB({
      level: 'info',
      db: 'mongodb://' + config.db_user + ':' + config.db_pw + '@' + config.db_addr,
      storeHost: true,
      options: {
        poolSize: 2, 
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    })
  ]
});

module.exports = logger;