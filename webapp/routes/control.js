var express = require('express');
var router = express.Router();
var basicAuth = require('basic-auth');
const logger = require('../../logger');
const emitter = require('../../emitter');

// db stuff
var config = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var url = config.db_addr;
var Controller = require('../../controllers/controller');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
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
  
  res.render('control', { app_name: config.app_name, title: 'Brewing Control Centre', controllers: config.controllers });
});

// ***** START LOGS PAGE ***** //

/* LOGS - GET EXISTING */
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
        logger.debug('control.js: Found ' + count + ' records');
        res.render('logs', { app_name: config.app_name, title: 'Logs', logs: docs, page: page, numPages: Math.ceil(count / resPerPage) });
        client.close();
      });
    })
  });
});
// ***** END LOGS PAGE ***** //

// ***** START BREW PAGE ***** //

// @todo combine the param/paramless route methods (like with controller)
/* BREW - GET EXISTING */
router.get('/brew/:brewid', auth, function(req, res, next) {
  MongoClient.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function(err, client){
    client.db().collection('brews')
    .findOne({ "_id": ObjectId(req.params.brewid)}, function(err, doc) {
      assert.equal(err, null);
      res.render('brew', { app_name: config.app_name, title: 'Edit Brew', brew: doc });
      client.close();
    });      
  });
});

/* BREW - GET NEW */
router.get('/brew', auth, function(req, res, next) {
  var newBrew = {
    name : '',
    recipeUrl : '',
    tempData : [],
    complete : false,
    startDT : new Date(), // setup brew with current datetime
    finishDT : ''
  }
  res.render('brew', { app_name: config.app_name, title: 'Create Brew', brew: newBrew });
});

/* BREW - EDIT EXISTING */
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

      res.render('brew', { app_name: config.app_name, title: 'Brewing Control Centre', brew: r.value, update: true });
      client.close();
    });
  });
});

/* BREW - CREATE NEW */
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

      res.render('brew', { app_name: config.app_name, title: 'Brewing Control Centre', brew: newBrew._id, update: true });
      client.close();
    });
  });
});

// ***** END BREW PAGE ***** //

// ***** START CTRLR PAGE ***** //

// @todo add controller templates depending on selected model (prob on client side)
/* GET controller page */
router.get('/ctrlr/:id?', auth, function(req, res, next) {
  if (!req.params.id || !ObjectId.isValid(req.params.id)) {
    var controller = {
      name: '',
      model: '',
      enabled: false,
      sensor: {},
      output: {},
      updateRate: 1000,
      param: []
    }
    res.render('controller', { app_name: config.app_name, title: 'New Controller', controller: controller });
  } else
    MongoClient.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client){
      client.db().collection('controllers')
      .findOne({ "_id": ObjectId(req.params.id)}, function(err, doc) {
        assert.equal(err, null);
        res.render('controller', { app_name: config.app_name, title: 'Edit Controller', controller: doc });
        client.close();
      });      
    });
});

// @todo add controller property validation
/* POST controller page */
router.post('/ctrlr/:id?', auth, function(req, res, next) {
  var submittedController = {
    id: req.body.id,
    name: req.body.name,
    model: req.body.model,
    enabled: req.body.enabled === 'on' ? true : false,
    sensor: req.body.sensor,
    output: req.body.output,
    updateRate: req.body.updateRate,
    param: req.body.param
  }

  try {
    controller = Controller.newController(submittedController);
  } catch (e) {
    logger.info('control.js: ' + JSON.stringify(e));
    res.render('controller', { app_name: config.app_name, title: 'Edit Controller', controller: submittedController, flashMsg: e });
    return;
  }
  
  if (!req.params.id || !ObjectId.isValid(req.params.id))
    MongoClient.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client){
      client.db().collection('controllers')
      .insertOne(controller, function(err, r){
        assert.equal(null, err);
    
        logger.info('control.js: Created controller: ' + controller.name + ', reloading controllers.');
        emitter.emit('controllerReload');
        res.render('controller', { app_name: config.app_name, title: 'Edit Controller', controller: controller });
        client.close();
      });
    });
  else
    MongoClient.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }, function(err, client){
      client.db().collection('controllers')
      .replaceOne({ "_id": ObjectId(req.params.id)}, controller, { returnOriginal: false }, function(err, r){
        assert.equal(null, err);
        
        controller._id = req.params.id;

        logger.info('control.js: Updated controller: ' + controller.name + ', reloading controllers.');
        emitter.emit('controllerReload');
        res.render('controller', { app_name: config.app_name, title: 'Edit Controller', controller: controller });
        client.close();
      });
    });
});

// ***** END CTRLR PAGE ***** //

module.exports = router;
