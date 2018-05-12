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
var database = require('./databases/dynamodb-plugin')(logger);

var ioClient;

try {
  ioClient = socketClient(brewHome);
} catch (e) {
  logger.log('Could not connect to registry')
}

var sensors = [],
  collectInterval = 1000,
  sendInterval = 60000,
  heartBeatInterval = 5000,
  lastRecord = {},
  currentRecord = {};

var os = require('os');
var ifaces = os.networkInterfaces();

var ipAddress, socketServerAddress;

function isPrivateIP(ip) {
   var parts = ip.split('.');
   return parts[0] === '10' || 
      (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) || 
      (parts[0] === '192' && parts[1] === '168');
}

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (isPrivateIP(iface.address)) {
      ipAddress = iface.address;
      socketServerAddress = 'http://' + ipAddress + ':' + serverListenPort
    }
  });
});


function sendHeartBeat()
{
  if (ioClient) {
    ioClient.emit('heartbeat', {id: process.env.DEVICE_ID, address: ipAddress + ':' + serverListenPort})
  }
}

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
  setInterval(sendHeartBeat, heartBeatInterval);
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
