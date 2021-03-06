(function (){
    'use strict';

    window.dataColours = [
        'rgb(54, 162, 235)',
        'rgb(255, 99, 132)',
        'rgb(201, 203, 207)'
    ];

    window.outputColours = [
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)'
    ]

    window.setpointColours = [
        'rgb(255, 159, 64)',
        'rgb(153, 102, 255)'
    ]

    angular
        .module('brewtest', [])
        .controller('homeCtrl', ['$scope', '$http',
        function ($scope, $http) {

            var brewGraph = {};

            $scope.liveTemp = [];

            $http.get('/api/currentbrew').then(function success(resp) {
                $scope.currentBrew = resp.data[0];
            });

            // get socket config from the server, connect to socket server and create listeners
            $http.get('/init').then(function success(resp) {
                var socket_config = '//' + resp.data.socket_addr + ':' + resp.data.socket_port;
                $http.get('/api/getlogs/' + new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).getTime().toString() + '/' + new Date().getTime().toString()).then(function success(resp) {
                    var logs = resp.data
                    
                    $scope.brewData = {
                        datasets: [],
                    }

                    logs.forEach(function(controller, idx, ary) {

                        var dataset = {
                            label: controller.name + " " + controller.sensor.name,
                            fill: false,
                            pointRadius: 0,
                            backgroundColor: window.dataColours[idx % window.dataColours.length],
                            borderColor: window.dataColours[idx % window.dataColours.length],
                            yAxisID: 'y',
                            data: []
                        }

                        var outputset = {
                            label: controller.name + " " + controller.output.name,
                            fill: false,
                            pointRadius: 0,
                            backgroundColor: window.outputColours[idx % window.outputColours.length],
                            borderColor: window.outputColours[idx % window.outputColours.length],
                            yAxisID: 'y1',
                            steppedLine: true,
                            data: []
                        }

                        var setpoint = {
                            label: controller.name + " Setpoint",
                            fill: false,
                            pointRadius: 0,
                            backgroundColor: window.setpointColours[idx % window.setpointColours.length],
                            borderColor: window.setpointColours[idx % window.setpointColours.length],
                            yAxisID: 'y',
                            data: []
                        }

                        controller.logs.forEach(function (log, idx, ary) {
                            dataset.data.push({
                                x: luxon.DateTime.fromISO(log.timestamp),
                                y: log.sensorValue
                            })

                            if (controller.output)
                                outputset.data.push({
                                    x: luxon.DateTime.fromISO(log.timestamp),
                                    y: log.outputValue
                                })

                            if (controller.param.setpoint !== undefined)
                                setpoint.data.push({
                                    x: luxon.DateTime.fromISO(log.timestamp),
                                    y: log.param.setpoint
                            })

                            if (idx === ary.length - 1) {
                                controller.sensor.currentRecord = {};
                                controller.sensor.currentRecord.timestamp = log.timestamp;
                                controller.sensor.currentRecord.temp = log.sensorValue;

                                if (controller.output)
                                    controller.output.state = log.outputValue;
                            }
                        });
                        
                        $scope.brewData.datasets.push(dataset);
                        if (outputset.data.length > 0)
                            $scope.brewData.datasets.push(outputset);
                        
                        if (setpoint.data.length > 0)
                            $scope.brewData.datasets.push(setpoint);
                        
                        $scope.liveTemp.push(controller);
                    });

                    var chartConfig = {
                        type: 'line',
                        data: $scope.brewData,
                        options: {
                            plugins: {
                                zoom: {
                                    pan: {
                                        enabled: true,
                                        mode: 'xy',
                                        overScaleMode: 'y'
                                    }, 
                                    zoom: {
                                        wheel: {
                                            enabled: true
                                        }, 
                                        pinch: {
                                            enabled: true
                                        }, 
                                        mode: 'xy',
                                        overScaleMode: 'y'
                                    }
                                }
                            },
                            tooltips: {
                                // display all datapoints on tooltip
                                mode: 'label'
                            },
                            scales: {
                                x: {
                                    type: 'time',
                                    title: {
                                        display: true,
                                        text: 'Time'
                                    }
                                },
                                y:
                                {
                                    id: 'temp',
                                    title: {
                                        display: true,
                                        text: 'Temperature'
                                    }
                                },
                                y1:
                                {
                                    id: 'onoff',
                                    title: {
                                        display: true,
                                        text: 'State'
                                    },
                                    position: 'right',
                                    min: 0,
                                    ticks: {
                                        callback: function(value, index, values) {
                                            if (value % 1 === 0)
                                                if (value === 0)
                                                    return 'OFF';
                                                else
                                                    return 'ON';
                                        }
                                    }
                                }
                            }
                        }

                    }

                    var ctx = document.getElementById('brewGraph').getContext('2d');
                    brewGraph = new Chart(ctx, chartConfig)
                });

                var socket = io(socket_config);
                socket.on('connect', function () { console.log('connected!'); });
                socket.on('liveTemp', function(data) { 
                    if ($scope.brewData) {
                        if ($scope.brewData.datasets.length > 0) {
                            $scope.$apply(function () {
                                // for now update the 24 hour graph every time receiving a new 'live' temp
                                // put this in the new 'recordTemp' socket message once that's setup
                                var chartIndex = $scope.brewData.datasets.findIndex(function(element){
                                    return element.label === (data.name + " " + data.sensor.name);
                                });

                                $scope.brewData.datasets[chartIndex].data.push({ x: luxon.DateTime.fromISO(data.sensor.currentRecord.timestamp), y: data.sensor.currentRecord.temp })

                                if (data.output)
                                    $scope.brewData.datasets[chartIndex + 1].data.push({ x: luxon.DateTime.now(), y: data.output.state })

                                brewGraph.update();

                                chartIndex = $scope.liveTemp.findIndex(function (element) {
                                    return element.name === data.name;
                                });

                                $scope.liveTemp[chartIndex] = data;
                            });
                        }
                    }
                });
            });
        }
    ]);

    angular
        .module('brewtest')
        .controller('historyCtrl', ['$scope', '$http',
        function ($scope, $http) {
            var brewGraph = [];

            $scope.$watch('brews', function () {
                $scope.brews.forEach(function(brew){
                    $http.get('/api/getlogs/' + new Date(brew.startDT).getTime().toString() + '/' + (brew.complete ? new Date(brew.finishDT).getTime().toString() : new Date().getTime().toString())).then(function success(resp) {
                        var controllers = resp.data
                        var graphData = {
                            datasets: [],
                        }

                        controllers.forEach(function(controller, idx, ary) {
                            var dataset = {
                                label: controller.name + " " + controller.sensor.name,
                                fill: false,
                                pointRadius: 0,
                                backgroundColor: window.dataColours[idx % window.dataColours.length],
                                borderColor: window.dataColours[idx % window.dataColours.length],
                                yAxisID: 'y',
                                data: []
                            }

                            var outputset = {
                                label: controller.name + " " + controller.output.name,
                                fill: false,
                                pointRadius: 0,
                                backgroundColor: window.outputColours[idx % window.outputColours.length],
                                borderColor: window.outputColours[idx % window.outputColours.length],
                                yAxisID: 'y1',
                                steppedLine: true,
                                data: []
                            }

                            var setpoint = {
                                label: controller.name + " Setpoint",
                                fill: false,
                                pointRadius: 0,
                                backgroundColor: window.setpointColours[idx % window.setpointColours.length],
                                borderColor: window.setpointColours[idx % window.setpointColours.length],
                                yAxisID: 'y',
                                data: []
                            }

                            controller.logs.forEach(function (log, idx, ary) {
                                dataset.data.push({
                                    x: luxon.DateTime.fromISO(log.timestamp),
                                    y: log.sensorValue
                                })

                                if (controller.output)
                                    outputset.data.push({
                                        x: luxon.DateTime.fromISO(log.timestamp),
                                        y: log.outputValue
                                    })

                                if (controller.param.setpoint !== undefined)
                                    setpoint.data.push({
                                        x: luxon.DateTime.fromISO(log.timestamp),
                                        y: log.param.setpoint
                                })
                            });
                            
                            graphData.datasets.push(dataset);
                            if (outputset.data.length > 0)
                                graphData.datasets.push(outputset);
                            
                            if (setpoint.data.length > 0)
                                graphData.datasets.push(setpoint);
                        });

                        var chartConfig = {
                            type: 'line',
                            data: graphData,
                            options: {
                                plugins: {
                                    zoom: {
                                        pan: {
                                            enabled: true,
                                            mode: 'xy',
                                            overScaleMode: 'y'
                                        }, 
                                        zoom: {
                                            wheel: {
                                                enabled: true
                                            }, 
                                            pinch: {
                                                enabled: true
                                            }, 
                                            mode: 'xy',
                                            overScaleMode: 'y'
                                        }
                                    }
                                },
                                tooltips: {
                                    // display all datapoints on tooltip
                                    mode: 'label'
                                },
                                scales: {
                                    x: {
                                        type: 'time',
                                        title: {
                                            display: true,
                                            text: 'Time'
                                        }
                                    },
                                    y:
                                    {
                                        id: 'temp',
                                        title: {
                                            display: true,
                                            text: 'Temperature'
                                        }
                                    },
                                    y1:
                                    {
                                        id: 'onoff',
                                        title: {
                                            display: true,
                                            text: 'State'
                                        },
                                        position: 'right',
                                        min: 0,
                                        ticks: {
                                            callback: function(value, index, values) {
                                                if (value % 1 === 0)
                                                    if (value === 0)
                                                        return 'OFF';
                                                    else
                                                        return 'ON';
                                            }
                                        }
                                    }
                                }
                            }

                        }
                        
                        brewGraph.push(new Chart(document.getElementById(brew._id).getContext('2d'), chartConfig));
                    });
                });
            });
        }
    ]);
})();
