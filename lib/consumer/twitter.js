/*!
 * Connect
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth       = require('../oauth'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = Twitter;

function Twitter(options) {
  var self    = this;
  var baseUri = options.baseUri || 'http://localhost/';
  var route   = options.route || '/twitter';

  if ('/' == baseUri[baseUri.length - 1]) {
    baseUri = baseUri.slice(0, -1);
  }
  if ('/' != route[0]) {
    route = '/' + route;
  }
  if ('/' == route[route.length - 1]) {
    route = route.slice(0, -1);
  }

  this.options = {
    route : {
      request_token : route + '/auth',
      access_token  : route + '/callback',
      logout        : route + '/logout',
      user          : route + '/user'
    },
    url : {
      base          : baseUri,
      callback      : baseUri + route + '/callback',
      request_token : 'http://api.twitter.com/oauth/request_token',
      access_token  : 'http://api.twitter.com/oauth/access_token',
      authenticate  : 'http://api.twitter.com/oauth/authenticate',
      authorize     : 'http://api.twitter.com/oauth/authorize'
    },
    oauth : {
      oauth_consumer_key     : options.consumerKey,
      oauth_consumer_secret  : options.consumerSecret,
      oauth_signature_method : 'HMAC-SHA1',
      oauth_version          : '1.0'
    }
  };

  return function route(app) {
    app.get(self.options.route['request_token'], requestToken);
    app.get(self.options.route['access_token'], accessToken);
    app.get(self.options.route['logout'], logout);
    app.get(self.options.route['user'], user);
  };

  function session(req, obj) {
    if (!req.session) return {};

    if (!req.session.auth)         req.session.auth = {};
    if (!req.session.auth.twitter) req.session.auth.twitter = {};
    if (undefined !== obj)         req.session.auth.twitter = obj;

    return req.session.auth.twitter;
  }

  function requestToken(req, res, next) {
    var url = parse(req.url, true);

    var options = {
      'url'     : self.options.url['request_token'],
      'headers' : '',
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : self.options.oauth['oauth_consumer_key'],
        'oauth_consumer_secret'  : self.options.oauth['oauth_consumer_secret'],
        'oauth_signature_method' : self.options.oauth['oauth_signature_method'],
      //'oauth_signature'        : '', // DON'T FILL
      //'oauth_timestamp'        : '', // DON'T FILL
      //'oauth_nonce'            : '', // DON'T FILL
        'oauth_nonce_length'     : 32, // DEFAULT 32
      //'oauth_version'          : '', // DEFAULT '1.0'
        'oauth_callback'         : self.options.url.callback || 'oob'
        // oob (case sensitive) is out-of-band configuration
      }
    };

    oauth.post(options, function(err, data) {
      if (err) return next && next(err);

      var sess = session(req);

      sess['redirect_url']       = req.url;
      sess['oauth_token']        = data['oauth_token'];
      sess['oauth_token_secret'] = data['oauth_token_secret'];
      if (data['oauth_callback_confirmed'] != 'true') return next && next(true);

      res.writeHead(302, {
        'Location': self.options.url.authenticate + '?'
          + querystring.stringify({ oauth_token : data['oauth_token'] })
      });
      res.end();
    });
  }

  function accessToken(req, res, next) {
    var url = parse(req.url, true);

    var sess = session(req);

    var options = {
      'url'     : self.options.url.access_token,
      'headers' : {},
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : self.options.oauth['oauth_consumer_key'],
        'oauth_consumer_secret'  : self.options.oauth['oauth_consumer_secret'],
        'oauth_token'            : url.query.oauth_token,
        'oauth_token_secret'     : sess['oauth_token_secret'],
        'oauth_signature_method' : self.options.oauth['oauth_signature_method'],
      //'oauth_signature'        : '', // DON'T FILL
      //'oauth_timestamp'        : '', // DON'T FILL
      //'oauth_nonce'            : '', // DON'T FILL
        'oauth_nonce_length'     : 32, // DEFAULT 32
      //'oauth_version'          : '', // DEFAULT '1.0'
        'oauth_verifier'         : url.query.oauth_verifier
      }
    };

    oauth.post(options, function(err, data) {
      if (err) next && next(err);

      sess['oauth_token']        = data['oauth_token'];
      sess['oauth_token_secret'] = data['oauth_token_secret'];

      sess['me'] = {
        'user_id'     : data['user_id'],
        'screen_name' : data['screen_name']
      };

      res.writeHead(302, { 'Location': self.options.url.base });
      res.end();
    });
  }

  function logout(req, res, next) {
    var url = parse(req.url, true);

    session(req, {});

    res.writeHead(302, { 'Location': self.options.url.base });
    res.end();
  }

  function user(req, res, next) {
    var sess = session(req);
    var user = '{}';

    if (sess['oauth_token'] !== undefined) user = JSON.stringify(sess['me']);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(user);
  }
}
