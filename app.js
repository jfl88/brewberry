const config = require('./config');

const socketServer = require('socket.io');

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

var SineSim = require('./sensors/SineSim');

var sensors = [],
  collectInterval = 1000;

function collectTemperatureData()
{
  sensors.forEach(function (sensor) {
    sensor.lastRecord.temp         = sensor.currentRecord.temp;
    sensor.lastRecord.timestamp    = sensor.currentRecord.timestamp;
    sensor.currentRecord.temp      = sensor.getValue();
    sensor.currentRecord.timestamp = (new Date()).getTime();
  
    if (sensor.lastRecord.temp != sensor.currentRecord.temp) {
      io.emit('liveTemp', sensor.currentRecord);
    }

    logger.log(sensor)
    return sensor.currentRecord;
  });
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
  sensors.push(new SineSim('abcd','sensor1'));
  
  collectTemperatureData();
  setInterval(collectTemperatureData, collectInterval);

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
