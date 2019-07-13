// Sub with var ds18b20 = require('./tests/mockSensor') for a sensor
// that returns a sine wave of 50 to 150 over 100 seconds.
if (process.env.DEVICE_ID != undefined) {
  var ds18b20 = require('ds18b20');
} else {
  var ds18b20 = require('./tests/mockSensor');
}

const config = require('./config');

const brewHome = process.env.BREWHOME;
const socketServer = require('socket.io');
const socketClient = require('socket.io-client');

const webListenPort = 3000;

const webapp = require('./webapp/app');
const debug = require('debug')('brewtest:server');
const http = require('http');

var io = socketServer(config.socket_port);
var logger = require('./logger')(io);
var ioClient;

var port = normalizePort(process.env.PORT || webListenPort);
webapp.set('port', port);

var server = http.createServer(webapp);

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
    if (ioClient)
      ioClient.emit('liveTemp', currentRecord);
  }

  logger.log(currentRecord)
  return currentRecord;
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
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

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}

function shutdown() {
  logger.log('Shutting down');
  io.close();
  if (ioClient)
    ioClient.close();
  process.exit(2);
}

// catch ctrl+c event and exit normally
process.on('SIGINT', shutdown);

init();
