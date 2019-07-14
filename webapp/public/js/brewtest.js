(function (){
    'use strict';

    angular
        .module('brewtest', ['nvd3'])
        .controller('homeCtrl', ['$scope', '$http',
        function ($scope, $http) {
            $scope.brewData = [];

            $scope.liveTemp = [{},{}];

            $http.get('/api/currentbrew').then(function success(resp) {
                $scope.currentBrew = resp.data[0];
            });

            $http.get('/api/gettemps').then(function success(resp) {
                $scope.temps = resp.data
    
                var layout = {
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
    
                /* $scope.temps.forEach(function(record) {
                    if (new Date(record.timestamp) > new Date(new Date().getTime() - (24 * 60 * 60 * 1000))) {
                        $scope.brewData[0].x.push(new Date(record.timestamp));
                        $scope.brewData[0].y.push(record.temp);
                    }
                }); */  

                Plotly.newPlot('brewGraph', $scope.brewData, layout, { displaylogo: false });
            });

            // get socket config from the server, connect to socket server and create listeners
            $http.get('/init').then(function success(resp) {
                var socket_config = '//' + resp.data.socket_addr + ':' + resp.data.socket_port;
            
                resp.data.controllers.forEach(function(controller) {
                    $scope.brewData.push({
                        x: [],
                        y: [],
                        type: 'scatter',
                        name: controller.name,
                    });
                });
                

                console.log($scope.brewData);

                var socket = io(socket_config);
                socket.on('connect', function () { console.log('connected!'); });
                socket.on('liveTemp', function(data) { 
                    console.log(data);

                    $scope.$apply(function () {
                        // for now update the 24 hour graph every time receiving a new 'live' temp
                        // put this in the new 'recordTemp' socket message once that's setup
                        var chartIndex = $scope.brewData.findIndex(function(element){
                            return element.name === data.name;
                        });
                        $scope.liveTemp[chartIndex] = data;

                        Plotly.extendTraces('brewGraph', { y: [[ data.sensor.currentRecord.temp ]], x: [[ new Date(data.sensor.currentRecord.timestamp) ]] }, [chartIndex]);
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
