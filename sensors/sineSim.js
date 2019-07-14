class SineSim {

    constructor (id, name) {
        // standard members
        this.id = id;
        this.name = name;
        this.model = "SineSim";
        this.units = "°C";

        this.lastRecord = {};
        this.currentRecord = {};

        // sineSim only
        this.lastCycle = (new Date()).getTime();
        this.interval = 50000 * Math.random();
    }

    getValue() {
        var randomnum = Math.random();
        var currentCheck = (new Date()).getTime();
        var millisecondsSinceLastCheck = currentCheck - this.lastCycle;
        if (millisecondsSinceLastCheck > this.interval)
            this.lastCycle = currentCheck
    
        if (randomnum > 0.5)
            return (randomnum + 20 + Math.sin(Math.PI * 2 * millisecondsSinceLastCheck/this.interval) * 2).toFixed(2);
        else
            return this.lastRecord.temp;
    }
}

module.exports = SineSim;
