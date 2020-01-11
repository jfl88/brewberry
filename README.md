# Brewberry

It's a pun. It sounds like blueberry but it's brewberry.

Look at config.json.example for explanation of what you need to configure.  Save as config.json when you have filled in all the settings.

# Stuff to develop
## Short term
* add alerts to hysteresis controller
* add defaults to declaration of modules
* convert brew history graphs to chartJS
* graph zoom and pan
* move controller config to DB, interface for CRUD
* standardised error logger to bubble up errors from classes and log to DB

## Long term
* brew control, steps, etc. and CRUD interface

# Object Architecture
## Sensor
### Constructors
* Sensor (id, name)
### Properties
* id
* name
* model (eg. ds18b20, sineSim)
* units
* lastRecord { timestamp, temp }
* currentRecord { timestamp, temp }
### Methods
* getValue

## Switch
### Constructors

### Properties
* id
* name
* model
* state (0 - off, 1 - on)
* lastSwitched
### Methods
* switchOn
* switchOff
* getStatus

## Controller
### Constructors
### Properties
* name
* type (hysteresis, onoff, pwmpid)
* sensorid
* switchid
* updateRate
* param [ 
    { name: value }
    (for hysteresis: onTemp, offTemp, minOffTime, minOnTime)
]
### Methods
* startControl
* stopControl 
