const Hysteresis = require('./hysteresis');
const ReadOnly = require('./readonly');
const Sensor = require('../sensors/sensor');

class Controller {
    static newController(controller){
        switch (controller.model){
            case 'ReadOnly':
              return new ReadOnly(controller.id, controller.name, Sensor.newSensor(controller.sensor), controller.output, controller.updateRate, controller.param);
            case 'Hysteresis':
              return new Hysteresis(controller.id, controller.name, Sensor.newSensor(controller.sensor), controller.output, controller.updateRate, controller.param);
            default:
              console.log("controller model does not exist");
              return undefined;
          }
    }
}

module.exports = Controller;