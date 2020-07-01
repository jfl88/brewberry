var express = require('express');
var router = express.Router();

// db stuff
var config = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://' + config.db_user + ':' + config.db_pw + '@' + config.db_addr;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bellthorpe Brewing' });
});

router.route('/api/currentbrew')
  .get(function(req, res, next) {
    MongoClient.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client){
      client.db().collection('brews')
      .find({ complete: false })
      .toArray(function(err, docs) {
        assert.equal(err, null);
        res.json(docs);
        client.close();
      });      
    });
  });

  router.route('/api/getlogs/:from/:to')
  .get(function(req, res, next) {
    from = new Date(+req.params.from);
    to = new Date(+req.params.to);
    var results = [];
      MongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      }, function(err, client){
        client.db().collection('controllerLog')
        .find({
          timestamp: {
            $gte: from,
            $lte: to
          }
        })
        .sort({ timestamp: 1 })
        .toArray(function(err, docs) {
          assert.equal(err, null);
          config.controllers.forEach(function (controller, idx, ary) {
            controller.logs = [];
            docs.forEach(function(log) {
              if (log.id === controller.id)
                controller.logs.push(log);
            });
          results.push(controller);

          // finished grabbing controller logs, send response
          if (idx === ary.length - 1)
            res.json(results);
          
          client.close();
        });      
      });
    });
  });

router.route('/api/brews')
  .get(function(req, res, next) {
    MongoClient.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client){
      client.db().collection('brews')
      .aggregate(
        {
          $lookup: {
            from: "controllerLog",
            let: { brewStart: "$startDT", brewEnd: "$finishDT" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $gte: [ "$timestamp", "$$brewStart" ] },
                      { $lte: [ "$timestamp", "$$brewEnd" ]}
                    ]
                  }
                }
              }
            ],
            as: "newTempData"
          }
        }
      )
      .toArray(function(err, docs) {
        assert.equal(err, null);
        res.json(docs);
        client.close();
      });      
    });
  });

module.exports = router;
