const SimSwitch = require('./simSwitch');
const TPLink = require('./tpLink');
const logger = require('../logger');

class Output {
    static newOutput(output){
        switch (output.model){
            case 'SimSwitch':
              return new SimSwitch(output.id, output.name);
            case 'TPLink':
              return new TPLink(output.id, output.name);
            default:
              logger.error('output.js: output model does not exist');
              return undefined;
          }
    }
}

module.exports = Output;