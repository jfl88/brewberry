var sensor = require("./mockSensor");

function testSensor() {
    console.log(sensor.temperatureSync(0));
}

setInterval(testSensor, 1000)
