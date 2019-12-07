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
    MongoClient.connect(url, function(err, db){
      db.collection('brews')
      .find({ complete: false })
      .toArray(function(err, docs) {
        assert.equal(err, null);
        res.json(docs);
      });      
    });
  });

router.route('/api/getlogs')
  .get(function(req, res, next) {
    yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    var results = [];
      MongoClient.connect(url, function(err, db){
        db.collection('controllerLog')
        .find({
          timestamp: {
            $gte: yesterday
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
        });      
      });
    });
  });

router.route('/api/brews')
  .get(function(req, res, next) {
    MongoClient.connect(url, function(err, db){
      db.collection('brews')
      .find({})
      .toArray(function(err, docs) {
        assert.equal(err, null);
        res.json(docs);
      });      
    });
  });

module.exports = router;
