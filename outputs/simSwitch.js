class SimSwitch {
    constructor(id, name) {
        // standard members
        this.id = id;
        this.name = name;
        this.model = "SimSwitch";

        this.lastSwitched = 0;
        this.state = 0;
    }

    outputOn() {
        this.state = 1;
        this.lastSwitched = new Date().getTime();
        return this.state;
    }

    outputOff() {
        this.state = 0;
        this.lastSwitched = new Date().getTime();
        return this.state;
    }

    getStatus() {
        return { "state": this.state, "lastSwitched": this.lastSwitched };
    }

    init() {
        
    }
}

module.exports = SimSwitch;
