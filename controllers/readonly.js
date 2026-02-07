const Controller = require('./controller');
const emitter = require('../emitter');
const logger = require('../logger');

class ReadOnly extends Controller {
  constructor(id, name, enabled, sensor, output, updateRate, param) {
    super(id, name, enabled, sensor, output, updateRate, param);
    this.model = "ReadOnly";
    this.output = "";

    var validationErrors = [];
    const updateRateError = this.validateUpdateRate(updateRate);
    if (updateRateError)
      validationErrors.push(this.constructor.name + ' controller validation failure: ' + updateRateError);

    if (validationErrors.length > 0)
      throw validationErrors;

    this.param = param ? param : {};
    // @todo ideas: alarm high, alarm low
  }

  update() {
    var newTemp = this.sensor.getValue();

    if (newTemp !== false) {
      this.sensor.lastRecord.temp = this.sensor.currentRecord.temp;
      this.sensor.lastRecord.timestamp = this.sensor.currentRecord.timestamp;
      this.sensor.currentRecord.temp = newTemp;
      this.sensor.currentRecord.timestamp = new Date();

      if (this.sensor.lastRecord.temp != this.sensor.currentRecord.temp) {
        emitter.emit('controllerUpdate', this);
      }
    } else {
      this.stopControl();
    }
  }
}

module.exports = ReadOnly;