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
  this.options = {
    url : {
      mount         : options.mount,
      request_token : 'http://api.twitter.com/oauth/request_token',
      access_token  : 'http://api.twitter.com/oauth/access_token',
      authenticate  : 'http://api.twitter.com/oauth/authenticate',
      authorize     : 'http://api.twitter.com/oauth/authorize'
    },
    oauth : {
      oauth_consumer_key     : options.consumerKey,
      oauth_consumer_secret  : options.consumerSecret,
      oauth_signature_method : 'HMAC-SHA1',
      oauth_version          : '1.0',
      oauth_callback         : options.callback || ''
    }
  };

  var self = this;

  return function (req, res, next) {
    var url = parse(req.url, true);

    if (url.pathname == self.options.url.mount) {
      return requestToken(req, res, next);
    }
    if (url.pathname == self.options.url.mount + '/callback') {
      return accessToken(req, res, next);
    }
    if (url.pathname == self.options.url.mount + '/logout') {
      return logout(req, res, next);
    }
    if (url.pathname == self.options.url.mount + '/user') {
      return user(req, res, next);
    }

    next && next();
  };

  function session(req, obj) {
    if (!req.session) return {};

    if (!req.session.auth)         req.session.auth = {};
    if (!req.session.auth.twitter) req.session.auth.twitter = {};
    if (undefined !== obj)         req.session.auth.twitter = obj;

    return req.session.auth.twitter;
  }

  function requestToken(req, res, next) {
    var url  = req.url[0] == '/' ? req.url.substring(1) : req.url;
    var path = parse(req.headers.referer + url, true);

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
        'oauth_callback'         : path.href + '/callback' // self.options.oauth['oauth_callback'] || 'oob'
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

      res.writeHead(302, { 'Location': '/' });
      res.end();
    });
  }

  function logout(req, res, next) {
    session(req, {});

    res.writeHead(302, { 'Location': '/' });
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
