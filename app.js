// Sub with var ds18b20 = require('./tests/mockSensor') for a sensor
// that returns a sine wave of 50 to 150 over 100 seconds.
const ds18b20 = require('./tests/mockSensor');
// const ds18b20 = require('ds18b20');
const socketLib = require('socket.io');

var io = socketLib(3001);
var logger = require('./logger')(io);
var database = require('./databases/dynamodb-plugin')(logger);

var sensors = [],
  collectInterval = 1000,
  sendInterval = 60000,
  lastRecord = {},
  currentRecord = {};

function sendTemperatureData()
{
  database.saveRecord(currentRecord);
}

function collectTemperatureData()
{
  lastRecord.temp         = currentRecord.temp;
  lastRecord.timestamp    = currentRecord.timestamp;
  currentRecord.temp      = ds18b20.temperatureSync(sensors[0]);
  currentRecord.timestamp = (new Date()).getTime();

  if (lastRecord.temp != currentRecord.temp)
    io.emit('liveTemp', currentRecord);

  logger.log(currentRecord)
  return currentRecord;
}

function init()
{
  ds18b20.sensors((err, ids) => {
    if (err) {
      logger.log("Error initializing sensors: " + err.message)
      shutdown();
    }
    sensors = ids;
    collectTemperatureData();
    setInterval(collectTemperatureData, collectInterval);
  });

  setInterval(sendTemperatureData, sendInterval);
}

function shutdown() {
  logger.log('Shutting down');
  if (database)
    database.close();
    logger.log("Database connection closed")
  io.close();
  process.exit(2);
}

// catch ctrl+c event and exit normally
process.on('SIGINT', shutdown);

init();
