const Controller = require('./controller');
const emitter = require('../emitter');
const logger = require('../logger');

class Hysteresis extends Controller {
  constructor(id, name, enabled, sensor, output, updateRate, param) {
    super(id, name, enabled, sensor, output, updateRate, param);
    this.model = "Hysteresis";

    var validationErrors = [];
    const updateRateError = this.validateUpdateRate(updateRate);
    if (updateRateError)
      validationErrors.push(this.constructor.name + ' controller validation failure: ' + updateRateError);

    // Check if using steps or single setpoint
    const hasSteps = Array.isArray(param.steps) && param.steps.length > 0;
    
    if (hasSteps) {
      // Validate steps array
      for (let i = 0; i < param.steps.length; i++) {
        const step = param.steps[i];
        if (isNaN(step.temperature))
          validationErrors.push(this.constructor.name + ' controller validation failure: step ' + i + ' temperature must be a number!');
        if (isNaN(step.duration))
          validationErrors.push(this.constructor.name + ' controller validation failure: step ' + i + ' duration must be a number!');
      }
      if (param.stepsCompleteState && (param.stepsCompleteState !== 'on' && param.stepsCompleteState !== 'off'))
        validationErrors.push(this.constructor.name + ' controller validation failure: stepsCompleteState must be "on" or "off"');
    } else {
      // Validate single setpoint parameters
      if (isNaN(param.setpoint))
        validationErrors.push(this.constructor.name + ' controller validation failure: setpoint must be a number!');
      if (isNaN(param.onDeadband))
        validationErrors.push(this.constructor.name + ' controller validation failure: onDeadband must be a number!');
      if (isNaN(param.offDeadband))
        validationErrors.push(this.constructor.name + ' controller validation failure: offDeadband must be a number!');
      if (isNaN(param.minOffTime))
        validationErrors.push(this.constructor.name + ' controller validation failure: minOffTime must be a number!');
      if (isNaN(param.minOnTime))
        validationErrors.push(this.constructor.name + ' controller validation failure: minOnTime must be a number!');
    }

    if (validationErrors.length > 0)
      throw validationErrors;

    // Initialize params based on mode
    if (hasSteps) {
      this.param = {};
      this.param.steps = [];
      for (let i = 0; i < param.steps.length; i++) {
        this.param.steps.push({
          temperature: parseFloat(param.steps[i].temperature),
          duration: parseInt(param.steps[i].duration)
        });
      }
      this.param.onDeadband = param.onDeadband ? parseFloat(param.onDeadband) : 0.5;
      this.param.offDeadband = param.offDeadband ? parseFloat(param.offDeadband) : 0.5;
      this.param.minOffTime = param.minOffTime ? parseInt(param.minOffTime) : 0;
      this.param.minOnTime = param.minOnTime ? parseInt(param.minOnTime) : 0;
      
      this.currentStepIndex = param.currentStepIndex || 0;
      this.stepStartTime = param.stepStartTime ? new Date(param.stepStartTime) : null;
      // set initial setpoint to current step temperature for visibility
      if (this.param.steps.length > 0)
        this.param.setpoint = this.param.steps[this.currentStepIndex].temperature;
      // configure stepsCompleteState ('on'|'off'), default 'off'
      this.param.stepsCompleteState = (param.stepsCompleteState === 'on') ? 'on' : 'off';
      // expose currentStepIndex and stepStartTime for views
      this.param.currentStepIndex = this.currentStepIndex;
      this.param.stepStartTime = this.stepStartTime;
    } else {
      this.param = {};
      this.param.setpoint = parseFloat(param.setpoint);
      this.param.onDeadband = parseFloat(param.onDeadband);
      this.param.offDeadband = parseFloat(param.offDeadband);
      this.param.minOffTime = parseInt(param.minOffTime);
      this.param.minOnTime = parseInt(param.minOnTime);
    }
  }

  getCurrentSetpoint() {
    if (this.param && Array.isArray(this.param.steps) && this.param.steps.length > 0) {
      if (this.currentStepIndex >= this.param.steps.length)
        return this.param.steps[this.param.steps.length - 1].temperature;
      return this.param.steps[this.currentStepIndex].temperature;
    }
    return this.param ? this.param.setpoint : null;
  }

  advanceStep() {
    if (Array.isArray(this.param.steps) && this.currentStepIndex < this.param.steps.length - 1) {
      this.currentStepIndex++;
      this.stepStartTime = new Date();
      // update visible setpoint to match new step
      this.param.setpoint = this.getCurrentSetpoint();
      // expose updated indices to param for views
      this.param.currentStepIndex = this.currentStepIndex;
      this.param.stepStartTime = this.stepStartTime;
      logger.info('hysteresis.js: ' + this.name + ' advanced to step ' + (this.currentStepIndex + 1) + 
        ' - temperature: ' + this.param.setpoint + '°C');
      emitter.emit('scheduleStepAdvanced', { controller: this.name, step: this.currentStepIndex + 1 });
      return true;
    }
    return false;
  }

  getProgress() {
    if (!Array.isArray(this.param.steps) || this.param.steps.length === 0)
      return null;

    if (!this.stepStartTime)
      return { currentStep: this.currentStepIndex, stepCount: this.param.steps.length, percentComplete: 0 };

    const elapsedTime = new Date() - this.stepStartTime;
    const stepDuration = this.param.steps[this.currentStepIndex].duration;
    const percent = Math.min(100, Math.round((elapsedTime / stepDuration) * 100));

    return {
      currentStep: this.currentStepIndex + 1,
      stepCount: this.param.steps.length,
      percentInStep: percent,
      currentSetpoint: this.getCurrentSetpoint(),
      stepStartTime: this.stepStartTime,
      stepEndTime: new Date(this.stepStartTime.getTime() + stepDuration)
    };
  }

  startControl() {
    // Initialize step tracking if using steps and not already set
    if (this.param && Array.isArray(this.param.steps) && this.param.steps.length > 0 && !this.stepStartTime) {
      this.currentStepIndex = 0;
      this.stepStartTime = new Date();
    }

    this.interval = setInterval(this.update.bind(this), this.updateRate);
    if (this.sensor)
      this.sensor.init();
    if (this.output)
      this.output.init();
    this.runningState = 1;
    return this.runningState;
  }

  update() {
    var newTemp = this.sensor.getValue();

    if (newTemp !== false) {
      this.sensor.lastRecord.temp = this.sensor.currentRecord.temp;
      this.sensor.lastRecord.timestamp = this.sensor.currentRecord.timestamp;
      this.sensor.currentRecord.temp = newTemp;
      this.sensor.currentRecord.timestamp = new Date();

      // Check if current step duration has elapsed
      if (this.param && Array.isArray(this.param.steps) && this.param.steps.length > 0 && this.stepStartTime) {
        var elapsedTime = this.sensor.currentRecord.timestamp - this.stepStartTime;
        if (elapsedTime >= this.param.steps[this.currentStepIndex].duration) {
          // if there is a next step, advance; otherwise mark the schedule complete and disable controller
          if (this.currentStepIndex < this.param.steps.length - 1) {
            this.advanceStep();
          } else {
            // final step complete
            this.param.stepsProgress = 100;
            this.stepStartTime = null;
            this.param.stepStartTime = null;
            // leave output in configured state
            if (this.param && this.param.stepsCompleteState === 'on') {
              if (this.output && typeof this.output.outputOn === 'function')
                this.output.outputOn();
            } else {
              if (this.output && typeof this.output.outputOff === 'function')
                this.output.outputOff();
            }
            this.enabled = false;
            logger.info('hysteresis.js: ' + this.name + ' completed final step; disabling controller and setting output to ' + (this.param && this.param.stepsCompleteState ? this.param.stepsCompleteState : 'off'));
            emitter.emit('scheduleComplete', { controller: this.name });
          }
        }
      }

      const currentSetpoint = this.getCurrentSetpoint();

      if (this.sensor.lastRecord.temp != this.sensor.currentRecord.temp) {
        if (this.enabled)
          if (!this.output.state && this.sensor.currentRecord.temp > (currentSetpoint + this.param.onDeadband) && (this.output.lastSwitched + this.param.minOffTime * 1000) < this.sensor.currentRecord.timestamp)
            this.output.outputOn();
          else if (this.output.state && this.sensor.currentRecord.temp < (currentSetpoint + this.param.offDeadband) && (this.output.lastSwitched + this.param.minOnTime * 1000) < this.sensor.currentRecord.timestamp)
            this.output.outputOff();

        // update steps progress param for views and emitter
        try {
          const prog = this.getProgress();
          if (prog && typeof prog.percentInStep === 'number') {
            if (!this.param) this.param = {};
            this.param.stepsProgress = prog.percentInStep;
          } else if (this.param && this.param.stepsProgress !== undefined) {
            delete this.param.stepsProgress;
          }
        } catch (e) {
          // ignore progress calc errors
        }

        emitter.emit('controllerUpdate', this);
      }
    } else {
      this.stopControl();
    }
  }
  
  stopControl() {
    clearInterval(this.interval);
    this.runningState = 0;
    logger.info('hysteresis.js: shutdown controller: ' + this.name);  
    return this.runningState;
  }
}

module.exports = Hysteresis;