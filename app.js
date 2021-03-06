const config = require('./config');

const webListenPort = 3000;

const webapp = require('./webapp/app');
const debug = require('debug')('brewtest:server');
const http = require('http');


var emitter = require('./emitter');
var logger = require('./logger');
var assert = require('assert');

var port = normalizePort(process.env.PORT || webListenPort);
webapp.set('port', port);
webapp.set('config', config);

var server = http.createServer(webapp);
const io = require('socket.io')(config.socket_port, { cookie: false });
const ioClient = require('socket.io-client');
var clientSocket;

const Controller = require('./controllers/controller');

var controllers = [];

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
      logger.error('app.js: ' + bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      
    logger.error('app.js: ' + bind + ' is already in use');
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

const MongoClient = require('mongodb').MongoClient;

function startControllers()
{
  MongoClient.connect(config.db_addr, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client) {
      if (err) {
        logger.error('app.js: Error connecting to mongodb: ' + JSON.stringify(err));
        setTimeout(function () { 
          emitter.emit('controllerReload'); 
        }, 60000);
      } else
        client.db().collection('controllers').find()
        .toArray(function(err, docs) {
          assert.equal(err, null);
          logger.debug('app.js: Found ' + docs.length + ' controllers');
          if (docs.length > 0) {
            docs.forEach(function (controller){
              controllers.push(Controller.newController(controller));
            });

            if (!config.client_only)
              controllers.forEach(function (controller) {
                if (controller.startControl())
                  logger.info('app.js: started controller: ' + controller.name);
                else
                  logger.info('app.js: failed to start controller: ' + controller.name);
              });
          }
          config.controllers = docs;
          webapp.set('config', config);
          client.close();
        });
  });
}

function refreshController(controller) {
  var record = {
    "timestamp": controller.sensor.currentRecord.timestamp,
    "id": controller.id,
    "name": controller.name,
    "sensorValue": controller.sensor.currentRecord.temp,
    "outputValue": controller.output.state,
    "param": controller.param
  }
  
  MongoClient.connect(config.db_addr, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client) {
    client.db().collection('controllerLog').insertOne(record, (err, result) => {
      
      if (err)
        logger.error('app.js: Error writing to collection: ' + err.message)
    });
    
    client.close();
  });
  // @todo: livetemp should send record instead of controller
  io.emit('liveTemp', controller);
}

function stopControllers() {
  if (!config.client_only) {
    logger.info('app.js: shutting down controllers');
    if (controllers.length > 0)
      controllers.forEach(function(controller) {
        if (controller.runningState)
          if (controller.stopControl())
            logger.error('app.js: failed to stop controller: ' + controller.name);
          delete controller;
    });
    controllers = [];
  }
}

function startup() {
  startControllers();

  emitter.on('controllerUpdate', function(controller){
    refreshController(controller);
  });

  emitter.on('controllerReload', function(){
    stopControllers();
    startControllers();
    if (config.client_only)
      clientSocket.emit('reloadControllers');
  });

  io.on('connection', function(socket){
    logger.info('app.js: someone connected!');
    socket.on('getControllers', function() {
      logger.info('app.js: received req for controllers');
      io.emit('sendControllers', config.controllers);
    });
    socket.on('reloadControllers', function () {
      emitter.emit('controllerReload');
    });
  });

  if (config.client_only) {
    clientSocket = ioClient('http://' + config.socket_addr + ':' + config.socket_port);
    clientSocket.on('connect', function () { 
      logger.info('app.js: connected as a client only to the mothership!');
    });
  }

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}

function shutdown() {
  if (!config.client_only) {
    stopControllers();
    
    logger.info('app.js: closing sockets');
    io.close();
  }
  if (clientSocket !== undefined)
    clientSocket.close();
  process.exit(2);
}

// catch ctrl+c event and exit normally
process.on('SIGINT', shutdown);

startup();
