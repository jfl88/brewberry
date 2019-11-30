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
        console.log("Found the following records");
        console.dir(docs)
        res.json(docs);
      });      
    });
  });

router.route('/api/getlogs')
  .get(function(req, res, next) {
    yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
  // add pulling the controller configuration and then adding temp history to it
    var results = [];
    config.controllers.forEach(function (controller) {
      MongoClient.connect(url, function(err, db){
        db.collection('controllerLog')
        .find({
          timestamp: {
            $gte: yesterday
          },
          id: controller.id
        })
        .sort({ timestamp: 1 })
        .toArray(function(err, docs) {
          assert.equal(err, null);
          controller.logs = docs;
        });      
      });

      results.push(controller);
    });

    res.json(results);
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
