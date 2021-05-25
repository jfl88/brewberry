var express = require('express');
var router = express.Router();

// db stuff
var config = require('../../config.json');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const logger = require('../../logger');
var url = config.db_addr;



/* GET history page. */
router.get('/:page?', function(req, res, next) {
    const resPerPage = 5; // results per page
    const page = req.params.page || 1; // Page 

    MongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }, function(err, client){
        client.db().collection('brews')
        .countDocuments({}, function(err, count){
            client.db().collection('brews')
            .find(req.query)
            .sort({ startDT: -1 })
            .skip(page > 1 ? ((page - 1) * resPerPage) : 0)
            .limit(resPerPage)
            .toArray(function(err, docs) {
                assert.equal(err, null);
                logger.debug('history.js: Found ' + count + ' brews');
                res.render('history', { app_name: config.app_name, title: 'Brew History', brews: docs, page: page, numPages: Math.ceil(count / resPerPage) });
                client.close();
            });
        });
    });
});

module.exports = router;
