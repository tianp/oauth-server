(function() {

  var _ = require('underscore'),
    moment = require('moment'),
    Utils = require('./lib/utils'),
    Token = require('./lib/token'),
    App = require('./lib/app'),
    Credentials = require('./lib/credentials')


  var OAuth = function() {

    //_.extend( this, new Credentials() )

  }

  OAuth.prototype.requestToken = function( request, callback ) {

    // check the request headers, whether it has authorization key or not
    if ( !request.headers.authorization ) {

      callback({ 'code': 'Missing authorization headers' })

      return
    }

    var utils = new Utils()

    utils.checkConsumerInfo( request, function ( error, params, consumer ) {

      if ( error ) {

        // code breaks

        callback( error )

        return
      }

      utils.generateRequestToken( params, consumer, 'sha256', function ( error, requestToken ) {

        if ( error ) {

          // code breaks

          callback( error )

          return
        }

        var Tokens = new Token()

        Tokens.recordRequestToken({

          'consumerKey': consumer.key,
          'token': requestToken.key,
          'tokenSecret': requestToken.secret,
          'tokenVerifier': requestToken.verifier

        }, function ( error, result ) {

          if ( error ) {

             // code breaks

            return
          }

          var requestTokenResult = 'oauth_token='+ requestToken.key + '&oauth_token_secret=' +requestToken.secret+ '&oauth_verifier='+requestToken.verifier+'&oauth_callback_confirmed=true'

          callback( null, requestTokenResult )

        })

      })


    })

  }


  OAuth.prototype.recordAccessToken = function( appInfo, userInfo, done ) {

    var utils = new Utils()

    var accessTokenParams = {

      consumerSecret: appInfo.consumerSecret,
      tokenSecret: appInfo.tokenSecret,
      callbackUrl: appInfo.callbackUrl
    }

    utils.generateAccessToken( accessTokenParams, 'sha256', function ( error, token ) {

      if ( error ) {

        // code breaks

        done( error )

        return
      }

      var Tokens = new Token()

      var data = {
        'consumerKey': appInfo.consumerKey,
        'token': token.key,
        'type': 'accessToken',
        'tokenSecret': token.secret,
        'tokenVerifier': appInfo.verifier,
        'userId': userInfo.id,
        'appId': appInfo.appId
      }

      Tokens.recordAccessToken( data, function ( error, result ) {

        if ( error ) {

          // code breaks
          done( error )

          return
        }

        // do something here
        var user = new Credentials()

        var userData = {
          'cid': appInfo.cid,
          'userId': userInfo.id,
          'appId': appInfo.appId.toString(),
          'accessType': '0',
          'token': token,
          'dateSubmitted': {
            'timestamp': moment().unix(),
            'iso': moment().toISOString()
          }
        }

        user.record( userData, function ( error, result ) {

          if ( error ) {

            // code breaks

            done( error )

            return
          }

          done( null, token )

        })

      })

    })

  }

  OAuth.prototype.recordCredentials = function( appInfo, userId, accessToken, done ){

    var user = new Credentials()

    var userData = {
      'cid': appInfo.cid,
      'userId': userId,
      'appId': appInfo.appId.toString(),
      'accessType': '0',
      'token': accessToken,
      'dateSubmitted': {
        'timestamp': moment().unix(),
        'iso': moment().toISOString()
      }
    }

    user.record( userData, function ( error, result ) {

      if ( error ) {

        // code breaks

        done( error )

        return
      }

      done( null, result )

    })

  }

  OAuth.prototype.checkAccessToken = function( request, callback ) {

    var utils = new Utils()

    utils.checkAccessToken( request, callback )

  }

  OAuth.prototype.findAppByToken = function( token, callback ) {

    var Tokens = new Token()

    Tokens.findByToken( token, function( error, tokenInfo ) {

      if ( error ) {

        // code breaks

        callback( error )

        return
      }

      if ( !tokenInfo ) {

        callback( null, null )

        return
      }

      var app = new App()

      app.findByConsumerKey( tokenInfo.consumerKey, function( error, appInfo ) {

        if ( error ) {

          callback( error )

          return
        }

        if ( !appInfo ) {

          callback( null, null )

          return
        }

        var result = {

          'cid' : appInfo.cid,
          'consumerKey' : appInfo.consumer.key,
          'consumerSecret' : appInfo.consumer.secret,
          'appId' : appInfo._id,
          'appName' : appInfo.name,
          'accessType' : appInfo.accessType,
          'token' : tokenInfo.token.key,
          'tokenSecret' : tokenInfo.token.secret,
          'verifier' : tokenInfo.token.verifier,
          'callbackUrl' : appInfo.callbackUrl
        }

        callback( null, result )

      })

    })

  }

  OAuth.prototype.createApp = function( params, done ) {

    var data = {
      'ownerId': params.ownerId,
      'cid': params.cid,
      'name': params.name,
      'description': params.description,
      'sourceUrl': params.sourceUrl,
      'organization': params.organization,
      'callbackUrl': params.callbackUrl,
      'type': params.type,
      'accessType': params.accessType
    }

    var utils = new Utils()

    data.consumer = utils.generateConsumer()


    var app = new App()

    app.record( data, function ( error, result ) {

      if ( error ) {

        done( error )

        return
      }

       done( null, result )

    })

  }

  OAuth.prototype.findByCredentials = function( params, done ) {

    var credentials = new Credentials()

    credentials.findByCredentials( params, done )

  }


  module.exports = OAuth

})()
