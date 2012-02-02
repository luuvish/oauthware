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
 * @return {OAuth2}
 */

function OAuth2(options) {
  var self = this.configure(options);

  this.name = self.name;
  this.path = self.path;
  this.host = self.host;
  this.additional = self.additional;

  this.oauth = {
    'response_type': options.response_type || 'code',
    'grant_type':    options.grant_type || 'authorization_code',
    'client_id':     options.clientId || options.appId,
    'client_secret': options.clientSecret || options.appSecret,
    'scope':         options.scope,
    'state':         options.state
  };

  if (!(this.oauth['response_type'] in {'code':0, 'token':1})) {
    throw new Error('response_type must be code or token');
  }
  if (!(this.oauth['grant_type'] in {'authorization_code':0, 'password':1})) {
    throw new Error('grant_type must be authorization_code or password');
  }
  if ('undefined' === typeof this.oauth['client_id']) {
    throw new Error('client_id must be defined');
  }
  if ('undefined' === typeof this.oauth['client_secret']) {
    throw new Error('client_secret must be defined');
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

  query = {
    'response_type': self.oauth['response_type'],
    'client_id':     self.oauth['client_id']
  };

  if ('undefined' !== typeof self.host['callback']) {
    query['redirect_uri'] = self.host['callback'];
  }
  if ('undefined' !== typeof self.oauth['scope']) {
    query['scope'] = self.oauth['scope'];
  }
  if ('undefined' !== typeof self.oauth['state']) {
    query['state'] = self.oauth['state'];
  }

  self.merge(query, self.additional['authorize']);

  handler.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
};

OAuth2.prototype.login.check = function check() {
  return true;
};

OAuth2.prototype.login.hook = function hook() {
  return true;
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

  function validate() {
    if ('undefined' === typeof query) return false;

    if ('undefined' !== typeof query['error']) return false;
      // error is REQUIRED
      //   invalid_request/unauthorized_client/access_denied/unsupported_response_type
      //   invalid_scope/server_error/temporarily_unavailable
      // error_description is OPTIONAL
      // error_uri is OPTIONAL

    if ('code' === self.oauth['response_type']) {
      if ('undefined' === typeof query['code']) return false;
      if ('authorization_code' !== self.oauth['grant_type']) return false;
    }

    if ('token' === self.oauth['response_type']) {
      if ('undefined' === typeof query['access_token']) return false;
      if ('undefined' === typeof query['token_type']) return false;
    }

    if ('password' === self.oauth['grant_type']) {
      if ('undefined' === typeof self.oauth['username']) return false;
      if ('undefined' === typeof self.oauth['password']) return false;
    }

    if ('undefined' !== typeof self.oauth['state']) {
      if ('undefined' === typeof query['state']) return false;
      if (self.oauth['state'] != query['state']) return false;
    }

    return true;
  }

  if (!validate()) {
    return handler.error(new Error('validate'));
  }

  options = self.merge({
    url: self.host['access_token'],
    body: {
      'grant_type':    self.oauth['grant_type'],
      'client_id':     self.oauth['client_id'],
      'client_secret': self.oauth['client_secret'],
      'code':          query['code'],
      'redirect_uri':  self.host['callback']
    }
  }, self.additional['access_token']);

  request.post(options, function(err, data) {
    if (err) return handler.error(err);

    data = self.mime(data);

    if ('undefined' === typeof data['access_token']) {
      return handler.error(new Error('error'));
    }

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
