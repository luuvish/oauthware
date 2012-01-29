/*!
 * OAuthware - OAuth - OAuth2.0
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
 * expose OAuth2 constructor as the module
 */

exports = module.exports = OAuth2;

/**
 * OAuth version 2.0 Constructor
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
 *   new OAuth2({
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
 *       'access_token':  'Access Token URL',
 *       'authorize':     'User Authorization URL',
 *       'api':           'Accessing Protected Resource URL'
 *     },
 *     'additional': {
 *       'access_token':  { Additional parameters ... },
 *       'authorize':     { Additional parameters ... },
 *       'api':           { Additional parameters ... }
 *     }
 *   })
 *
 * @param {Object} options
 * @param {Object} defaults
 * @return {OAuth2}
 */

function OAuth2(options) {
  var self = this.configure(options);

  this.name = self.name;
  this.path = self.path;
  this.host = self.host;
  this.additional = self.additional;

  this.oauth = {
    'type':          options.type || 'web_server',
    'client_id':     options.clientId || options.appId,
    'client_secret': options.clientSecret || options.appSecret,
    'state':         options.state,
    'scope':         options.scope
  };

  if ('undefined' === typeof this.oauth['client_id']) {
    throw new Error('client_id must be defined');
  }
  if ('undefined' === typeof this.oauth['client_secret']) {
    throw new Error('client_secret must be defined');
  }
  if ('web_server' !== this.oauth['type'] && 'user_agent' !== this.oauth['type']) {
    throw new Error('type must be web_server or user_agent');
  }
}

OAuth2.prototype.constructor = OAuth2;

OAuth2.prototype.configure = common.configure;
OAuth2.prototype.merge     = common.merge;
OAuth2.prototype.mime      = common.mime;

OAuth2.prototype.login = function login(handler) {
  var self = this,
      sess = handler.session(),
      query;

  query = self.merge({
    'type':         self.oauth['type'],
    'client_id':    self.oauth['client_id'],
    'redirect_uri': self.host['callback']
  }, self.additional['authorize']);

  if ('undefined' !== typeof self.oauth['state']) {
    query['state'] = self.oauth['state'];
  }
  if ('undefined' !== typeof self.oauth['scope']) {
    query['scope'] = self.oauth['scope'];
  }

  handler.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
};

OAuth2.prototype.logout = function logout(handler) {
  var self = this,
      sess = handler.session(),
      query;

  if (!self.host['logout'] || 'undefined' === typeof sess['access_token']) {
    handler.redirect(self.host['base']);
    handler.session({});
    return;
  }

  query = self.merge({
    'next':         self.host['base'],
    'access_token': sess['access_token']
  }, self.additional['logout']);

  handler.redirect(self.host['logout'] + '?' + querystring.stringify(query));
  handler.session({});
};

OAuth2.prototype.auth = function auth(handler) {
  var self  = this,
      sess  = handler.session(),
      query = handler.query;

  (function validate() {
    if ('undefined' === typeof query) return false;

    if ('undefined' !== typeof query['error']) return false;
      // error MUST be set to user_denied
      // url.query.error = 'access_denied'
      // url.query.error_reason = 'user_denied'
      // url.query.error_description = 'The user denied your request'

    if ('web_server' === self.oauth['type']) {
      if ('undefined' === typeof query['code']) return false;
    }

    // Facebook defines response_type=token instead of type=user_agent
    if ('user_agent' === self.oauth['type']) {
      if ('undefined' === typeof query['access_token']) return false;
      if ('undefined' !== typeof query['expires_in']) {}
    }

    if ('undefined' !== typeof self.oauth['state']) {
      if ('undefined' === typeof query['state']) return false;
      if (self.oauth['state'] != query['state']) return false;
    }

    return true;
  }());

  if ('user_agent' === self.oauth['type']) {
    handler.session({
      'access_token': query['access_token'],
      'expires_in':   query['expires_in']
    });
    return;
  }

  options = self.merge({
    url: self.host['access_token'],
    body: {
      'type':          self.oauth['type'],
      'client_id':     self.oauth['client_id'],
      'client_secret': self.oauth['client_secret'],
      'redirect_uri':  self.host['callback'],
      'code':          query['code']
    }
  }, self.additional['access_token']);

  request.post(options, function(err, data) {
    // 400 Bad Request
    // error = 'incorrect_client_credentials'
    // Facebook
    // error.type = 'OAuthException'
    // error.message = 'Error validating verification code.'
    if (err) return handler.error(err);

    data = self.mime(data);

    if ('undefined' === typeof data['access_token']) {
      return handler.error(new Error('error'));
    }
    // 'expires_in'
    // 'refresh_token'
    // 'scope'

    handler.redirect(self.host['base']);
    handler.session(data);
  });
};

OAuth2.prototype.api = function api(handler) {
  var self = this,
      sess = handler.session();

  if ('undefined' === typeof sess['access_token']) {
    handler.json({});
    return;
  }

  options = self.merge({
    method: handler.method,
    url:    self.host['api'] + handler.params,
    query:  {access_token: sess['access_token']}
  }, self.additional['api']);

  request(options, function(err, data) {
    if (err) return; //handle.error(err);

    data = self.mime(data);
    handler.json(data);
  });
};
