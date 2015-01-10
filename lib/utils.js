(function() {

  var url = require('url'),
    crypto = require('crypto'),
    _ = require( 'underscore' ),
    phpjs = require( 'phpjs' ),
    App = require('./app'),
    Token = require('./token')

  var Utils = function() {}

  Utils.prototype.checkConsumerInfo = function( request, callback ) {

    var log = {}

		// get the authtorization info from the request headers
		var auth = request.headers.authorization

    log.authorization = request.headers.authorization

		// we split the authorization information by a space (' ')
		// why? becuase the auth information in the headers usually look like this:

		// OAuth oauth_callback="http%3A%2F%2Flocalhost%",oauth_consumer_key="didadaku-key",oauth_nonce="HrJhb9BQDFvJ0J5OZ4yJXLE03rr0K1yP",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1353506121",oauth_version="1.0",oauth_signature="04rfnF3lk8iH%2B1osqvIp4luvL8E%3D"

		// so we split the OAuth string and the OAuth information

		var oauth = auth.split( ',' )


    //var oauthParams = auth.split(' ')

    //oauthParams = oauthParams[1].split(',')

    var oa_word = oauth[0].split(' ')

		if ( oa_word[0] === 'OAuth' ) {

			// condition when the authorization information is right
			// parse the param so that we get the clear array based on the auth information

			var params = []
			var parsedParams = []

      var x = oa_word[1].replace(/\"/g, '' ).split('=')

			if ( x[0] != "realm" ) {

				parsedParams.push([ x[0], x[1] ])

				params[ x[0] ] = x[1]

			}

      for ( var i in oauth ) {

				if ( i != 0 ) {

					var y = oauth[i].trim().replace(/\"/g, '' ).split('=')
					var z = [ y[0], y[1]]

					params[ y[0] ] = y[1]


					parsedParams.push([ z[0], z[1] ])


				}
			}


			parsedParams = this.sortParams( parsedParams )

      log.parsedParams = parsedParams

			// here we check the given consumer key, whether the its recorded on our database or not

			var self = this,
        consumerKey = params.oauth_consumer_key,
				signature = params.oauth_signature

			var app = new App()

			app.findByConsumerKey( consumerKey, function( error, appInfo ) {

        if ( error ) {

          callback( error )

          return
        }

        if ( !appInfo ) {

          callback({ 'code': 'Consumer Key Invalid' })

          return
        }

        var requestProtocol =  'http://'

        if ( process.env.PROTOCOL ) {

          requestProtocol = process.env.PROTOCOL + '://'
        }

        var requesterUrl = requestProtocol + request.headers.host +  url.parse( request.url ).pathname

        log.requesterUrl = requesterUrl

        var baseString = self.createBaseString( request.method, requesterUrl, parsedParams )

        log.baseString = baseString

        var signedSignature = self.signParams( baseString, appInfo.consumer.secret + '&' )

        var signatureCheck = self.encodeData( signedSignature )

        log.receivedSignature = signature
        log.encodedSignature = signatureCheck

        if ( signature === signatureCheck ) {

          callback( null, params, appInfo.consumer )

        }
        else {

          callback({ 'code': 'Signature invalid', log: log })
        }

			})

		}
		else {

      callback( 'missing authorization header' )
		}


	}

  Utils.prototype.checkAccessToken = function( request, callback ) {

    var sessID = request.sessionID, self = this, log = {}

		if ( _.isUndefined( request.headers.authorization )) {

      callback({ message : 'Missing authorization headers' })

			return
		}

  // get the authtorization info from the request headers
  var auth = request.headers.authorization

  log.authorization = request.headers.authorization

  // we split the authorization information by a space (' ')
  // why? becuase the auth information in the headers usually look like this:

  // OAuth oauth_callback="http%3A%2F%2Flocalhost%",oauth_consumer_key="didadaku-key",oauth_nonce="HrJhb9BQDFvJ0J5OZ4yJXLE03rr0K1yP",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1353506121",oauth_version="1.0",oauth_signature="04rfnF3lk8iH%2B1osqvIp4luvL8E%3D"

  // so we split the OAuth string and the OAuth information

 var oauth = auth.split( ',' )


 //var oauthParams = auth.split(' ')

 //oauthParams = oauthParams[1].split(',')

 var oa_word = oauth[0].split(' ')

    if ( oa_word[0] === 'OAuth' ) {

     // condition when the authorization information is right
     // parse the param so that we get the clear array based on the auth information

     var params = []
     var parsedParams = []

     var x = oa_word[1].replace(/\"/g, '' ).split('=')

     if ( x[0] != "realm" ) {

       parsedParams.push([ x[0], x[1] ])

       params[ x[0] ] = x[1]

     }

     for ( var i in oauth ) {

       if ( i != 0 ) {

         var y = oauth[i].trim().replace(/\"/g, '' ).split('=')
         var z = [ y[0], y[1]]

         params[ y[0] ] = y[1]


         parsedParams.push([ z[0], z[1] ])


       }
     }

			var tmp = []

			if ( request.query ) {

				_.each( request.query, function( value, key ) {

					var req_query = []

					req_query.push( self.encodeData( key ) )
					req_query.push( self.encodeData( value ) )

					tmp.push( req_query )

				})

			}


			if ( request.body ) {

				_.each( request.body, function( value, key ) {

					var req_body = []

					req_body.push( self.encodeData( key ) )
					req_body.push( self.encodeData( value ) )

					tmp.push( req_body )

				})
			}

			var mergedParams = phpjs.array_merge( parsedParams, tmp )

			var parsedParams = this.sortParams( mergedParams )

      log.parsedParams = parsedParams

			var params = {}

      for ( var i in parsedParams ) {

				params[ parsedParams[i][0] ] = parsedParams[i][1]

			}


      var Tokens = new Token()

      Tokens.findCredentialsByToken( params.oauth_token, function ( error, appInfo ) {

        if ( error ) {

          // code breaks

          callback( error )

          return
        }

        var requestProtocol = 'http://'

        if ( process.env.NODE_ENV && process.env.NODE_ENV == 'production' ) {

          requestProtocol = 'https://'
        }

        var requesterUrl = requestProtocol + request.headers.host +  url.parse( request.url ).pathname

        log.requesterUrl = requesterUrl

        log.appInfo = appInfo

        var baseString = self.createBaseString( request.method, requesterUrl, parsedParams )

        log.baseString = baseString

        var secretKey = appInfo.consumerSecret + '&' + appInfo.token.secret

        log.secretKey = secretKey

        var signedSignature = self.signParams( baseString, secretKey )

        var signatureCheck = self.encodeData( signedSignature )

        var signature = params.oauth_signature

        log.receivedSignature = signature

        log.encodedSignature = signatureCheck


        if ( signature === signatureCheck ) {

          callback( null, appInfo, params )

        }
        else {

          callback({ 'code': 'Signature invalid', 'log': log })
        }

      })

		}

	}


  Utils.prototype.checkSignature = function( request, appInfo, params, parsedParams, callback ) {



	}

  Utils.prototype.generateAccessToken = function( appInfo, algorithm, callback ) {

		/* Generate access token using the keypair generator */

    var accessToken = this.generateKeypair( appInfo.consumerSecret, appInfo.tokenSecret + appInfo.callbackUrl, algorithm )

    callback( null, accessToken )

	}

  Utils.prototype.generateRequestToken = function ( OAuthParams, consumer, algorithm, callback ) {

		/*
			Generate the token based on the keypair
		*/

    var requestToken = this.generateKeypair( OAuthParams.oauth_nonce, consumer.secret + OAuthParams.oauth_signature, algorithm )

    requestToken.nonce = OAuthParams.oauth_nonce
    requestToken.timestamp = OAuthParams.oauth_timestamp
    requestToken.consumer = consumer
    requestToken.verifier = this.generateVerifier()

    callback( null, requestToken )

	}

  Utils.prototype.generateVerifier = function ( size ) {

    /*
      Generate verification code
    */

    var verifierSet = 'abcdefghijklmnopqrstuvwxyz0123456789' // range of verification chars
    var verifier = ''

    if ( size ) { size = size } else { size = 20 }

    for ( var i = 0; i < size; i++ ) {

      verifier += verifierSet[ Math.floor( Math.random() * verifierSet.length ) ]
    }

    return verifier
	}


  Utils.prototype.generateConsumer = function() {

		var consumer = this.generateKeypair( Date.now().toString(), '876x38712x6ve3i78xeg6' )

		return consumer

	}

  Utils.prototype.generateKeypair = function( generatorKey, string, algorithm ) {

		/*
			This method will generate keypair for the token
		*/

    if ( algorithm ) {

      algorithm = algorithm

    }
    else{

      algorithm = 'sha256'

    }

    /* Generate the keypair based on the key and algorithm */

    var key = crypto.createHmac( 'sha1', generatorKey )
      .update( Date.now().toString() )
      .digest( 'base64' )
        .replace( /\=/g, '.' )
        .replace( /\//g, '-' )
        .replace( /\+/g, '_' )

    var secret = crypto.createHmac( algorithm, key )
      .update( string )
      .digest( 'base64' )
      .replace( /\=/g, '.' )
      .replace( /\//g, '-' )
      .replace( /\+/g, '_' )

    var pair = { key: key, secret: secret }

    return pair

	}

  Utils.prototype.sortParams = function( params ) {

    params.sort( function ( a, b ) {

      if ( a[0] === b[0] ) {

        if ( a[1] < b[1] ) {

          return -1

        }
        else {

          return 1
        }

      }
      else {

        if ( a[0] < b[0] ) {

          return -1

        }
        else {

          return 1
        }

      }

    })

    return params
	}

  Utils.prototype.createBaseString = function( method, url, params ) {

    for ( var i in params ) {

      // remove oauth signature params on array
      if ( params[i][0] === 'oauth_signature' ) {

        params.splice( i, 1 )

        break
      }
    }

    url = this.encodeData( url )

    var mappedParams = params.map( function ( p ) { return p.join( '=' ); } ).join( '&' )

    var baseString = method.toUpperCase() + '&' + url + '&' + this.encodeData( mappedParams )

    return baseString

  }

  Utils.prototype.signParams = function( baseString, secretKey ) {

    var encodedParams = crypto.createHmac( 'sha1', secretKey ).update( baseString ).digest( 'base64' )

    return encodedParams

  }

  Utils.prototype.encodeData = function( data ) {

    if ( data === null || data === '' ) {

      return data

    }
    else {

      // replace symbols ! ' ( ) *

      var result = encodeURIComponent( data )

      return result.replace(/\!/g, "%21")
        .replace(/\'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29")
        .replace(/\*/g, "%2A")
      }

  }

  Utils.prototype.decodeData = function( data ) {

    if ( data !== null ) {

			data = data.replace(/\+/g, " ")

		}

    return decodeURIComponent( data )
  }


  module.exports = Utils

})()
