/*!
 * OAuthware - OAuth - OAuth2
 * Copyright(c) 2011 CodeHolics Inc.
 * Copyright(c) 2011 Injo Luuvish Hwang
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var OAuthcore   = require('./oauthcore'),
    request     = require('./request'),
    parse       = require('url').parse,
    querystring = require('querystring');


exports = module.exports = OAuth2;


function OAuth2(options, defaults) {
  OAuthcore.call(this, options, defaults);

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

OAuth2.prototype = Object.create(OAuthcore.prototype);
OAuth2.prototype.constructor = OAuth2;

OAuth2.prototype.login = function login(handle) {
  var self = this;
  var sess = handle.session();

  var query = {
    'type':         self.oauth['type'],
    'client_id':    self.oauth['client_id'],
    'redirect_uri': self.host['callback']
  };

  if ('undefined' !== typeof self.oauth['state']) {
    query['state'] = self.oauth['state'];
  }
  if ('undefined' !== typeof self.oauth['scope']) {
    query['scope'] = self.oauth['scope'];
  }

  handle.redirect(self.host['authorize'] + '?' + querystring.stringify(query));
};

OAuth2.prototype.logout = function logout(handle) {
  var self = this;
  var sess = handle.session();

  if ('undefined' === typeof sess['access_token'] || !self.host['logout']) {
    handle.redirect(self.host['base']);
    handle.session({});
    return;
  }

  var query = {
    'next':         self.host['base'],
    'access_token': sess['access_token']
  };

  handle.redirect(self.host['logout'] + '?' + querystring.stringify(query));
  handle.session({});
};

OAuth2.prototype.auth = function auth(handle) {
  var self = this;
  var sess = handle.session();
  var query = handle.query;

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
    handle.session({
      'access_token': query['access_token'],
      'expires_in':   query['expires_in']
    });
    return;
  }

  var options = {
    url: self.host['access_token'],
    body: {
      'type':          self.oauth['type'],
      'client_id':     self.oauth['client_id'],
      'client_secret': self.oauth['client_secret'],
      'redirect_uri':  self.host['callback'],
      'code':          query['code']
    }
  };

  request.post(options, function(err, data) {
    // 400 Bad Request
    // error = 'incorrect_client_credentials'
    // Facebook
    // error.type = 'OAuthException'
    // error.message = 'Error validating verification code.'
    if (err) return handle.error(err);

    data = self.mime(data);

    if ('undefined' === typeof data['access_token']) {
      return handle.error(err);
    }
    // 'expires_in'
    // 'refresh_token'
    // 'scope'

    handle.redirect(self.host['base']);
    handle.session(data);
  });
};

OAuth2.prototype.api = function api(handle) {
  var self = this;
  var sess = handle.session();

  if ('undefined' === typeof sess['access_token']) {
    handle.json({});
    return;
  }

  var options = {
    method: handle.method,
    url:    self.host['api'] + handle.params,
    query:  {access_token: sess['access_token']}
  };

  request(options, function(err, data) {
    if (err) return res.end(err);

    data = self.mime(data);
    handle.json(data);
  });
};
