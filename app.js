const config = require('./config');

const webListenPort = 3000;

const webapp = require('./webapp/app');
const debug = require('debug')('brewtest:server');
const http = require('http');


var logger = require('./logger');
var ioClient;

var port = normalizePort(process.env.PORT || webListenPort);
webapp.set('port', port);

var server = http.createServer(webapp);
const io = require('socket.io')(config.socket_port, { cookie: false });

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

const MongoClient = require('mongodb').MongoClient;
var database;

function init()
{
  MongoClient.connect('mongodb://' + config.db_user + ':' + config.db_pw + '@' + config.db_addr, function(err, db) {
    if (err)
        console.log("Error connecting to mongodb: " + JSON.stringify(err));
    else
        database = db;
  });

  if (!config.client_only) {
    config.controllers.forEach(function (controller){
      controllers.push(Controller.newController(controller));
    });
    
    controllers.forEach(function (controller) {
      if (controller.startControl())
        console.log('started controller: ' + controller.name);
      else
        console.log('failed to start controller: ' + controller.name);
    });

    logger.on('controllerUpdate', function(controller){
      //console.log(controller);
      var record = {
        "timestamp": controller.sensor.currentRecord.timestamp,
        "id": controller.id,
        "name": controller.name,
        "sensorValue": controller.sensor.currentRecord.temp,
        "outputValue": controller.output.state,
        "param": controller.param
      }
      
      if (database) {
        database.collection('controllerLog').insert(record, (err, result) => {
          
          if (err)
            console.log('Error writing to collection: ' + err.message)
          //console.log('New Temp Inserted: ' + JSON.stringify(record));
        });
      }

      io.emit('liveTemp', controller);
    });
  }
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
}

function shutdown() {
  if (!config.client_only) {
    console.log('shutting down controllers');
    controllers.forEach(function(controller) {
      if (controller.runningState)
        if (controller.stopControl())
          console.log('failed to stop controller: ' + controller.name); 
    });
    
    console.log('closing sockets');
    io.close();
    database.close();
  }
  if (ioClient)
    ioClient.close();
  process.exit(2);
}

// catch ctrl+c event and exit normally
process.on('SIGINT', shutdown);

init();
