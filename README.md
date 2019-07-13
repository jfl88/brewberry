# Brewberry

It's a pun. It sounds like blueberry but it's brewberry.

Look at config.json.example for explanation of what you need to configure.  Save as config.json when you have filled in all the settings.

# UML
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
    (for hysteresis: onTemp, offTemp, minOffTime)
]
### Methods
* startControl
* stopControl 