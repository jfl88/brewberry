var express = require('express');
var router = express.Router();

// db stuff
var dblogin = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://' + dblogin.db_user + ':' + dblogin.db_pw + '@' + dblogin.db_addr;



/* GET history page. */
router.get('/', function(req, res, next) {
  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function(err, client){
    client.db().collection('brews')
    .find(req.query)
    .sort({ startDT: -1 })
    .toArray(function(err, docs) {
      assert.equal(err, null);
      console.log("Found the following records");
      console.dir(docs)
      res.render('history', { title: 'Bellthorpe Brewing - Brew History', brews: docs });
      client.close();
    });      
  });
});

module.exports = router;
