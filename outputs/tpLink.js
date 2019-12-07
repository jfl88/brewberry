const { Client } = require('tplink-smarthome-api');
const tplinkClient = new Client();

class TPLink {
    constructor(id, name) {
        // standard members
        this.id = id;
        this.name = name;
        this.model = "TPLink";

        this.lastSwitched = 0;
        this.state = 0;

        tplinkClient.getDevice({ host: this.id }).then((plug)=> {
            plug.getPowerState().then((result)=> {
                if (result)
                    this.state = 1;
                else
                    this.state = 0;
                
                this.lastSwitched = new Date().getTime();
            })
        });
    }

    outputOn() {
        tplinkClient.getDevice({ host: this.id }).then((plug)=> {
            plug.setPowerState(true).then((result)=> {
                console.log('result: ' + result);
                if (result) {
                    this.state = 1;
                    this.lastSwitched = new Date().getTime();
                } else
                    console.log('Failed to power switch on');
                
                return this.state;
            })
        });
    }

    outputOff() {
        tplinkClient.getDevice({ host: this.id }).then((plug)=> {
            plug.setPowerState(false).then((result)=> {
                console.log('result: ' + result);
                if (result) {
                    this.state = 0;
                    this.lastSwitched = new Date().getTime();
                } else
                    console.log('Failed to power switch off');
                
                return this.state;
            })
        });
    }

    getStatus() {
        return { "id": this.id, "name": this.name, "model": this.model, "state": this.state, "lastSwitched": this.lastSwitched };
    }
}

module.exports = TPLink;
