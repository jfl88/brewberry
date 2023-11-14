const emitter = require('../emitter');
const logger = require('../logger');

class ReadOnly {
  constructor(id, name, enabled, sensor, output, updateRate, param) {
    // standard members
    this.id = id;
    this.name = name;
    this.enabled = enabled;
    this.model = "ReadOnly";

    this.sensor = sensor;
    this.output = "";

    var validationErrors = [];
    if (isNaN(updateRate))
      validationErrors.push(this.constructor.name + ' controller validation failure: updateRate must be an integer!');

    if (validationErrors.length > 0)
      throw validationErrors;

      this.updateRate = parseInt(updateRate);

    this.param = param ? param : {};
    // @todo ideas: alarm high, alarm low

    this.interval = {};
    this.runningState = 0;
  }

  update() {
    var newTemp = this.sensor.getValue();

    if (newTemp !== false) {
      this.sensor.lastRecord.temp     = this.sensor.currentRecord.temp;
      this.sensor.lastRecord.timestamp  = this.sensor.currentRecord.timestamp;
      this.sensor.currentRecord.temp    = newTemp;
      this.sensor.currentRecord.timestamp = new Date();
    
      if (this.sensor.lastRecord.temp != this.sensor.currentRecord.temp) {
        emitter.emit('controllerUpdate', this);
      }
    } else 
      this.stopControl();
  }

  startControl() {
    this.interval = setInterval(this.update.bind(this), this.updateRate);
    if (this.sensor)
      this.sensor.init();
    if (this.output)
      this.output.init();
    this.runningState = 1;
    return this.runningState;
  }

  stopControl() {
    clearInterval(this.interval);
    this.runningState = 0;
    logger.info('readonly.js: shutdown controller: ' + this.name);  
    return this.runningState;
  }
}

module.exports = ReadOnly;