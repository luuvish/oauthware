/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */

var oauth       = require("../oauth1.js"),
    parse       = require("url").parse,
    querystring = require('querystring');

module.exports = function(options) {
  options = options || {};
  var that = {};
  var my = {};

  that.settings = {
    accessTokenUrl : "https://graph.facebook.com/oauth/access_token",
    authorizeUrl   : "https://graph.facebook.com/oauth/authorize",
    client_id      : options.appId,
    client_secret  : options.appSecret,
    callback       : options.callback,
    scope          : options.scope
  };

  // Construct the internal OAuth client
  my._oAuth = oauth;

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

      return my._oAuth.post(
        {
          url     : that.settings.accessTokenUrl,
          headers : {
            'Content-Type'  : 'application/x-www-form-urlencoded'
          },
          body    : {
            'client_id'     : that.settings.client_id,
            'client_secret' : that.settings.client_secret,
            'type'          : 'web_server',
            'code'          : url.query && url.query.code,
            'redirect_uri'  : that.settings.callback
          }
        },
        function(error, res) {
          if (error) return callback(error);

          request.session["access_token"]  = res["access_token"];
          request.session["refresh_token"] = res["refresh_token"];

          my._oAuth.get(
            {
              url     : "https://graph.facebook.com/me" + '&' + querystring.stringify({
                access_token : request.session["access_token"]              
              }),
              headers : {},
              body    : ''
            },
            function(error, res) {
              if (error) return self._facebook_fail(callback);
              self.success(res, callback);
            }
          );
        }
      );
    }

    request.session['facebook_redirect_url'] = request.url;
    this.redirect(
      response,
      that.settings.authorizeUrl + '&' + querystring.stringify({
        redirect_uri : that.settings.callback,
        scope        : that.settings.scope,
        client_id    : that.settings.client_id,
        type         : 'web_server'
      }),
      callback
    );
  };

  return that;
};
