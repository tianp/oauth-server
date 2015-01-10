(function() {

  /*
  * 8villages Profiling - /lib/mongodb.js
  *
  * Copyright (c) 2014 8villages, Inc - All Rights Reserved
  *
  * Unauthorized copying of this file, via any medium is strictly prohibited
  * Proprietary and confidential
  *
  * Written by Tian Permana <t.permana@8villages.com>, April 2014
  *
  * Last updated at August 12, 2014 by Tian Permana <t.permana@8villages.com>
  *
  */

  var mongo = require('mongoskin'),
    MongoClient = mongo.MongoClient

  module.exports = MongoClient.connect( process.env.OAUTH_MONGO_CONNECTION_STRING )

})()
