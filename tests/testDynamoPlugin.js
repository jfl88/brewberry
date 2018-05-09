var logger = require('../logger')()
var db = require('../databases/dynamodb-plugin')(logger);

db.saveRecord({temp: 100, timestamp: (new Date()).getTime()});
