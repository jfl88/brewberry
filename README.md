# Brewberry

It's a pun. It sounds like blueberry but it's brewberry.

Look at config.json.example for explanation of what you need to configure.  Save as config.json when you have filled in all the settings.

# UML
## Sensor
id
name
model (ds18b20, sineSim)
units

getValue

## Switch
id
name
model
lastSwitched

switchOn
switchOff
getStatus

## Controller
name
type (hysteresis, onoff, pwmpid)
sensorid
switchid
updateRate
param [ 
    { name: value }
    (for hysteresis: onTemp, offTemp, minOffTime)
]

startControl
stopControl 