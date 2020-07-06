var express = require('express');
var router = express.Router();
var basicAuth = require('basic-auth');
const logger = require('../../logger');

// db stuff
var config = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var url = 'mongodb://' + config.db_user + ':' + config.db_pw + '@' + config.db_addr;

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === config.control_login && user.pass === config.control_password) {
    return next();
  } else {
    return unauthorized(res);
  }; 
};

// Display Control Panel page
router.get('/', auth, function(req, res, next){
  
  res.render('control', { title: 'Bellthorpe Brewing - Brewing Control Centre', controllers: config.controllers });
});

/* GET Show brew details for edit EXISTING brew */
router.get('/brew/:brewid', auth, function(req, res, next) {
  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function(err, client){
    client.db().collection('brews')
    .findOne({ "_id": ObjectId(req.params.brewid)}, function(err, doc) {
      assert.equal(err, null);
      res.render('editbrew', { title: 'Bellthorpe Brewing - Edit Brew', brew: doc });
      client.close();
    });      
  });
});

/* GET Show brew details for edit NEW brew */
router.get('/brew', auth, function(req, res, next) {
  var newBrew = {
    name : '',
    recipeUrl : '',
    tempData : [],
    complete : false,
    startDT : '',
    finishDT : ''
  }
  res.render('editbrew', { title: 'Bellthorpe Brewing - Create Brew', brew: newBrew });
});

router.get('/logs/:page?', auth, function(req, res, next) {
  const resPerPage = 25; // results per page
  const page = req.params.page || 1; // Page 

  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function(err, client){
    client.db().collection('log')
    .countDocuments({}, function(err, count){
      client.db().collection('log').find()
      .sort({ timestamp: -1 })
      .skip(page > 1 ? ((page - 1) * resPerPage) : 0)
      .limit(resPerPage)
      .toArray(function(err, docs) {
        assert.equal(err, null);
        logger.debug('history.js: Found ' + count + ' records');
        res.render('logs', { title: 'Bellthorpe Brewing - Logs', logs: docs, page: page, numPages: Math.ceil(count / resPerPage) });
        client.close();
      });
    })
  });
});

/* POST Handle update data for an EXISTING brew*/
router.post('/brew/:brewid', auth, function(req, res, next) {
  brewUpdate = { $set: {
      name: req.body.name,
      recipeUrl: req.body.recipeUrl,
      complete: (req.body.complete === 'on'),
      startDT: new Date(req.body.startDT),
      finishDT: new Date(req.body.finishDT)
    } 
  } 

  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function(err, client){
    client.db().collection('brews')
    .findOneAndUpdate({ "_id": ObjectId(req.params.brewid)}, brewUpdate, { returnOriginal: false }, function(err, r){
      assert.equal(null, err);

      res.render('editbrew', { title: 'Bellthorpe Brewing - Brewing Control Centre', brew: r.value, update: true });
      client.close();
    });
  });
});

/* POST Handle update data for a NEW brew */
router.post('/brew/', auth, function(req, res, next) {
  var newBrew = { 
    name: req.body.name,
    recipeUrl: req.body.recipeUrl,
    complete: (req.body.complete === 'on'),
    startDT: new Date(req.body.startDT),
    finishDT: null
  } 

  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function(err, client){
    client.db().collection('brews')
    .insertOne(newBrew, function(err, r){
      assert.equal(null, err);

      res.render('editbrew', { title: 'Bellthorpe Brewing - Brewing Control Centre', brew: newBrew._id, update: true });
      client.close();
    });
  });
});

module.exports = router;
