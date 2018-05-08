// Sub with var ds18b20 = require('tests/mockSensor') for a sensor
// that returns a sine wave of 50 to 150 over 100 seconds.
var ds18b20 = require('ds18b20');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var io = require('socket.io')(3001);

if (process.env.BREWMON_DATABASE_CONNECTION_STRING) {
  var mongoConnectionString = process.env.BREWMON_DATABASE_CONNECTION_STRING;
} else {
  var dblogin = require('./dblogin.json');
  var mongoConnectionString = 'mongodb://' + dblogin.user + ':' + dblogin.pw + '@' + dblogin.addr;
}

var sensors = [],
  tempRec = {},
  database,
  collectInterval = 1000,
  sendInterval = 60000,
  lastRecord = {},
  currentRecord = {};

function collectTemperatureData()
{
  lastRecord.temp = currentRecord.temp || "";
  lastRecord.timestamp = currentRecord.timestamp || new Date();
  currentRecord.temp = ds18b20.temperatureSync(sensors[0]);
  currentRecord.timestamp = new Date();

  if (lastRecord.temp != currentRecord.temp)
    io.emit('liveTemp', currentRecord);

  socketLog(currentRecord)
  return currentRecord;
}

function sendTemperatureData()
{
  try {
    database.collection('temps').insert(currentRecord, (err, result) => {
      assert.equal(null, err);
      socketLog('New Temp Inserted:' + JSON.stringify(result));
    });
    database.collection('brews').find({complete: false}).forEach((b)  => {
      b.tempData.push(currentRecord);
      database.collection('brews').save(b);
    });
  } catch (e) {
    socketLog("Error writing to database: " + JSON.stringify(e.message))
  }
}

function init()
{
  ds18b20.sensors((err, ids) => {
    if (err) {
      socketLog("Error initializing sensors: " + JSON.stringify(err))
      shutdown();
    }
    sensors = ids;
    collectTemperatureData();
    setInterval(collectTemperatureData, collectInterval);
  });

  MongoClient.connect(mongoConnectionString, (err, db) => {
    if (err) {
      socketLog("Error initializing database connection: " + JSON.stringify(err))
      shutdown();
    }
    socketLog("Connected to DB")
    database = db;
    sendTemperatureData();
    setInterval(sendTemperatureData, sendInterval);
  });
}

function shutdown() {
  socketLog('Shutting down');
  if (database)
    database.close();
    socketLog("Database connection closed")
  io.close();
  process.exit(2);
}

function socketLog(message)
{
  io.emit('log', message)
  console.log(message)
}

// catch ctrl+c event and exit normally
process.on('SIGINT', shutdown);

init();
