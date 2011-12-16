/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var oauth = require("../oauth2.js").OAuth2,
    parse = require("url").parse;

module.exports = function(options) {
  options = options || {};
  var that = {};
  var my = {};

  // Construct the internal OAuth client
  my._oAuth = new oauth(options.appId, options.appSecret, "https://graph.facebook.com");
  my._redirectUri = options.callback;
  my.scope = options.scope || "";

  // Give the strategy a name
  that.name = options.name || "facebook";

  // Build the authentication routes required 
  that.router = function(app) {
    app.get('/auth/facebook', function(req, res, next) {
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
    app.get('/auth/facebook_callback', function(req, res, next){
      req.authenticate([that.name], function(error, authenticated) {
        res.writeHead(303, { 'Location': req.session.facebook_redirect_url });
        res.end('');
      });
    });
  };

  // Declare the method that actually does the authentication
  that.authenticate = function(request, response, callback) {
    //todo: makw the call timeout ....
    var url = parse(request.url, true);
    var self = this; 
    this._facebook_fail = function(callback) {
      request.getAuthDetails()['facebook_login_attempt_failed'] = true;
      this.fail(callback);
    };

    if (request.getAuthDetails()['facebook_login_attempt_failed'] === true) {
      // Because we bounce through authentication calls across multiple requests
      // we use this to keep track of the fact we *Really* have failed to authenticate
      // so that we don't keep re-trying to authenticate forever.
      delete request.getAuthDetails()['facebook_login_attempt_failed'];
      return this.fail(callback);
    }

    if (url.query && (url.query.code || url.query.error_reason === 'user_denied')) {
      if (url.query.error_reason == 'user_denied') return this._facebook_fail(callback);

      return my._oAuth.getOAuthAccessToken(
        url.query && url.query.code,
        { redirect_uri: my._redirectUri },
        function(error, access_token, refresh_token) {
          if (error) return callback(error);

          request.session["access_token"]  = access_token;
          request.session["refresh_token"] = refresh_token;

          my._oAuth.getProtectedResource(
            "https://graph.facebook.com/me",
            request.session["access_token"],
            function(error, data, response) {
              if (error) return self._facebook_fail(callback);
              self.success(JSON.parse(data), callback);
            }
          );
        }
      );
    }

    request.session['facebook_redirect_url'] = request.url;
    this.redirect(
      response,
      my._oAuth.getAuthorizeUrl({redirect_uri : my._redirectUri, scope: my.scope }),
      callback
    );
  };

  return that;
};
