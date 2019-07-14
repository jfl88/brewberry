const logger = require('../logger');

class NoControl {
    constructor(id, name, sensor, output, updateRate, param) {
        // standard members
        this.id = id;
        this.name = name;
        this.type = "NoControl";

        this.sensor = sensor;
        this.output = output;
        this.updateRate = updateRate;  // minimum update period in milliseconds

        this.param = param;
        //(for nocontrol: nothing)

        this.interval = {};
        this.runningState = 0;
    }

    update() {
        this.sensor.lastRecord.temp         = this.sensor.currentRecord.temp;
        this.sensor.lastRecord.timestamp    = this.sensor.currentRecord.timestamp;
        this.sensor.currentRecord.temp      = this.sensor.getValue();
        this.sensor.currentRecord.timestamp = (new Date()).getTime();
      
        if (this.sensor.lastRecord.temp != this.sensor.currentRecord.temp) {
            logger.emit('controllerUpdate', this.name, this.sensor);
        }
    }

    startControl() {
        this.interval = setInterval(this.update.bind(this), this.updateRate);
        this.runningState = 1;
        return this.runningState;
    }

    stopControl() {
        clearInterval(this.interval);
        this.runningState = 0;
        return this.runningState;
    }
}

module.exports = NoControl;