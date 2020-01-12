var express = require('express');
var router = express.Router();
var basicAuth = require('basic-auth');

// db stuff
var dblogin = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var url = 'mongodb://' + dblogin.db_user + ':' + dblogin.db_pw + '@' + dblogin.db_addr;

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === dblogin.control_login && user.pass === dblogin.control_password) {
    return next();
  } else {
    return unauthorized(res);
  };
};

/* GET Show brew details for edit */
router.get('/brew/:brewid', auth, function(req, res, next) {
  console.log(req.params.brewid);
  MongoClient.connect(url, function(err, client){
    client.db().collection('brews')
    .findOne({ "_id": ObjectId(req.params.brewid)}, function(err, doc) {
      assert.equal(err, null);
      res.render('editbrew', { title: 'Jason\'s Magical Brewing Land - Brewing Control Centre', brew: doc });
      client.db().close();
    });      
  });
});

/* GET Show brew details for edit */
router.get('/brew', auth, function(req, res, next) {
  console.log(req.params.brewid);
  var newBrew = {
    name : '',
    recipeUrl : '',
    tempData : [],
    complete : false,
    startDT : '',
    finishDT : ''
  }
  res.render('editbrew', { title: 'Jason\'s Magical Brewing Land - Brewing Control Centre', brew: newBrew });
});

/* POST Handle update data */
router.post('/brew/:brewid', auth, function(req, res, next) {
  console.log(req.body);
  brewUpdate = { $set: {
      name: req.body.name,
      recipeUrl: req.body.recipeUrl,
      complete: (req.body.complete === 'on'),
      startDT: req.body.startDT,
      finishDT: req.body.finishDT
    } 
  } 

  MongoClient.connect(url, function(err, client){
    client.db().collection('brews')
    .findOneAndUpdate({ "_id": ObjectId(req.params.brewid)}, brewUpdate, { returnOriginal: false }, function(err, r){
      assert.equal(null, err);

      res.render('editbrew', { title: 'Jason\'s Magical Brewing Land - Brewing Control Centre', brew: r.value, update: true });
      client.db().close();
    });
  });
});

/* POST Handle update data */
router.post('/brew/', auth, function(req, res, next) {
  console.log(req.body);
  var newBrew = { 
    name: req.body.name,
    recipeUrl: req.body.recipeUrl,
    complete: (req.body.complete === 'on'),
    startDT: req.body.startDT,
    finishDT: req.body.finishDT
  } 

  MongoClient.connect(url, function(err, client){
    client.db().collection('brews')
    .insertOne(newBrew, function(err, r){
      assert.equal(null, err);

      res.render('editbrew', { title: 'Jason\'s Magical Brewing Land - Brewing Control Centre', brew: newBrew._id, update: true });
      client.db().close();
    });
  });
});

// example 'inserting' a subdocument
// use this for the annotations
//
// db.posts.update({ _id: ObjectId( "510a3c5382d395b70b000034" ) },
// {
//  $push: { comments: { "_id" : ObjectId( "..." ),
//  "authorId" : ObjectId( "..." ),
//  "content" : "",
//  "createdAt" : Date(...) } }
// })

module.exports = router;
