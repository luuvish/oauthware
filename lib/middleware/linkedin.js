/*!
 * OAuthware - Middleware - Linkedin
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauthcore   = require('../oauth/oauthcore'),
    OAuth1      = require('../oauth/oauth1'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = Linkedin;


function Linkedin(options) {
  if (!(this instanceof Linkedin)) {
    return new Linkedin(options);
  }

  var defaults = {
    name: 'linkedin',
    host: {
      'request_token': 'https://api.linkedin.com/uas/oauth/requestToken',
      'access_token':  'https://api.linkedin.com/uas/oauth/accessToken',
      'authenticate':  'https://api.linkedin.com/uas/oauth/authenticate',
      'authorize':     'https://api.linkedin.com/uas/oauth/authorize',
      'signout':       '',
      'api':           'https://api.linkedin.com/v1'
    }
  };

  OAuth1.call(this, options, defaults);
}

Linkedin.prototype = Object.create(OAuth1.prototype);
Linkedin.prototype.constructor = Linkedin;

Linkedin.prototype.signIn = function signIn(req, res, next) {
  OAuth1.prototype.login.call(this, req, res, next);
  // data.type = 'text/plain'
};

Linkedin.prototype.signOut = function signOut(req, res, next) {
  var self = this;

  res.writeHead(302, {'Location': self.host['base']});
  res.end();

  self.session(req, {});
};

Linkedin.prototype.authenticate = function authenticate(req, res, next) {
  OAuth1.prototype.auth.call(this, req, res, next);
  // data.type === 'text/plain'
};

Linkedin.prototype.api = function api(req, res, next) {
  var self = this;
  var sess = self.session(req);

  if ('undefined' === typeof sess['oauth_token'] ||
      'undefined' === typeof sess['oauth_token_secret']) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end('{}');
    return;
  }

  var options = {
    'url': self.host['api'] + req.params,
    'headers': {
      'x-li-format': 'json'
    },
    'body': {},
    'oauth': {
    //'realm':                  '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32  // DEFAULT 32
    //'oauth_version':          ''  // DEFAULT '1.0'
    }
  };

  oauthcore.get(options, function(err, data) {
    res.writeHead(200, {'Content-Type': 'application/json'});

    if (err) return res.end(err);

    data = self.mime(data);
    res.end(JSON.stringify(data));
  });
};
