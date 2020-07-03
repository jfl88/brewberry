const emitter = require('../emitter');

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
        // ideas: alarm high, alarm low

        this.interval = {};
        this.runningState = 0;
    }

    update() {
        var newTemp = this.sensor.getValue();

        if (newTemp !== false) {
            this.sensor.lastRecord.temp         = this.sensor.currentRecord.temp;
            this.sensor.lastRecord.timestamp    = this.sensor.currentRecord.timestamp;
            this.sensor.currentRecord.temp      = newTemp;
            this.sensor.currentRecord.timestamp = new Date();
        
            if (this.sensor.lastRecord.temp != this.sensor.currentRecord.temp) {
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