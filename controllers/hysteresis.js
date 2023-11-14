const emitter = require('../emitter');
const logger = require('../logger');

class Hysteresis {
  constructor(id, name, enabled, sensor, output, updateRate, param) {
    // standard members
    this.id = id;
    this.name = name;
    this.enabled = enabled;
    this.model = "Hysteresis";

    this.sensor = sensor;
    this.output = output;

    var validationErrors = [];
    if (isNaN(updateRate))
      validationErrors.push(this.constructor.name + ' controller validation failure: updateRate must be an integer!');

    for (const [ property, value ] of Object.entries(param))
      if (isNaN(value))
        validationErrors.push(this.constructor.name + ' controller validation failure: ' + property + ' must be a number!');

    if (validationErrors.length > 0)
      throw validationErrors;

    this.updateRate = parseInt(updateRate);  // minimum update period in milliseconds

    this.param = {};

    this.param.setpoint = parseFloat(param.setpoint);
    this.param.onDeadband = parseFloat(param.onDeadband);
    this.param.offDeadband = parseFloat(param.offDeadband);
    this.param.minOffTime = parseInt(param.minOffTime);
    this.param.minOnTime = parseInt(param.minOnTime);
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
        if (this.enabled)
          if (!this.output.state && this.sensor.currentRecord.temp > (this.param.setpoint + this.param.onDeadband) && (this.output.lastSwitched + this.param.minOffTime * 1000) < this.sensor.currentRecord.timestamp)
            this.output.outputOn();
          else if (this.output.state && this.sensor.currentRecord.temp < (this.param.setpoint + this.param.offDeadband) && (this.output.lastSwitched + this.param.minOnTime * 1000) < this.sensor.currentRecord.timestamp)
            this.output.outputOff();
        
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
    logger.info('hysteresis.js: shutdown controller: ' + this.name);  
    return this.runningState;
  }
}

module.exports = Hysteresis;