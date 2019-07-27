(function (){
    'use strict';

    angular
        .module('brewtest', ['nvd3'])
        .controller('homeCtrl', ['$scope', '$http',
        function ($scope, $http) {
            $scope.brewData = [];

            var layout = {
                showlegend: false,
                xaxis: { title: 'Date / Time', type: 'date' },
                yaxis: { title: 'Temperature (°C)', nticks: 10 },
                yaxis2: {
                    title: 'Output Status',
                    nticks: 2,
                    range: [ 0, 1 ],
                    overlaying: 'y',
                    side: 'right'
                },
                margin: {
                    l: 50,
                    r: 50,
                    b: 50,
                    t: 50,
                    pad: 4
                }
            };

            $scope.liveTemp = [];

            $http.get('/api/currentbrew').then(function success(resp) {
                $scope.currentBrew = resp.data[0];
            });

            // get socket config from the server, connect to socket server and create listeners
            $http.get('/init').then(function success(resp) {
                var socket_config = '//' + resp.data.socket_addr + ':' + resp.data.socket_port;
                
                $http.get('/api/getlogs').then(function success(resp) {
                    $scope.logs = resp.data
                    
                    $scope.logs.forEach(function(controller) {
                        var timestamps = [], sensorValues = [], outputValues = [];

                        controller.logs.forEach(function (log) {
                            timestamps.push(new Date(log.timestamp));
                            sensorValues.push(log.sensorValue);
                            outputValues.push(log.outputValue);
                        });
                        
                        $scope.brewData.push({
                            x: timestamps,
                            y: sensorValues,
                            type: 'scatter',
                            name: controller.name + " " + controller.sensor.name,
                        });
    
                        if (controller.output)
                            $scope.brewData.push({
                                x: timestamps,
                                y: outputValues,
                                type: 'scatter',
                                yaxis: 'y2',
                                name: controller.name + " " + controller.output.name,
                        });
                        
                        $scope.liveTemp.push(controller);
                    });

                    Plotly.newPlot('brewGraph', $scope.brewData, layout, { displaylogo: false, responsive: true });
                });

                console.log($scope.brewData);

                var socket = io(socket_config);
                socket.on('connect', function () { console.log('connected!'); });
                socket.on('liveTemp', function(data) { 
                    if ($scope.brewData.length > 0)
                        $scope.$apply(function () {
                            // for now update the 24 hour graph every time receiving a new 'live' temp
                            // put this in the new 'recordTemp' socket message once that's setup
                            var chartIndex = $scope.brewData.findIndex(function(element){
                                return element.name === (data.name + " " + data.sensor.name);
                            });
                            $scope.liveTemp[chartIndex] = data;

                            Plotly.extendTraces('brewGraph', { y: [[ data.sensor.currentRecord.temp ]], x: [[ new Date(data.sensor.currentRecord.timestamp) ]] }, [chartIndex]);

                            if (data.output)
                                Plotly.extendTraces('brewGraph', { y: [[ data.output.state ]], x: [[ new Date() ]] }, [chartIndex + 1]);
                        });
                });
            });
        }
    ]);

    angular
        .module('brewtest')
        .controller('historyCtrl', ['$scope', '$http',
        function ($scope, $http) {
            $http.get('/api/brews/').then(function success(resp) {
                console.log(resp.data);
                $scope.brews = resp.data;
                $scope.brews.forEach(function (brew) {
                    brew.graph = [{
                        x: [],
                        y: [],
                        type: 'scatter'
                    }];

                    brew.layout = {
                        showlegend: false,
                        xaxis: { title: 'Date / Time', type: 'date' },
                        yaxis: { title: 'Temperature (°C)', nticks: 10 },
                        margin: {
                            l: 50,
                            r: 50,
                            b: 50,
                            t: 50,
                            pad: 4
                        }
                    };

                    brew.tempData.forEach(function(record) {
                        brew.graph[0].x.push(new Date(record.timestamp));
                        brew.graph[0].y.push(record.temp);
                    });

                    Plotly.newPlot(brew._id, brew.graph, brew.layout, { displaylogo: false });
                });
            });

        }
    ]);
})();
