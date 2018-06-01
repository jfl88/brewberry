const MongoClient = require('mongodb').MongoClient;

var database;

module.exports = function(logger) {
  MongoClient.connect(mongoConnectionString, function(err, db) {
    if (err)
      logger.log("Error connecting to mongodb: " + JSON.stringify(err));
    database = db;
  });
  return {
    saveRecord: function(record) {
      database.collection('temps').insert(record, (err, result) => {
        if (err)
          logger.log('Error writing to temps collections: ' + err.message)
        logger.log('New Temp Inserted:' + JSON.stringify(result));
      });
      database.collection('brews').find({complete: false}).forEach((brew)  => {
        brew.tempData.push(record);
        database.collection('brews').save(brew);
      });
    },
    close: function() {
      this.db.close();
    }
  }
};
