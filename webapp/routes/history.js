var express = require('express');
var router = express.Router();

// db stuff
var config = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://' + config.dbuser + ':' + config.dbpw + '@' + config.addr;

/* GET history page. */
router.get('/', function(req, res, next) {
  MongoClient.connect(url, function(err, db){
    db.collection('brews')
    .find(req.query)
    .sort({ startDT: -1 })
    .toArray(function(err, docs) {
      assert.equal(err, null);
      console.log("Found the following records");
      console.dir(docs)
      res.render('history', { title: 'Jason\'s Magical Brewing Land - Brew History', brews: docs });
    });      
  });
});

module.exports = router;
