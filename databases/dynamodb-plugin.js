const dynamo = require('dynamodb'),
  deviceId = process.env.DEVICE_ID,
  Joi = require('joi');

var TemperatureReading = dynamo.define('TemperatureReading', {
  hashKey: 'deviceId',
  rangeKey: 'timestamp',
  schema: {
    deviceId    : Joi.number().required(),
    temperature : Joi.number().required(),
    timestamp   : Joi.number().required()
  }
});

module.exports = function (logger) {
  dynamo.createTables((err) => {
    if (err)
      logger.log(err)
  });
  return {
    saveRecord: function(tempRecord) {
      TemperatureReading.create({ deviceId: 1, temperature: tempRecord.temp, timestamp: tempRecord.timestamp }, (err, result) => {
        if (err)
          logger.log("Error saving to database: " + JSON.stringify(err))
      });
    },
    close: function() {}
  }
};
