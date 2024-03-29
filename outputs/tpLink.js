const { Client } = require('tplink-smarthome-api');
const tplinkClient = new Client();
const logger = require('../logger');

class TPLink {
  constructor(id, name) {
    // standard members
    this.id = id;
    this.name = name;
    this.model = "TPLink";

    this.lastSwitched = 0;
    this.state = 0;
  }

  outputOn() {
    tplinkClient.getDevice({ host: this.id }).then((plug)=> {
      plug.setPowerState(true).then((result)=> {
        logger.info('tpLink.js: result: ' + result);
        if (result) {
          this.state = 1;
          this.lastSwitched = new Date().getTime();
        } else
          logger.info('tpLink.js: Failed to power switch on');
        
        return this.state;
      }).catch((error) => {
        logger.error('tpLink.js: Failed to turn on TPLink Switch');
        logger.error('tpLink.js: ' + error);
      })
    }).catch((error) => {
      logger.error('tpLink.js: Failed to Connect to TPLink Switch');
      logger.error('tpLink.js: ' + error);
    });
  }

  outputOff() {
    tplinkClient.getDevice({ host: this.id }).then((plug)=> {
      plug.setPowerState(false).then((result)=> {
        logger.info('tpLink.js: result: ' + result);
        if (result) {
          this.state = 0;
          this.lastSwitched = new Date().getTime();
        } else
          logger.error('tpLink.js: Failed to power switch off');
        
        return this.state;
      }).catch((error) => {
        logger.error('tpLink.js: Failed to turn off TPLink Switch');
        logger.error('tpLink.js: ' + error);
      })
    }).catch((error) => {
      logger.error('tpLink.js: Failed to Connect to TPLink Switch');
      logger.error('tpLink.js: ' + error);
    });
  }

  getStatus() {
    return { "id": this.id, "name": this.name, "model": this.model, "state": this.state, "lastSwitched": this.lastSwitched };
  }

  init() {
    tplinkClient.getDevice({ host: this.id }).then((plug)=> {
      plug.getPowerState().then((result)=> {
        if (result)
          this.state = 1;
        else
          this.state = 0;
        
        this.lastSwitched = new Date().getTime();
      })
    })
    .catch(error => {
      logger.error('tpLink.js: Error connecting to device');
      logger.error('tpLink.js: ' + error);
    });
  }
}

module.exports = TPLink;
