/*!
 * OAuthware - OAuth - OAuth1.0
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var common      = require('./common'),
    request     = require('./request'),
    querystring = require('querystring');

/**
 * expose OAuth1 constructor as the module
 */

exports = module.exports = OAuth1;

/**
 * OAuth version 1.0 Constructor
 *
 * Options:
 *
 *   - 'name'    OAuth service name
 *   - 'path'    HTTP request route paths
 *   - 'host'    OAuth service request URLs
 *   - 'additional'  Additional parameters, as defined by the Service Provider
 *
 * Examples:
 *
 *   new OAuth1({
 *     'name': 'Service name',
 *     'path': {
 *       'base':          'Base route path',
 *       'login':         'Login route path',
 *       'logout':        'Logout route path',
 *       'authorized':    'Authorization redirect route path',
 *       'api':           'Accessing Protected Resource route path'
 *     },
 *     'host': {
 *       'base':          'Service Base URL',
 *       'authorized':    'An absolute URL to which the Service Provider will redirect
 *                         the User back when the Obtaining User Authorization step is completed',
 *       'request_token': 'Request Token URL',
 *       'access_token':  'Access Token URL',
 *       'authorize':     'User Authorization URL',
 *       'api':           'Accessing Protected Resource URL'
 *     },
 *     'additional': {
 *       'request_token': { Additional parameters ... },
 *       'access_token':  { Additional parameters ... },
 *       'authorize':     { Additional parameters ... },
 *       'api':           { Additional parameters ... }
 *     }
 *   })
 *
 * @param {Object} options
 * @return {OAuth1}
 */

function OAuth1(options) {
  var self = this.configure(options);

  this.name = self.name;
  this.path = self.path;
  this.host = self.host;
  this.additional = self.additional;

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

OAuth1.prototype.constructor = OAuth1;

OAuth1.prototype.configure = common.configure;
OAuth1.prototype.merge     = common.merge;
OAuth1.prototype.mime      = common.mime;

OAuth1.prototype.login = function login(handler) {
  var self = this,
      sess = handler.session(),
      options, query;

  options = self.merge({
    'url': self.host['request_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  }, self.additional['request_token']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    query = self.merge({
      oauth_token:    data['oauth_token'],
      oauth_callback: self.host['callback']
    }, self.additional['authorize']);

    handler.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
    handler.session(data);
  });
};

OAuth1.prototype.logout = function logout(handler) {
  var self = this,
      sess = handler.session(),
      options;

  if (!self.host['logout'] || 'undefined' === typeof sess['oauth_token']) {
    handler.redirect(self.host['base']);
    handler.session({});
    return;
  }

  options = self.merge({
    'url': self.host['logout'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  }, self.additional['logout']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    handler.redirect(self.host['base']);
    handler.session({});
  });
};

OAuth1.prototype.auth = function auth(handler) {
  var self = this,
      sess = handler.session(),
      options,
      query = handler.query;

  if (!query || !query.oauth_token) {
    return handler.error(new Error('error'));
  }

  options = self.merge({
    'url': self.host['access_token'],
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            query.oauth_token,
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  }, self.additional['access_token']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    if ('undefined' === typeof data['oauth_token'] ||
        'undefined' === typeof data['oauth_token_secret']) {
      return handler.error(new Error('error'));
    }

    handler.redirect(self.host['base']);
    handler.session(data);
  });
};

OAuth1.prototype.api = function api(handler) {
  var self = this,
      sess = handler.session(),
      options;

  if ('undefined' === typeof sess['oauth_token'] ||
      'undefined' === typeof sess['oauth_token_secret']) {
    handler.json({});
    return;
  }

  options = self.merge({
    'method': handler.method,
    'url': self.host['api'] + handler.params,
    'oauth': {
      'oauth_consumer_key':     self.oauth['oauth_consumer_key'],
      'oauth_consumer_secret':  self.oauth['oauth_consumer_secret'],
      'oauth_token':            sess['oauth_token'],
      'oauth_token_secret':     sess['oauth_token_secret'],
      'oauth_signature_method': self.oauth['oauth_signature_method'],
      'oauth_nonce_length':     32
    }
  }, self.additional['api']);

  request(options, function(err, data) {
    if (err) return; //handler.error(err);

    data = self.mime(data);
    handler.json(data);
  });
};
