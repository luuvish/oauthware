/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var OAuth = require("../oauth1.js").OAuth,
    parse = require("url").parse;

module.exports = function(options) {
  options = options || {};
  var that = {};
  var my = {};

  // Construct the internal OAuth client
  my._oAuth = new OAuth("http://api.twitter.com/oauth/request_token",
                        "http://api.twitter.com/oauth/access_token", 
                        options.consumerKey,
                        options.consumerSecret,
                        "1.0",
                        options.callback || null,
                        "HMAC-SHA1");

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
      return my._oAuth.getOAuthAccessToken(
        url.query.oauth_token,
        request.session.auth["twitter_oauth_token_secret"],
        function(error, oauth_token, oauth_token_secret, additionalParameters) {
          if (error) {
            self.trace('Error retrieving the OAuth Access Token: ' + error);
            request.getAuthDetails()['twitter_login_attempt_failed'] = true;
            return this.fail(callback);
          }

          self.trace('Successfully retrieved the OAuth Access Token');

          request.session.auth["twitter_oauth_token"] = oauth_token;
          request.session.auth["twitter_oauth_token_secret"] = oauth_token_secret;

          var user = { user_id : additionalParameters.user_id,
                       username: additionalParameters.screen_name };
          self.executionResult.user = user; 
          self.success(user, callback);
        }
      );
    }

    this.trace('Phase 1/2 - Requesting an OAuth Request Token');
    my._oAuth.getOAuthRequestToken(
      function(error, oauth_token, oauth_token_secret, oauth_authorize_url) {
        if (error) {
          self.trace('Error retrieving the OAuth Request Token: ' + error);
          return callback(null); // Ignore the error upstream, treat as validation failure.
        }

        self.trace('Successfully retrieved the OAuth Request Token');

        request.session.auth['twitter_redirect_url'] = request.url;
        request.session.auth["twitter_oauth_token"] = oauth_token;
        request.session.auth["twitter_oauth_token_secret"] = oauth_token_secret;

        self.redirect(response, "http://twitter.com/oauth/authenticate?oauth_token=" + oauth_token, callback);
      }
    );
  };

  return that;
};
