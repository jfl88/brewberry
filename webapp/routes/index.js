var express = require('express');
var router = express.Router();

// db stuff
var dblogin = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://' + dblogin.db_user + ':' + dblogin.db_pw + '@' + dblogin.db_addr;

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

router.route('/api/gettemps')
.get(function(req, res, next) {
  yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));

  MongoClient.connect(url, function(err, db){
    db.collection('temps')
    .find({
      timestamp: {
        $gte: yesterday
      }
    })
    .toArray(function(err, docs) {
      assert.equal(err, null);
      console.log("Found the following records");
      console.dir(docs)
      res.json(docs);
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
        console.log("Found the following records");
        console.dir(docs)
        res.json(docs);
      });      
    });
  });

module.exports = router;
