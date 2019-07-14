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
        return this.state;
    }

    outputOff() {
        this.state = 0;
        return this.state;
    }

    getStatus() {
        return { "state": this.state, "lastSwitched": this.lastSwitched };
    }
}

module.exports = SimSwitch;
