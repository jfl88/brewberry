const Sensor = require('../sensors/sensor');
const Output = require('../outputs/output');
const emitter = require('../emitter');
const logger = require('../logger');

class Controller {
  constructor(id, name, enabled, sensor, output, updateRate, param) {
    this.id = id;
    this.name = name;
    this.enabled = enabled;
    this.sensor = sensor;
    this.output = output;
    this.updateRate = parseInt(updateRate);
    this.param = param;
    this.interval = {};
    this.runningState = 0;
  }

  validateUpdateRate(updateRate) {
    if (isNaN(updateRate))
      return 'updateRate must be an integer!';
    return null;
  }

  update() {
    // Base implementation - override in subclasses
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
    logger.info(this.constructor.name + ': shutdown controller: ' + this.name);
    return this.runningState;
  }

  static newController(controller) {
    const Hysteresis = require('./hysteresis');
    const ReadOnly = require('./readonly');
    
    logger.debug('controller.js: \n%o', controller);
    switch (controller.model) {
      case 'ReadOnly':
        return new ReadOnly(controller.id, controller.name, controller.enabled, Sensor.newSensor(controller.sensor), controller.output, controller.updateRate, controller.param);
      case 'Hysteresis':
        return new Hysteresis(controller.id, controller.name, controller.enabled, Sensor.newSensor(controller.sensor), Output.newOutput(controller.output), controller.updateRate, controller.param);
      default:
        logger.error('controller.js: controller model ' + controller.model + ' does not exist');
        return undefined;
    }
  }
}

module.exports = Controller;