const Hysteresis = require('./hysteresis');
const ReadOnly = require('./readonly');
const Sensor = require('../sensors/sensor');
const Output = require('../outputs/output');

class Controller {
    static newController(controller){
        console.log(controller);
        switch (controller.model){
            case 'ReadOnly':
              return new ReadOnly(controller.id, controller.name, Sensor.newSensor(controller.sensor), controller.output, controller.updateRate, controller.param);
            case 'Hysteresis':
              return new Hysteresis(controller.id, controller.name, Sensor.newSensor(controller.sensor), Output.newOutput(controller.output), controller.updateRate, controller.param);
            default:
              console.log("controller model does not exist");
              return undefined;
          }
    }
}

module.exports = Controller;