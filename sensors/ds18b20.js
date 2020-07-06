const sensorLibrary = require('ds18b20');
const logger = require('../logger');

class ds18b20 {

    constructor (id, name) {
        // standard members
        this.id = id;
        this.name = name;
        this.model = "ds18b20";
        this.units = "°C";

        this.lastRecord = {};
        this.currentRecord = {};

        // ds18b20 only
    }

    getValue() {
        try {
            return sensorLibrary.temperatureSync(this.id);
        } catch (err) {
            logger.error('ds18b20.js: ' + err);
            return false;
        }
    }
}

module.exports = ds18b20;