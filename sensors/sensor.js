const SineSim = require('./sineSim');
const ds18b20 = require('./ds18b20');
const logger = require('../logger');

class Sensor {
    static newSensor(sensor){
        switch (sensor.model){
            case 'SineSim':
              return new SineSim(sensor.id, sensor.name);
            case 'ds18b20':
              return new ds18b20(sensor.id, sensor.name);
            default:
              logger.error("sensor.js: sensor model does not exist");
              return undefined;
          }
    }
}

module.exports = Sensor;