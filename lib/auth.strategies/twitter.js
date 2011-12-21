/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var oauth = require("../oauth1.js"),
    parse = require("url").parse;

module.exports = function(options) {
  options = options || {};
  var that = {};
  var my = {};

  that.settings = {
    requestUrl      : 'http://api.twitter.com/oauth/request_token',
    accessUrl       : 'http://api.twitter.com/oauth/access_token',
    authorizationUrl: 'http://api.twitter.com/oauth/authenticate',
    consumerKey     : options.consumerKey,
    consumerSecret  : options.consumerSecret,
    signatureMethod : 'HMAC-SHA1',
    version         : '1.0',
    callback        : options.callback || ''
  };

  // Give the strategy a name
  that.name = options.name || "twitter";

  // Build the authentication routes required 
  that.router = function(app) {
    app.get('/auth/twitter', function(req, res, next) {
      req.authenticate([that.name], function(error, authenticated) {
        if (error) {
          console.log(error);
          return res.end();
        }
        if (authenticated !== undefined) {
          res.statusCode = 301;
          res.setHeader('Location', '/');
          res.end('Redirecting to ' + '/');
        }
      });
    });
    app.get('/auth/twitter_callback', function(req, res, next) {
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.auth['twitter_redirect_url'] });
        res.end('');
      });
    });
  };

  // Declare the method that actually does the authentication
  that.authenticate = function(request, response, callback) {
    //todo: if multiple connect middlewares were doing this, it would be more efficient to do it in the stack??
    var url = parse(request.url, true);

    //todo: makw the call timeout ....
    var self = this;
    if (request.getAuthDetails()['twitter_login_attempt_failed'] === true) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['twitter_login_attempt_failed'];
      return this.fail(callback);
    }

    if (url.query && url.query.denied) {
      this.trace('User denied OAuth Access');
      request.getAuthDetails()['twitter_login_attempt_failed'] = true;
      return this.fail(callback);
    }

    if (url.query && url.query.oauth_token &&
        request.session.auth["twitter_oauth_token_secret"]) {
      this.trace('Phase 2/2 : Requesting an OAuth access token.');
      return oauth.request({
        'method'  : 'POST',
        'url'     : that.settings.accessUrl,
        'headers' : {},
        'body'    : {},
        'oauth'   : {
        //'realm'                  : '', // OPTIONAL
          'oauth_consumer_key'     : that.settings.consumerKey,
          'oauth_consumer_secret'  : that.settings.consumerSecret,
          'oauth_token'            : url.query.oauth_token,
          'oauth_token_secret'     : request.session.auth["twitter_oauth_token_secret"],
          'oauth_signature_method' : that.settings.signatureMethod,
        //'oauth_signature'        : '', // DON'T FILL
        //'oauth_timestamp'        : '', // DON'T FILL
        //'oauth_nonce'            : '', // DON'T FILL
          'oauth_nonce_length'     : 32, // DEFAULT 32
        //'oauth_version'          : '', // DEFAULT '1.0'
          'oauth_verifier'         : url.query.oauth_verifier
        }
      }, function(error, res) {
          if (error) {
            self.trace('Error retrieving the OAuth Access Token: ' + error);
            request.getAuthDetails()['twitter_login_attempt_failed'] = true;
            return this.fail(callback);
          }

          self.trace('Successfully retrieved the OAuth Access Token');

          request.session.auth["twitter_oauth_token"]        = res["oauth_token"];
          request.session.auth["twitter_oauth_token_secret"] = res["oauth_token_secret"];

          var user = { user_id : res['user_id'], username: res['screen_name'] };
          self.executionResult.user = user; 
          self.success(user, callback);
        }
      );
    }

    this.trace('Phase 1/2 - Requesting an OAuth Request Token');
    oauth.request({
      'method'  : 'POST',
      'url'     : that.settings.requestUrl,
      'headers' : '',
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : that.settings.consumerKey,
        'oauth_consumer_secret'  : that.settings.consumerSecret,
        'oauth_signature_method' : that.settings.signatureMethod,
      //'oauth_signature'        : '', // DON'T FILL
      //'oauth_timestamp'        : '', // DON'T FILL
      //'oauth_nonce'            : '', // DON'T FILL
        'oauth_nonce_length'     : 32, // DEFAULT 32
      //'oauth_version'          : '', // DEFAULT '1.0'
        'oauth_callback'         : that.settings.callback || 'oob'
        // oob (case sensitive) is out-of-band configuration
      }
    }, function(error, res) {
      if (error) {
        self.trace('Error retrieving the OAuth Request Token: ' + error);
        return callback(null); // Ignore the error upstream, treat as validation failure.
      }

      self.trace('Successfully retrieved the OAuth Request Token');

      var oauth_token              = res['oauth_token'];
      var oauth_token_secret       = res['oauth_token_secret'];
      var oauth_callback_confirmed = res['oauth_callback_confirmed'];

      request.session.auth['twitter_redirect_url']       = request.url;
      request.session.auth["twitter_oauth_token"]        = oauth_token;
      request.session.auth["twitter_oauth_token_secret"] = oauth_token_secret;

      self.redirect(response, that.settings.authorizationUrl + "?oauth_token=" + oauth_token, callback);
    });
  };

  return that;
};
