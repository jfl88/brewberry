module.exports = {
    lastCycle: (new Date()).getTime(),
    interval: 3600000,
    temperature: function(id, cb) {
        var currentCheck = (new Date()).getTime();
        var millisecondsSinceLastCheck = currentCheck - this.lastCycle;
        if (millisecondsSinceLastCheck > this.interval)
            this.lastCycle = currentCheck

        cb(this.getTemp());
    },
    temperatureSync: function(id) {
        return this.getTemp();
    },
    getTemp: function() {
        var currentCheck = (new Date()).getTime();
        var millisecondsSinceLastCheck = currentCheck - this.lastCycle;
        if (millisecondsSinceLastCheck > this.interval)
            this.lastCycle = currentCheck

        return 100 + Math.sin(Math.PI * 2 * millisecondsSinceLastCheck/this.interval) * 50;
    },
    sensors: function(cb) {
        cb(null, [0])
    }
}
