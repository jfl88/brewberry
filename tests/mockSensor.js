module.exports = {
    lastCycle: (new Date()).getTime(),
    interval: 20000,
    temperatureSync: function(id) {
        return this.getTemp();
    },
    getTemp: function() {
        var currentCheck = (new Date()).getTime();
        var millisecondsSinceLastCheck = currentCheck - this.lastCycle;
        if (millisecondsSinceLastCheck > this.interval)
            this.lastCycle = currentCheck

        return (Math.random() + 20 + Math.sin(Math.PI * 2 * millisecondsSinceLastCheck/this.interval) * 2).toFixed(2);
    },
    sensors: function(cb) {
        cb(null, [0])
    }
}
