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

        this.runningState = 0;
    }

    update() {

    }

    startControl() {
        this.runningState = 1;
        return this.runningState;
    }

    stopControl() {
        this.runningState = 0;
        return this.runningState;
    }
}

module.exports = Hysteresis;