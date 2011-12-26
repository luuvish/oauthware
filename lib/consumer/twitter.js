/*!
 * Twitter
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth       = require('../oauth'),
    connect     = require('connect'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = Twitter;

function Twitter(options) {
  if (!(this instanceof Twitter)) {
    return new Twitter(options);
  }

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
      login         : route + '/auth',
      callback      : route + '/callback',
      logout        : route + '/logout',
      user          : route + '/user',
      rest          : route + '/rest'
    },
    url : {
      base          : baseUri,
      callback      : baseUri + route + '/callback',
      request_token : 'http://api.twitter.com/oauth/request_token',
      access_token  : 'http://api.twitter.com/oauth/access_token',
      authenticate  : 'http://api.twitter.com/oauth/authenticate',
      authorize     : 'http://api.twitter.com/oauth/authorize',
      logout        : 'https://api.twitter.com/1/account/end_session.json',
      user          : 'https://api.twitter.com/1/account/verify_credentials.json',
      rest          : 'https://api.twitter.com/1'
    },
    oauth : {
      oauth_consumer_key     : options.consumerKey,
      oauth_consumer_secret  : options.consumerSecret,
      oauth_signature_method : 'HMAC-SHA1',
      oauth_version          : '1.0'
    }
  };

  return connect.router(function route(app) {
    app.get(self.options.route['login'], requestToken);
    app.get(self.options.route['callback'], accessToken);
    app.get(self.options.route['logout'], logout);
    app.get(self.options.route['user'], user);
    app.get(self.options.route['rest'], rest);
  });

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

      if ('true' != data['oauth_callback_confirmed']) {
        return next && next('oauth_callback_confirmed');
      }

      res.writeHead(302, {
        'Location' : self.options.url.authenticate + '?'
          + querystring.stringify({ oauth_token : data['oauth_token'] })
      });
      res.end();

      session(req, data);
    });
  }

  function accessToken(req, res, next) {
    var url = parse(req.url, true);

    //console.log('req.connection.encrypted=' + req.connection.encrypted);
    //console.log('req.connection.proxySecure=' + req.connection.proxySecure);
    //console.log('req.url=' + req.url);
    //console.log('req.method=' + req.method);
    //console.log('req.headers.host=' + req.headers['host']);

    if (!url.query || !url.query.oauth_token || !url.query.oauth_verifier) {
      return next && next('error');
    }

    var sess = session(req);

    if (undefined === sess['oauth_token_secret']) {
      return next && next('error');
    }

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

      if (undefined === data['oauth_token'] ||
          undefined === data['oauth_token_secret']) {
        return next && next('error');
      }

      res.writeHead(302, { 'Location': self.options.url.base });
      res.end();

      session(req, data);
    });
  }

  function logout(req, res, next) {
    var sess = session(req);

    if (undefined === sess['oauth_token']) {
      res.writeHead(302, { 'Location': self.options.url.base });
      res.end();

      session(req, {});
      return;
    }

    var options = {
      'url'     : self.options.url.logout,
      'headers' : {},
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : self.options.oauth['oauth_consumer_key'],
        'oauth_consumer_secret'  : self.options.oauth['oauth_consumer_secret'],
        'oauth_token'            : sess['oauth_token'],
        'oauth_token_secret'     : sess['oauth_token_secret'],
        'oauth_signature_method' : self.options.oauth['oauth_signature_method'],
      //'oauth_signature'        : '', // DON'T FILL
      //'oauth_timestamp'        : '', // DON'T FILL
      //'oauth_nonce'            : '', // DON'T FILL
        'oauth_nonce_length'     : 32  // DEFAULT 32
      //'oauth_version'          : ''  // DEFAULT '1.0'
      }
    };

    oauth.post(options, function(err, data) {
      if (err) next && next(err);

      res.writeHead(302, { 'Location': self.options.url.base });
      res.end();

      session(req, {});
    });
  }

  function user(req, res, next) {
    var sess = session(req);

    if (undefined === sess['oauth_token']) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
      return;
    }

    var options = {
      'url'     : self.options.url.user,
      'headers' : {},
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : self.options.oauth['oauth_consumer_key'],
        'oauth_consumer_secret'  : self.options.oauth['oauth_consumer_secret'],
        'oauth_token'            : sess['oauth_token'],
        'oauth_token_secret'     : sess['oauth_token_secret'],
        'oauth_signature_method' : self.options.oauth['oauth_signature_method'],
      //'oauth_signature'        : '', // DON'T FILL
      //'oauth_timestamp'        : '', // DON'T FILL
      //'oauth_nonce'            : '', // DON'T FILL
        'oauth_nonce_length'     : 32  // DEFAULT 32
      //'oauth_version'          : ''  // DEFAULT '1.0'
      }
    };

    oauth.get(options, function(err, data) {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(err);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  }

  function rest(req, res, next) {
    var sess = session(req);

    if (undefined === sess['oauth_token']) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
      return;
    }

    var options = {
      'url'     : self.options.url.user,
      'headers' : {},
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : self.options.oauth['oauth_consumer_key'],
        'oauth_consumer_secret'  : self.options.oauth['oauth_consumer_secret'],
        'oauth_token'            : sess['oauth_token'],
        'oauth_token_secret'     : sess['oauth_token_secret'],
        'oauth_signature_method' : self.options.oauth['oauth_signature_method'],
      //'oauth_signature'        : '', // DON'T FILL
      //'oauth_timestamp'        : '', // DON'T FILL
      //'oauth_nonce'            : '', // DON'T FILL
        'oauth_nonce_length'     : 32  // DEFAULT 32
      //'oauth_version'          : ''  // DEFAULT '1.0'
      }
    };

    oauth.get(options, function(err, data) {
      if (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(err);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    });
  }
}
