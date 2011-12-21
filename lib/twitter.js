/*!
 * Connect
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauth       = require('./oauth1'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = Twitter;

function Twitter(options) {
  this.options = {
    url : {
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

    if (url.pathname == '/auth/twitter') {
      return requestToken(req, res, next);
    }

    if (url.pathname == '/auth/twitter/callback') {
      return accessToken(req, res, next);
    }

    if (url.pathname == '/auth/twitter/logout') {
      
    }

    if (url.pathname == '/auth/twitter/user') {
      var user = {};
      if (req.session && req.session.auth && req.session.auth.twitter &&
          req.session.auth.twitter['oauth_token'] != undefined) {
        user = req.session.auth.twitter;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
      return;
    }

    next && next();
  };

  function requestToken(req, res, next) {
    var path = parse(req.headers.referer + req.url, true);
    console.log('path.href='+path.href);
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
        'oauth_callback'         : self.options.oauth['oauth_callback'] || 'oob'
        // oob (case sensitive) is out-of-band configuration
      }
    };

    oauth.post(options, function(err, data) {
      if (err) return next && next(err);

      req.session.auth = {};
      req.session.auth.twitter = {};
      req.session.auth.twitter['redirect_url']       = req.url;
      req.session.auth.twitter['oauth_token']        = data['oauth_token'];
      req.session.auth.twitter['oauth_token_secret'] = data['oauth_token_secret'];
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

    var options = {
      'url'     : self.options.url.access_token,
      'headers' : {},
      'body'    : {},
      'oauth'   : {
      //'realm'                  : '', // OPTIONAL
        'oauth_consumer_key'     : self.options.oauth['oauth_consumer_key'],
        'oauth_consumer_secret'  : self.options.oauth['oauth_consumer_secret'],
        'oauth_token'            : url.query.oauth_token,
        'oauth_token_secret'     : req.session.auth.twitter['oauth_token_secret'],
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

      req.session.auth.twitter['oauth_token']        = data['oauth_token'];
      req.session.auth.twitter['oauth_token_secret'] = data['oauth_token_secret'];

      req.session.auth.twitter['user_id']     = data['user_id'];
      req.session.auth.twitter['screen_name'] = data['screen_name'];

      res.writeHead(302, { 'Location': '/' });
      res.end();
    });
  }
}
