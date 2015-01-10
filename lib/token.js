(function() {

  var db = require('./db'),
    moment = require('moment'),
    App = require('./app'),
    Credentials = require('./credentials')


  var Token = function() {

    db.bind( 'tokens' )
    db.bind( 'credentials' )
  }


  Token.prototype.findByToken = function( token, callback ) {

    var query = {
      'token.key': token,
    }

    db.tokens.findOne( query, callback )
  }


  Token.prototype.findCredentialsByToken = function( token, callback ) {

    this.findByToken( token, function( error, tokenInfo ) {

      if ( error ) {

        // code breaks

        callback( error )

        return
      }

      if ( !tokenInfo ) {

        callback( {'code': 'invalid-token', 'message': 'Token is invalid' })

        return
      }

      var app = new App()

      app.findByConsumerKey( tokenInfo.consumerKey, function( error, appInfo ) {

        if ( error ) {

          callback( error )

          return
        }


        if ( !appInfo ) {

          callback( {'code': 'app-not-found', 'message': 'Application info is not found' })

          return
        }

        var query  = {
          'token.key': token,
        }

        db.credentials.findOne( query, function ( error, credential ) {

          if ( error ) {

            // code breaks

            callback( error )

            return
          }

          if ( !credential ) {

            callback( {'code': 'credential-not-found', 'message': 'Credential info not found' })

            return
          }

          var result = {
            'cid' : appInfo.cid,
            'userId' : credential.userId,
            'consumerKey' : appInfo.consumer.key,
            'consumerSecret' : appInfo.consumer.secret,
            'appId' : appInfo._id,
            'appName' : appInfo.name,
            'accessType' : appInfo.accessType,
            'token' : tokenInfo.token,
            'tokenSecret' : tokenInfo.tokenSecret,
            'verifier' : tokenInfo.verifier,
            'callbackUrl' : appInfo.callbackUrl
          }

          callback( null, result )

        })

      })

    })


  }

  Token.prototype.recordRequestToken = function( params, callback ) {

    var self = this,
      app = new App()

    app.findByConsumerKey( params.consumerKey, function ( error, appInfo ) {

      if ( error ) {

        // code breaks

        callback( error )

        return
      }

      var tokenData = {
        'consumerKey': params.consumerKey,
        'token': {
          'key': params.token,
          'secret': params.tokenSecret,
          'verifier': params.tokenVerifier
        },
        'type': 'requestToken'
      }

      var options = { w: 1 }

      db.tokens.insert( tokenData, options, function ( error, result ) {

        if ( error ) {

          // code breaks

          callback( error )

          return
        }

        callback( null, result[0] )

      })

    })

  }


  Token.prototype.recordAccessToken = function( params, callback ) {


    var data = {
      'consumerKey': params.consumerKey,
      'token': {
        'key': params.token,
        'secret': params.tokenSecret,
        'verifier': params.tokenVerifier
      },
      'type': 'accessToken',
      'userId': params.userId,
      'appId': params.appId,
      'dateSubmitted': {
        'timestamp': moment().unix(),
        'iso': moment().toISOString()
      }
    }

    db.tokens.insert( data, function ( error, result ) {

      if ( error ) {

        callback( error )

        return
      }

      callback( null, result )

    })

	}

  module.exports = Token

})()
