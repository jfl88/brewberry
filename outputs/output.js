const SimSwitch = require('./simswitch');

class Output {
    static newOutput(output){
        switch (output.model){
            case 'SimSwitch':
              return new SimSwitch(output.id, output.name);
            default:
              console.log("output model does not exist");
              return undefined;
          }
    }
}

module.exports = Output;