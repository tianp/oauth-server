(function() {

  var db = require('./db'),
    moment = require('moment'),
    Utils = require('./utils')

  var Credentials = function() {

    db.bind( 'credentials' )
  }


  Credentials.prototype.findByCredentials = function( params, callback ) {

    var query  = {

      'appId': params.appId,
      'userId': params.userId,
      'cid': params.cid
    }

    db.credentials.findOne( query, callback )
  }

  Credentials.prototype.record = function( params, callback ) {

    var data = {
      'appId': params.appId,
      'userId': params.userId,
      'cid': params.cid,
      'accessType': params.accessType,
      'token': params.token,
      'dateSubmitted': {
        'timestamp': moment().unix(),
        'iso': moment().toISOString()
      }
    }

    db.credentials.insert( data, function ( error, result ) {

      if ( error ) {

        // code breaks

        callback( error )

        return
      }

      callback( null, result[0] )

    })

  }

  module.exports = Credentials

})()
