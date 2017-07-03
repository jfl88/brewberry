var ds18b20 = require('ds18b20');
var dblogin = require('./dblogin.json');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://' + dblogin.user + ':' + dblogin.pw + '@' + dblogin.addr;
var sensors = [];
var tempRec = {};

ds18b20.sensors(function(err, ids) {
  sensors = ids;
  console.log(sensors);

  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log('Connected successfully to server');

    var ts = new Date();
    var temp = ds18b20.temperatureSync(sensors[0]);

    tempRec = { timestamp: ts, temp: temp };
    db.collection('temps').insert(tempRec, function(err, result) {
      console.log('New Temp Inserted:' + JSON.stringify(result));
    });
    
    db.collection('brews').find({complete: false}).forEach(function (b) {
      b.tempData.push(tempRec);
      db.collection('brews').save(b);
    });

    setInterval(function() {
      ts = new Date();
      temp = ds18b20.temperatureSync(sensors[0]);
        
      if (temp !== tempRec.temp) { 
        tempRec = { timestamp: ts, temp: temp };
	console.log(JSON.stringify(tempRec));
        db.collection('temps').insert(tempRec, function(err, result) {
          assert.equal(null, err);
          console.log('New Temp Inserted:' + JSON.stringify(result));
        });
        db.collection('brews').find({complete: false}).forEach(function (b) {
          b.tempData.push(tempRec);
          db.collection('brews').save(b);
        });
      }
    }, 60000);
    
    // catch ctrl+c event and exit normally
    process.on('SIGINT', function () {
      console.log('Ctrl-C...');
      db.close();
      process.exit(2);
    });

  });
});

