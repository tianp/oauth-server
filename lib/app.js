(function() {

  var db = require('./db'),
    moment = require('moment')

  var App = function() {

    db.bind( 'app' )
  }

  App.prototype.record = function( params, callback ) {

    var data = {
      'ownerId': params.ownerId,
      'cid': params.cid,
      'name': params.name,
      'description': params.description,
      'sourceUrl': params.sourceUrl,
      'organization': params.organization,
      'callbackUrl': params.callbackUrl,
      'type': params.type,
      'accessType': params.accessType,
      'consumer': params.consumer,
      'dateSubmitted': {
        'timestamp': moment().unix(),
        'iso': moment().toISOString()
      }
    }

    var options = { w: 1 } // write concern

    db.app.insert( data, options, function( error, result ) {

      if ( error ) {

        callback( error )

        return
      }

      callback( null, result[0] )

    })

  }

  App.prototype.findByConsumerKey = function( consumerKey, callback ) {

    var query = {
      'consumer.key': consumerKey
    }

    db.app.findOne( query, callback )
  }


  module.exports = App

})()
