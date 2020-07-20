const Hysteresis = require('./hysteresis');
const ReadOnly = require('./readonly');
const Sensor = require('../sensors/sensor');
const Output = require('../outputs/output');
const logger = require('../logger');

class Controller {
  static newController(controller){
    logger.debug('controller.js: \n%o', controller);
    switch (controller.model){
      case 'ReadOnly':
        return new ReadOnly(controller.id, controller.name, controller.enabled, Sensor.newSensor(controller.sensor), controller.output, controller.updateRate, controller.param);
      case 'Hysteresis':
        return new Hysteresis(controller.id, controller.name, controller.enabled, Sensor.newSensor(controller.sensor), Output.newOutput(controller.output), controller.updateRate, controller.param);
      default:
        logger.error('controller.js: controller model' & controller.model & 'does not exist');
        return undefined;
    }
  }
}

module.exports = Controller;