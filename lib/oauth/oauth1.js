/*!
 * OAuth1
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var oauthcore   = require('./oauthcore'),
    OAuth0      = require('./oauth0'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = OAuth1;


function OAuth1(options, defaults) {
  OAuth0.call(this, options, defaults);

  this.oauth = {
    'oauth_consumer_key':     options.consumerKey,
    'oauth_consumer_secret':  options.consumerSecret,
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_version':          '1.0'
  };

  if ('undefined' === typeof this.oauth['oauth_consumer_key']) {
    throw new Error('oauth_consumer_key must be defined');
  }
  if ('undefined' === typeof this.oauth['oauth_consumer_secret']) {
    throw new Error('oauth_consumer_secret must be defined');
  }
}

OAuth1.prototype = Object.create(OAuth0.prototype);
OAuth1.prototype.constructor = OAuth1;

OAuth1.prototype.login = function login(req, res, next) {
  var self = this;
  var sess = self.session(req);

  var options = {
    'url': self.host['request_token'],
    'headers': '',
    'body': {},
    'oauth': {
    //'realm':                  '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32, // DEFAULT 32
    //'oauth_version':          '', // DEFAULT '1.0'
      'oauth_callback':         self.host['callback'] || 'oob'
      // oob (case sensitive) is out-of-band configuration
    }
  };

  oauthcore.post(options, function(err, data) {
    if (err) return next && next(err);

    data = self.mime(data);

    if ('true' !== data['oauth_callback_confirmed']) {
      return next && next(new Error('oauth_callback_confirmed must be true'));
    }

    res.writeHead(302, {
      'Location': self.host['authorize'] + '?' + querystring.stringify({
        oauth_token: data['oauth_token'],
        force_login: 'true'
      })
    });
    res.end();

    self.session(req, data);
  });
};

OAuth1.prototype.logout = function logout(req, res, next) {
  var self = this;
  var sess = self.session(req);

  if ('undefined' === typeof sess['oauth_token']) {
    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    self.session(req, {});
    return;
  }

  var options = {
    'url': self.host['signout'],
    'headers': {},
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

  oauthcore.post(options, function(err, data) {
    if (err) next && next(err);

    data = self.mime(data);

    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    self.session(req, {});
  });
};

OAuth1.prototype.auth = function auth(req, res, next) {
  var self = this;
  var sess = self.session(req);
  var url = parse(req.url, true);

  //console.log('req.connection.encrypted=' + req.connection.encrypted);
  //console.log('req.connection.proxySecure=' + req.connection.proxySecure);
  //console.log('req.url=' + req.url);
  //console.log('req.method=' + req.method);
  //console.log('req.headers.host=' + req.headers['host']);

  if (!url.query || !url.query.oauth_token || !url.query.oauth_verifier) {
    return next && next('error');
  }

  if ('undefined' === typeof sess['oauth_token_secret']) {
    return next && next('error');
  }

  var options = {
    'url': self.host['access_token'],
    'headers': {},
    'body': {},
    'oauth': {
    //'realm':                 '', // OPTIONAL
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            url.query.oauth_token,
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
    //'oauth_signature':        '', // DON'T FILL
    //'oauth_timestamp':        '', // DON'T FILL
    //'oauth_nonce':            '', // DON'T FILL
      'oauth_nonce_length':     32, // DEFAULT 32
    //'oauth_version':          '', // DEFAULT '1.0'
      'oauth_verifier':         url.query.oauth_verifier
    }
  };

  oauthcore.post(options, function(err, data) {
    if (err) next && next(err);

    data = self.mime(data);

    if ('undefined' === typeof data['oauth_token'] ||
        'undefined' === typeof data['oauth_token_secret']) {
      return next && next('error');
    }

    res.writeHead(302, {'Location': self.host['base']});
    res.end();

    self.session(req, data);
  });
};

OAuth1.prototype.api = function api(req, res, next) {
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
    'headers': {},
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
