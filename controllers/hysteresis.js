const logger = require('../logger');

class Hysteresis {
    constructor(id, name, sensor, output, updateRate, param) {
        // standard members
        this.id = id;
        this.name = name;
        this.type = "Hysteresis";

        this.sensor = sensor;
        this.output = output;
        this.updateRate = updateRate;  // minimum update period in milliseconds

        this.param = param;
        //(for hysteresis: onTemp, offTemp, minOffTime)

        this.interval = {};
        this.runningState = 0;
    }

    update() {

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

module.exports = Hysteresis;