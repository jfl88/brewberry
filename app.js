// Sub with var ds18b20 = require('./tests/mockSensor') for a sensor
// that returns a sine wave of 50 to 150 over 100 seconds.
if (process.env.DEVICE_ID != undefined) {
  var ds18b20 = require('ds18b20');
} else {
  var ds18b20 = require('./tests/mockSensor');
}

const brewHome = process.env.BREWHOME || 'http://brew.stasmo.wtf:3000';
const socketServer = require('socket.io');
const socketClient = require('socket.io-client');
const serverListenPort = 4000;


var io = socketServer(serverListenPort);
var logger = require('./logger')(io);
var ioClient;

try {
  ioClient = socketClient(brewHome);
} catch (e) {
  console.log('Could not connect to registry')
}

var sensors = [],
  collectInterval = 1000,
  lastRecord = { id: process.env.DEVICE_ID },
  currentRecord = { deviceId: process.env.DEVICE_ID };

function collectTemperatureData()
{
  lastRecord.temp         = currentRecord.temp;
  lastRecord.timestamp    = currentRecord.timestamp;
  currentRecord.temp      = ds18b20.temperatureSync(sensors[0]);
  currentRecord.timestamp = (new Date()).getTime();

  if (lastRecord.temp != currentRecord.temp) {
    io.emit('liveTemp', currentRecord);
    ioClient.emit('liveTemp', currentRecord);
  }

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
}

function shutdown() {
  logger.log('Shutting down');
  io.close();
  ioClient.close();
  process.exit(2);
}

// catch ctrl+c event and exit normally
process.on('SIGINT', shutdown);

init();
